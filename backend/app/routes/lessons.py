from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.lesson import Lesson
from app.models.lesson_user import LessonUser
from app.models.lesson_library import LessonLibrary
from app.models.credit import Credit
from app.utils.auth_helpers import get_current_user

lessons_bp = Blueprint("lessons", __name__)


def _lesson_visible_to(user):
    """Return a query filtered to lessons the user can see."""
    if user.profile == "Admin":
        return Lesson.query
    # Teachers and students see lessons they participate in
    participated_ids = db.session.query(LessonUser.lesson_id).filter_by(user_id=user.user_id)
    return Lesson.query.filter(Lesson.lesson_id.in_(participated_ids))


@lessons_bp.route("", methods=["GET"])
@jwt_required()
def list_lessons():
    user = get_current_user()
    lessons = _lesson_visible_to(user).order_by(Lesson.lesson_dt).all()
    return jsonify([l.to_dict() for l in lessons])


@lessons_bp.route("/<int:lesson_id>", methods=["GET"])
@jwt_required()
def get_lesson(lesson_id):
    user = get_current_user()
    lesson = _lesson_visible_to(user).filter_by(lesson_id=lesson_id).first_or_404()
    return jsonify(lesson.to_dict())


@lessons_bp.route("", methods=["POST"])
@jwt_required()
def create_lesson():
    user = get_current_user()
    if user.profile not in ("Admin", "Teacher"):
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json()
    if not data.get("lesson_dt"):
        return jsonify({"error": "lesson_dt is required"}), 400

    lesson = Lesson(
        lesson_dt=datetime.fromisoformat(data["lesson_dt"]),
        description=data.get("description"),
        assignment=data.get("assignment"),
        credit_cost=float(data.get("credit_cost") or 0),
        created_by=user.user_id,
    )
    db.session.add(lesson)
    db.session.flush()  # get lesson_id before adding participants

    # Add creator as a teacher participant automatically
    db.session.add(LessonUser(lesson_id=lesson.lesson_id, user_id=user.user_id, user_as="Teacher"))

    for pid in data.get("teacher_ids", []):
        if pid != user.user_id:
            db.session.add(LessonUser(lesson_id=lesson.lesson_id, user_id=pid, user_as="Teacher"))
    for pid in data.get("student_ids", []):
        db.session.add(LessonUser(lesson_id=lesson.lesson_id, user_id=pid, user_as="Student"))
    for lid in data.get("library_ids", []):
        db.session.add(LessonLibrary(lesson_id=lesson.lesson_id, library_id=lid))

    db.session.commit()
    return jsonify(lesson.to_dict()), 201


@lessons_bp.route("/<int:lesson_id>", methods=["PUT"])
@jwt_required()
def update_lesson(lesson_id):
    user = get_current_user()
    lesson = Lesson.query.get_or_404(lesson_id)

    if lesson.created_by != user.user_id:
        return jsonify({"error": "Only the lesson creator can edit this lesson"}), 403

    data = request.get_json()
    if "lesson_dt" in data:
        lesson.lesson_dt = datetime.fromisoformat(data["lesson_dt"])
    for field in ("description", "assignment"):
        if field in data:
            setattr(lesson, field, data[field])
    if "credit_cost" in data:
        lesson.credit_cost = float(data["credit_cost"] or 0)

    # Sync participants if provided
    if "teacher_ids" in data or "student_ids" in data:
        LessonUser.query.filter_by(lesson_id=lesson_id).delete()
        db.session.add(LessonUser(lesson_id=lesson_id, user_id=user.user_id, user_as="Teacher"))
        for pid in data.get("teacher_ids", []):
            if pid != user.user_id:
                db.session.add(LessonUser(lesson_id=lesson_id, user_id=pid, user_as="Teacher"))
        for pid in data.get("student_ids", []):
            db.session.add(LessonUser(lesson_id=lesson_id, user_id=pid, user_as="Student"))

    # Sync library items if provided
    if "library_ids" in data:
        LessonLibrary.query.filter_by(lesson_id=lesson_id).delete()
        for lid in data.get("library_ids", []):
            db.session.add(LessonLibrary(lesson_id=lesson_id, library_id=lid))

    db.session.commit()
    return jsonify(lesson.to_dict())


@lessons_bp.route("/<int:lesson_id>", methods=["DELETE"])
@jwt_required()
def delete_lesson(lesson_id):
    user = get_current_user()
    lesson = Lesson.query.get_or_404(lesson_id)

    if user.profile != "Admin" and lesson.created_by != user.user_id:
        return jsonify({"error": "Forbidden"}), 403

    db.session.delete(lesson)
    db.session.commit()
    return jsonify({"message": "Lesson deleted"})


@lessons_bp.route("/<int:lesson_id>/comments", methods=["POST"])
@jwt_required()
def add_comment(lesson_id):
    user = get_current_user()
    lesson = _lesson_visible_to(user).filter_by(lesson_id=lesson_id).first_or_404()

    data = request.get_json()
    text = (data.get("text") or "").strip()
    if not text:
        return jsonify({"error": "text is required"}), 400

    name = f"{user.first_nm or ''} {user.last_nm or ''}".strip() or user.email
    timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M")
    entry = f"[{timestamp} {name}]: {text}\n"

    lesson.comments = (lesson.comments or "") + entry
    db.session.commit()
    return jsonify(lesson.to_dict())


@lessons_bp.route("/<int:lesson_id>/apply-credits", methods=["POST"])
@jwt_required()
def apply_lesson_credits(lesson_id):
    user = get_current_user()
    lesson = Lesson.query.get_or_404(lesson_id)

    if lesson.created_by != user.user_id and user.profile != "Admin":
        return jsonify({"error": "Forbidden"}), 403
    if lesson.credits_applied:
        return jsonify({"error": "Credits already applied for this lesson"}), 400
    if not lesson.credit_cost or float(lesson.credit_cost) <= 0:
        return jsonify({"error": "No credit cost set for this lesson"}), 400

    students = [lu.user for lu in lesson.lesson_users if lu.user_as == "Student"]
    if not students:
        return jsonify({"error": "No students in this lesson"}), 400

    cost = float(lesson.credit_cost)
    for student in students:
        credit = Credit.query.filter_by(
            teacher_id=lesson.created_by,
            student_id=student.user_id
        ).first()
        if credit:
            credit.balance = float(credit.balance) - cost
        else:
            credit = Credit(teacher_id=lesson.created_by, student_id=student.user_id, balance=-cost)
            db.session.add(credit)

    lesson.credits_applied = True
    db.session.commit()
    return jsonify(lesson.to_dict())

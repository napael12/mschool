import logging
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required
import resend
from app.extensions import db
from app.models.lesson import Lesson
from app.models.lesson_user import LessonUser
from app.models.lesson_library import LessonLibrary
from app.models.credit import Credit
from app.utils.auth_helpers import get_current_user

logger = logging.getLogger(__name__)

lessons_bp = Blueprint("lessons", __name__)


def _parse_dt(value: str) -> datetime:
    """Parse an ISO-8601 datetime string to a timezone-aware UTC datetime.
    Handles the 'Z' suffix on all Python versions."""
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


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
        lesson_dt=_parse_dt(data["lesson_dt"]),
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
        lesson.lesson_dt = _parse_dt(data["lesson_dt"])
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


def _refund_lesson_credits(lesson):
    """Add credit_cost back to each student's balance for this lesson."""
    cost = float(lesson.credit_cost)
    if cost <= 0:
        return
    students = [lu.user for lu in lesson.lesson_users if lu.user_as == "Student"]
    for student in students:
        credit = Credit.query.filter_by(
            teacher_id=lesson.created_by,
            student_id=student.user_id
        ).first()
        if credit:
            credit.balance = float(credit.balance) + cost


@lessons_bp.route("/<int:lesson_id>", methods=["DELETE"])
@jwt_required()
def delete_lesson(lesson_id):
    user = get_current_user()
    lesson = Lesson.query.get_or_404(lesson_id)

    if user.profile != "Admin" and lesson.created_by != user.user_id:
        return jsonify({"error": "Forbidden"}), 403

    if lesson.credits_applied:
        _refund_lesson_credits(lesson)

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


def _build_lesson_details_html(lesson):
    """Return HTML snippets for assignment and library links."""
    dt_str = lesson.lesson_dt.strftime("%A, %B %d, %Y at %I:%M %p")

    assignment_block = ""
    if lesson.assignment:
        assignment_html = lesson.assignment.replace("\n", "<br>")
        assignment_block = f"""
          <div style="margin-top:16px">
            <strong>Assignment</strong>
            <p style="margin:4px 0;color:#444">{assignment_html}</p>
          </div>"""

    library_block = ""
    library_items = [ll.library_item for ll in lesson.lesson_library]
    if library_items:
        links_html = "".join(
            f'<li><a href="{item.link}" style="color:#1976d2">{item.title}</a></li>'
            for item in library_items
        )
        library_block = f"""
          <div style="margin-top:16px">
            <strong>Library</strong>
            <ul style="margin:4px 0;padding-left:20px;color:#444">{links_html}</ul>
          </div>"""

    return dt_str, assignment_block, library_block


def _send_lesson_notification(lesson, action):
    """Send email to all lesson participants for cancel/reschedule actions."""
    resend.api_key = current_app.config["RESEND_API_KEY"]
    from_addr = current_app.config["RESEND_FROM"]

    participants = [lu.user for lu in lesson.lesson_users]
    if not participants:
        return

    dt_str, assignment_block, library_block = _build_lesson_details_html(lesson)

    if action == "cancelled":
        subject = f"Lesson Cancelled: {lesson.description}"
        body_html = f"""
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
          <h2 style="color:#d32f2f;margin-bottom:8px">Lesson Cancelled</h2>
          <p>The lesson <strong>{lesson.description}</strong> that was scheduled for
          <strong>{dt_str}</strong> has been <strong>cancelled</strong>.</p>
          <div style="background:#f9f9f9;border-left:4px solid #d32f2f;padding:12px 16px;margin-top:16px;border-radius:4px">
            <div><strong>Date &amp; Time</strong>
              <p style="margin:4px 0;color:#444">{dt_str}</p>
            </div>
            {assignment_block}
            {library_block}
          </div>
          <p style="margin-top:16px">Please contact your teacher if you have any questions.</p>
          <p style="font-size:12px;color:#888;margin-top:24px">MuSchool</p>
        </div>
        """
    else:
        subject = f"Lesson Rescheduled: {lesson.description}"
        body_html = f"""
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px">
          <h2 style="color:#f57c00;margin-bottom:8px">Lesson Rescheduled</h2>
          <p>The lesson <strong>{lesson.description}</strong> has been rescheduled.
          Please update your calendar accordingly.</p>
          <div style="background:#f9f9f9;border-left:4px solid #f57c00;padding:12px 16px;margin-top:16px;border-radius:4px">
            <div><strong>New Date &amp; Time</strong>
              <p style="margin:4px 0;color:#444">{dt_str}</p>
            </div>
            {assignment_block}
            {library_block}
          </div>
          <p style="font-size:12px;color:#888;margin-top:24px">MuSchool</p>
        </div>
        """

    for participant in participants:
        try:
            resend.Emails.send({
                "from": from_addr,
                "to": [participant.email],
                "subject": subject,
                "html": body_html,
            })
        except Exception:
            logger.exception("Failed to send %s notification to %s", action, participant.email)


@lessons_bp.route("/<int:lesson_id>/cancel", methods=["POST"])
@jwt_required()
def cancel_lesson(lesson_id):
    user = get_current_user()
    lesson = Lesson.query.get_or_404(lesson_id)

    if lesson.created_by != user.user_id and user.profile != "Admin":
        return jsonify({"error": "Forbidden"}), 403
    if lesson.status == "cancelled":
        return jsonify({"error": "Lesson is already cancelled"}), 400

    data = request.get_json() or {}

    if data.get("refund_credits") and lesson.credits_applied:
        _refund_lesson_credits(lesson)
        lesson.credits_applied = False

    lesson.status = "cancelled"
    db.session.commit()

    if data.get("send_email"):
        _send_lesson_notification(lesson, "cancelled")

    return jsonify(lesson.to_dict())


@lessons_bp.route("/<int:lesson_id>/reschedule", methods=["POST"])
@jwt_required()
def reschedule_lesson(lesson_id):
    user = get_current_user()
    lesson = Lesson.query.get_or_404(lesson_id)

    if lesson.created_by != user.user_id and user.profile != "Admin":
        return jsonify({"error": "Forbidden"}), 403
    if lesson.status == "cancelled":
        return jsonify({"error": "Cannot reschedule a cancelled lesson"}), 400

    data = request.get_json() or {}
    if not data.get("lesson_dt"):
        return jsonify({"error": "lesson_dt is required"}), 400

    lesson.lesson_dt = _parse_dt(data["lesson_dt"])
    lesson.status = "rescheduled"
    db.session.commit()

    if data.get("send_email"):
        _send_lesson_notification(lesson, "rescheduled")

    return jsonify(lesson.to_dict())

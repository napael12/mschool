from flask import jsonify
from sqlalchemy import func
from app.extensions import db
from app.models.user import User
from app.models.lesson import Lesson
from app.models.lesson_user import LessonUser
from app.utils.auth_helpers import require_roles
from flask import Blueprint

metrics_bp = Blueprint("metrics", __name__)


@metrics_bp.route("/summary", methods=["GET"])
@require_roles("Admin")
def summary():
    total_lessons = db.session.query(func.count(Lesson.lesson_id)).scalar()
    total_teachers = db.session.query(func.count(User.user_id)).filter_by(profile="Teacher").scalar()
    total_students = db.session.query(func.count(User.user_id)).filter_by(profile="Student").scalar()
    return jsonify({
        "total_lessons": total_lessons,
        "total_teachers": total_teachers,
        "total_students": total_students,
    })


@metrics_bp.route("/teachers", methods=["GET"])
@require_roles("Admin")
def teacher_metrics():
    rows = (
        db.session.query(
            User.user_id,
            User.first_nm,
            User.last_nm,
            User.email,
            func.count(LessonUser.lesson_id.distinct()).label("lesson_count"),
            func.count(
                db.session.query(LessonUser.user_id)
                .filter(LessonUser.lesson_id == LessonUser.lesson_id, LessonUser.user_as == "Student")
                .correlate(LessonUser)
                .scalar_subquery()
            ).label("student_count"),
            func.min(Lesson.lesson_dt).label("first_lesson"),
            func.max(Lesson.lesson_dt).label("last_lesson"),
        )
        .join(LessonUser, LessonUser.user_id == User.user_id)
        .join(Lesson, Lesson.lesson_id == LessonUser.lesson_id)
        .filter(User.profile == "Teacher", LessonUser.user_as == "Teacher")
        .group_by(User.user_id, User.first_nm, User.last_nm, User.email)
        .all()
    )

    result = []
    for row in rows:
        # Count distinct students per teacher's lessons
        student_count = (
            db.session.query(func.count(LessonUser.user_id.distinct()))
            .join(Lesson, Lesson.lesson_id == LessonUser.lesson_id)
            .filter(
                LessonUser.user_as == "Student",
                Lesson.lesson_id.in_(
                    db.session.query(LessonUser.lesson_id).filter_by(user_id=row.user_id, user_as="Teacher")
                ),
            )
            .scalar()
        )
        result.append({
            "user_id": row.user_id,
            "first_nm": row.first_nm,
            "last_nm": row.last_nm,
            "email": row.email,
            "lesson_count": row.lesson_count,
            "student_count": student_count,
            "first_lesson": row.first_lesson.isoformat() if row.first_lesson else None,
            "last_lesson": row.last_lesson.isoformat() if row.last_lesson else None,
        })

    return jsonify(result)

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.credit import Credit
from app.models.user import User
from app.utils.auth_helpers import get_current_user

credits_bp = Blueprint("credits", __name__)


@credits_bp.route("", methods=["GET"])
@jwt_required()
def get_credits():
    user = get_current_user()
    if user.profile == "Admin":
        rows = Credit.query.all()
    elif user.profile == "Teacher":
        rows = Credit.query.filter_by(teacher_id=user.user_id).all()
    else:
        rows = Credit.query.filter_by(student_id=user.user_id).all()
    return jsonify([r.to_dict() for r in rows])


@credits_bp.route("", methods=["POST"])
@jwt_required()
def adjust_credits():
    user = get_current_user()
    data = request.get_json()

    if user.profile == "Admin":
        teacher_id = data.get("teacher_id")
        if not teacher_id:
            return jsonify({"error": "teacher_id is required"}), 400
    elif user.profile == "Teacher":
        teacher_id = user.user_id
    else:
        return jsonify({"error": "Forbidden"}), 403

    student_id = data.get("student_id")
    amount = data.get("amount")
    if student_id is None or amount is None:
        return jsonify({"error": "student_id and amount are required"}), 400

    # Verify teacher and student exist with correct profiles
    teacher = User.query.get(teacher_id)
    student = User.query.get(student_id)
    if not teacher or teacher.profile not in ("Teacher", "Admin"):
        return jsonify({"error": "Invalid teacher"}), 400
    if not student or student.profile != "Student":
        return jsonify({"error": "Invalid student"}), 400

    credit = Credit.query.filter_by(teacher_id=teacher_id, student_id=student_id).first()
    if credit:
        credit.balance = float(credit.balance) + float(amount)
    else:
        credit = Credit(teacher_id=teacher_id, student_id=student_id, balance=float(amount))
        db.session.add(credit)

    db.session.commit()
    return jsonify(credit.to_dict())

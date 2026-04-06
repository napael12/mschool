from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
import bcrypt
from app.extensions import db
from app.models.user import User
from app.utils.auth_helpers import require_roles, get_current_user

users_bp = Blueprint("users", __name__)

DEFAULT_PASSWORD = "password"


def hash_password(plain):
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


@users_bp.route("/participants", methods=["GET"])
@jwt_required()
def list_participants():
    """Return all Teachers and Students. Accessible to any authenticated user
    so that Teachers can populate lesson participant selectors."""
    users = (
        User.query
        .filter(User.profile.in_(["Teacher", "Student"]))
        .order_by(User.last_nm, User.first_nm)
        .all()
    )
    return jsonify([u.to_dict() for u in users])


@users_bp.route("", methods=["GET"])
@require_roles("Admin")
def list_users():
    profile_filter = request.args.get("profile")
    query = User.query
    if profile_filter:
        query = query.filter_by(profile=profile_filter)
    users = query.order_by(User.last_nm, User.first_nm).all()
    return jsonify([u.to_dict() for u in users])


@users_bp.route("/<int:user_id>", methods=["GET"])
@require_roles("Admin")
def get_user(user_id):
    user = User.query.get_or_404(user_id)
    return jsonify(user.to_dict())


@users_bp.route("", methods=["POST"])
@require_roles("Admin")
def create_user():
    data = request.get_json()
    email = (data.get("email") or "").strip().lower()
    if not email or not data.get("profile"):
        return jsonify({"error": "email and profile are required"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 409

    user = User(
        email=email,
        phone=data.get("phone"),
        first_nm=data.get("first_nm"),
        last_nm=data.get("last_nm"),
        profile=data.get("profile"),
        password_hash=hash_password(DEFAULT_PASSWORD),
    )
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201


@users_bp.route("/<int:user_id>", methods=["PUT"])
@require_roles("Admin")
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    for field in ("phone", "first_nm", "last_nm", "profile"):
        if field in data:
            setattr(user, field, data[field])
    if "email" in data:
        email = data["email"].strip().lower()
        existing = User.query.filter_by(email=email).first()
        if existing and existing.user_id != user_id:
            return jsonify({"error": "Email already exists"}), 409
        user.email = email
    db.session.commit()
    return jsonify(user.to_dict())


@users_bp.route("/<int:user_id>", methods=["DELETE"])
@require_roles("Admin")
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted"})


@users_bp.route("/invite", methods=["POST"])
@jwt_required()
def invite_user():
    current = get_current_user()
    if current.profile not in ("Admin", "Teacher"):
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json()
    email = (data.get("email") or "").strip().lower()
    profile = data.get("profile")
    if not email or not profile:
        return jsonify({"error": "email and profile are required"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already exists"}), 409

    user = User(
        email=email,
        profile=profile,
        password_hash=hash_password(DEFAULT_PASSWORD),
    )
    db.session.add(user)
    db.session.commit()

    # Stub: in production send a real invite email
    print(f"[INVITE] Sent invite to {email} as {profile} (invited by {current.email})")
    return jsonify({"message": f"Invite sent to {email}", "user": user.to_dict()}), 201

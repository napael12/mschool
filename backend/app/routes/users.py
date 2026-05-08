import logging

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required
import bcrypt
import resend

from app.extensions import db
from app.models.user import User
from app.models.password_reset import PasswordResetToken
from app.utils.auth_helpers import require_roles, get_current_user

logger = logging.getLogger(__name__)

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


@users_bp.route("/<int:user_id>/send-reset", methods=["POST"])
@require_roles("Admin")
def admin_send_password_reset(user_id):
    """Admin-initiated password reset — bypasses the daily rate limit."""
    user = User.query.get_or_404(user_id)

    reset_token = PasswordResetToken.generate(user.user_id)
    db.session.add(reset_token)
    db.session.commit()

    frontend_url = current_app.config["FRONTEND_URL"].rstrip("/")
    reset_link = f"{frontend_url}/reset-password?token={reset_token.token}"

    resend.api_key = current_app.config["RESEND_API_KEY"]
    first = user.first_nm or "there"
    try:
        resend.Emails.send({
            "from": current_app.config["RESEND_FROM"],
            "to": [user.email],
            "subject": "Reset your MSchool password",
            "html": f"""
                <div style="font-family:sans-serif;max-width:480px;margin:auto">
                  <h2>Password Reset</h2>
                  <p>Hi {first},</p>
                  <p>An administrator has sent you a password reset link for your MSchool account.
                     Click the button below to set a new password.
                     This link expires in <strong>1 hour</strong>.</p>
                  <p style="text-align:center;margin:32px 0">
                    <a href="{reset_link}"
                       style="background:#1976d2;color:#fff;padding:12px 28px;
                              border-radius:6px;text-decoration:none;font-weight:600">
                      Reset Password
                    </a>
                  </p>
                  <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
                  <p style="font-size:12px;color:#888">MSchool</p>
                </div>
            """,
        })
    except Exception:
        logger.exception("Failed to send admin-initiated reset email to %s", user.email)
        return jsonify({"error": "Failed to send email. Please try again."}), 500

    return jsonify({"message": f"Password reset email sent to {user.email}."})


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

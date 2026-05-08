import re
import logging
from datetime import datetime, date

import bcrypt
import resend
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

from app.extensions import db
from app.models.user import User
from app.models.password_reset import PasswordResetToken

auth_bp = Blueprint("auth", __name__)
logger = logging.getLogger(__name__)

PASSWORD_RESET_DAILY_LIMIT = 5


def _validate_strong_password(password):
    if len(password) < 8:
        return "Password must be at least 8 characters long"
    if not re.search(r"[A-Z]", password):
        return "Password must contain at least one uppercase letter"
    if not re.search(r"[a-z]", password):
        return "Password must contain at least one lowercase letter"
    if not re.search(r"\d", password):
        return "Password must contain at least one number"
    if not re.search(r'[!@#$%^&*(),.?":{}|<>\[\]\-_=+~`/\\]', password):
        return "Password must contain at least one special character"
    return None


def _count_resets_today(user_id):
    today = date.today()
    return PasswordResetToken.query.filter(
        PasswordResetToken.user_id == user_id,
        db.func.date(PasswordResetToken.created_at) == today,
    ).count()


def _send_reset_email(to_email, name, reset_link):
    resend.api_key = current_app.config["RESEND_API_KEY"]
    first = name or "there"
    params = {
        "from": current_app.config["RESEND_FROM"],
        "to": [to_email],
        "subject": "Reset your MSchool password",
        "html": f"""
            <div style="font-family:sans-serif;max-width:480px;margin:auto">
              <h2>Password Reset Request</h2>
              <p>Hi {first},</p>
              <p>We received a request to reset your MSchool password.
                 Click the button below to set a new password.
                 This link expires in <strong>1 hour</strong>.</p>
              <p style="text-align:center;margin:32px 0">
                <a href="{reset_link}"
                   style="background:#1976d2;color:#fff;padding:12px 28px;
                          border-radius:6px;text-decoration:none;font-weight:600">
                  Reset Password
                </a>
              </p>
              <p>If you didn't request a password reset, you can safely ignore this email.
                 Your password will not be changed.</p>
              <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
              <p style="font-size:12px;color:#888">MSchool</p>
            </div>
        """,
    }
    resend.Emails.send(params)


@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = (data.get("email") or "").strip().lower()
    password = (data.get("password") or "").encode("utf-8")

    user = User.query.filter_by(email=email).first()
    if not user or not bcrypt.checkpw(password, user.password_hash.encode("utf-8")):
        return jsonify({"error": "Invalid credentials"}), 401

    token = create_access_token(identity=str(user.user_id))
    return jsonify({"access_token": token, "user": user.to_dict()})


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(user.to_dict())


@auth_bp.route("/profile", methods=["PUT"])
@jwt_required()
def update_profile():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json()

    for field in ("first_nm", "last_nm", "phone"):
        if field in data:
            setattr(user, field, data[field])

    if "email" in data:
        email = (data["email"] or "").strip().lower()
        if not email:
            return jsonify({"error": "Email cannot be empty"}), 400
        existing = User.query.filter_by(email=email).first()
        if existing and existing.user_id != user_id:
            return jsonify({"error": "Email already in use"}), 409
        user.email = email

    db.session.commit()
    return jsonify(user.to_dict())


@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    if not email:
        return jsonify({"error": "Email is required"}), 400

    # Always return the same response to avoid leaking whether an email exists
    generic_ok = jsonify({"message": "If that email is registered you will receive a reset link shortly."})

    user = User.query.filter_by(email=email).first()
    if not user:
        return generic_ok, 200

    if _count_resets_today(user.user_id) >= PASSWORD_RESET_DAILY_LIMIT:
        return jsonify({"error": "Too many password reset requests. Please try again tomorrow."}), 429

    reset_token = PasswordResetToken.generate(user.user_id)
    db.session.add(reset_token)
    db.session.commit()

    frontend_url = current_app.config["FRONTEND_URL"].rstrip("/")
    reset_link = f"{frontend_url}/reset-password?token={reset_token.token}"

    try:
        _send_reset_email(user.email, user.first_nm, reset_link)
    except Exception:
        logger.exception("Failed to send password reset email to %s", user.email)
        # Don't expose internal errors; the token is still saved and usable
        # but we silently fail the email send

    return generic_ok, 200


@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json() or {}
    token_str = (data.get("token") or "").strip()
    new_password = data.get("new_password") or ""

    if not token_str:
        return jsonify({"error": "Token is required"}), 400

    error = _validate_strong_password(new_password)
    if error:
        return jsonify({"error": error}), 400

    reset_token = PasswordResetToken.query.filter_by(token=token_str).first()
    if not reset_token or not reset_token.is_valid():
        return jsonify({"error": "This reset link is invalid or has expired."}), 400

    user = reset_token.user
    user.password_hash = bcrypt.hashpw(
        new_password.encode("utf-8"), bcrypt.gensalt()
    ).decode("utf-8")

    reset_token.used_at = datetime.utcnow()
    db.session.commit()

    return jsonify({"message": "Password updated successfully."})

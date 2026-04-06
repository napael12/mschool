from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import bcrypt
from app.extensions import db
from app.models.user import User

auth_bp = Blueprint("auth", __name__)


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

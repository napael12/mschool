from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.library import Library
from app.models.credit import Credit
from app.utils.auth_helpers import get_current_user

library_bp = Blueprint("library", __name__)


def _visible_library(user):
    """Return a query filtered to items the user can see."""
    if user.profile == "Admin":
        return Library.query

    public = Library.is_public == True  # noqa: E712

    if user.profile == "Teacher":
        return Library.query.filter(
            db.or_(public, Library.created_by == user.user_id)
        )

    # Student: public items + items from teachers they have a credit record with
    teacher_ids = db.session.query(Credit.teacher_id).filter_by(student_id=user.user_id)
    return Library.query.filter(
        db.or_(public, Library.created_by.in_(teacher_ids))
    )


@library_bp.route("", methods=["GET"])
@jwt_required()
def list_library():
    user = get_current_user()
    items = _visible_library(user).order_by(Library.title).all()
    return jsonify([item.to_dict() for item in items])


@library_bp.route("/<int:library_id>", methods=["GET"])
@jwt_required()
def get_library_item(library_id):
    user = get_current_user()
    item = _visible_library(user).filter_by(library_id=library_id).first_or_404()
    return jsonify(item.to_dict())


@library_bp.route("", methods=["POST"])
@jwt_required()
def create_library_item():
    user = get_current_user()
    data = request.get_json()
    title = (data.get("title") or "").strip()
    link = (data.get("link") or "").strip()
    if not title or not link:
        return jsonify({"error": "title and link are required"}), 400

    item = Library(
        title=title,
        link=link,
        is_public=bool(data.get("is_public", False)),
        created_by=user.user_id,
    )
    db.session.add(item)
    db.session.commit()
    return jsonify(item.to_dict()), 201


@library_bp.route("/<int:library_id>", methods=["PUT"])
@jwt_required()
def update_library_item(library_id):
    user = get_current_user()
    item = Library.query.get_or_404(library_id)

    if item.created_by != user.user_id and user.profile != "Admin":
        return jsonify({"error": "Forbidden"}), 403

    data = request.get_json()
    if "title" in data:
        title = (data["title"] or "").strip()
        if not title:
            return jsonify({"error": "title cannot be empty"}), 400
        item.title = title
    if "link" in data:
        link = (data["link"] or "").strip()
        if not link:
            return jsonify({"error": "link cannot be empty"}), 400
        item.link = link
    if "is_public" in data:
        item.is_public = bool(data["is_public"])

    db.session.commit()
    return jsonify(item.to_dict())


@library_bp.route("/<int:library_id>", methods=["DELETE"])
@jwt_required()
def delete_library_item(library_id):
    user = get_current_user()
    item = Library.query.get_or_404(library_id)

    if item.created_by != user.user_id and user.profile != "Admin":
        return jsonify({"error": "Forbidden"}), 403

    db.session.delete(item)
    db.session.commit()
    return jsonify({"message": "Deleted"})

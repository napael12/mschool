from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.extensions import db
from app.models.library import Library
from app.utils.auth_helpers import get_current_user

library_bp = Blueprint("library", __name__)


@library_bp.route("", methods=["GET"])
@jwt_required()
def list_library():
    items = Library.query.order_by(Library.title).all()
    return jsonify([item.to_dict() for item in items])


@library_bp.route("/<int:library_id>", methods=["GET"])
@jwt_required()
def get_library_item(library_id):
    item = Library.query.get_or_404(library_id)
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

    item = Library(title=title, link=link, created_by=user.user_id)
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

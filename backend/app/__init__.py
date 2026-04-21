import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from app.config import Config
from app.extensions import db, jwt
from app.routes.auth import auth_bp
from app.routes.users import users_bp
from app.routes.lessons import lessons_bp
from app.routes.metrics import metrics_bp
from app.routes.library import library_bp
from app.routes.credits import credits_bp

STATIC_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")


def create_app():
    app = Flask(__name__, static_folder=STATIC_DIR, static_url_path="")
    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)

    CORS(app,
         origins=["http://localhost:5173"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
         allow_headers=["Content-Type", "Authorization"],
         supports_credentials=True)

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(users_bp, url_prefix="/api/users")
    app.register_blueprint(lessons_bp, url_prefix="/api/lessons")
    app.register_blueprint(metrics_bp, url_prefix="/api/metrics")
    app.register_blueprint(library_bp, url_prefix="/api/library")
    app.register_blueprint(credits_bp, url_prefix="/api/credits")

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend(path):
        file_path = os.path.join(STATIC_DIR, path)
        if path and os.path.exists(file_path):
            return send_from_directory(STATIC_DIR, path)
        return send_from_directory(STATIC_DIR, "index.html")

    return app

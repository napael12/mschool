from flask import Flask
from flask_cors import CORS
from app.config import Config
from app.extensions import db, jwt
from app.routes.auth import auth_bp
from app.routes.users import users_bp
from app.routes.lessons import lessons_bp
from app.routes.metrics import metrics_bp
from app.routes.library import library_bp
from app.routes.credits import credits_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)
    CORS(app, origins=["http://localhost:5173"])

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(users_bp, url_prefix="/api/users")
    app.register_blueprint(lessons_bp, url_prefix="/api/lessons")
    app.register_blueprint(metrics_bp, url_prefix="/api/metrics")
    app.register_blueprint(library_bp, url_prefix="/api/library")
    app.register_blueprint(credits_bp, url_prefix="/api/credits")

    return app

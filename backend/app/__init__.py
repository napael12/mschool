import os
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

    # Allow localhost for dev + Railway frontend URL for production
    allowed_origins = [
        "http://localhost:5173",
        # Hardcoded production frontend URL as a guaranteed fallback
        "https://mschool-frontend-production.up.railway.app",
        # Backend's own domain to handle self-requests
        "https://mschool-backend-production.up.railway.app",
    ]
    frontend_url = os.environ.get("FRONTEND_URL")
    print(f"[CORS] FRONTEND_URL env var: {frontend_url!r}")
    if frontend_url and frontend_url not in allowed_origins:
        allowed_origins.append(frontend_url)
    print(f"[CORS] Allowed origins: {allowed_origins}")
    CORS(app,
         origins=allowed_origins,
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
         allow_headers=["Content-Type", "Authorization"],
         supports_credentials=True)

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(users_bp, url_prefix="/api/users")
    app.register_blueprint(lessons_bp, url_prefix="/api/lessons")
    app.register_blueprint(metrics_bp, url_prefix="/api/metrics")
    app.register_blueprint(library_bp, url_prefix="/api/library")
    app.register_blueprint(credits_bp, url_prefix="/api/credits")

    return app

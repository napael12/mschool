import os
import logging
import traceback
from flask import Flask, jsonify, g
from flask_cors import CORS
from app.config import Config
from app.extensions import db, jwt
from app.routes.auth import auth_bp
from app.routes.users import users_bp
from app.routes.lessons import lessons_bp
from app.routes.metrics import metrics_bp
from app.routes.library import library_bp
from app.routes.credits import credits_bp

logger = logging.getLogger(__name__)


def create_app():
    app = Flask(__name__, static_folder=DIST_FOLDER, static_url_path='')
    app.config.from_object(Config)

    # ------------------------------------------------------------------ #
    # Logging — emit every request and all errors to stdout so gunicorn   #
    # captures them in the deployment log stream.                          #
    # ------------------------------------------------------------------ #
    logging.basicConfig(
        level=logging.DEBUG,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    )
    # Promote Werkzeug and SQLAlchemy loggers so their output is visible.
    logging.getLogger("werkzeug").setLevel(logging.DEBUG)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)

    # ------------------------------------------------------------------ #
    # Database                                                             #
    # ------------------------------------------------------------------ #
    logger.info("Initialising SQLAlchemy — DATABASE_URL present: %s",
                bool(app.config.get("SQLALCHEMY_DATABASE_URI")))
    try:
        db.init_app(app)
        logger.info("SQLAlchemy initialised successfully")
    except Exception:
        logger.error("SQLAlchemy init_app failed:\n%s", traceback.format_exc())
        raise

    jwt.init_app(app)

    # ------------------------------------------------------------------ #
    # CORS                                                                 #
    # ------------------------------------------------------------------ #
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
         origins=["http://localhost:5173"],
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
         allow_headers=["Content-Type", "Authorization"],
         supports_credentials=True)

    # ------------------------------------------------------------------ #
    # Request logging                                                      #
    # ------------------------------------------------------------------ #
    import time
    from flask import request

    @app.before_request
    def _log_request_start():
        g._request_start = time.time()
        logger.info("→ %s %s  (from %s)", request.method, request.path,
                    request.remote_addr)

    @app.after_request
    def _log_request_end(response):
        elapsed_ms = (time.time() - g._request_start) * 1000
        logger.info("← %s %s  %d  %.1f ms",
                    request.method, request.path,
                    response.status_code, elapsed_ms)
        return response

    # ------------------------------------------------------------------ #
    # Error handlers                                                       #
    # ------------------------------------------------------------------ #
    @app.errorhandler(500)
    def _handle_500(exc):
        logger.error(
            "500 Internal Server Error on %s %s:\n%s",
            request.method, request.path,
            traceback.format_exc(),
        )
        return jsonify({"error": "Internal server error"}), 500

    @app.errorhandler(Exception)
    def _handle_unhandled(exc):
        logger.error(
            "Unhandled exception on %s %s:\n%s",
            request.method, request.path,
            traceback.format_exc(),
        )
        return jsonify({"error": "Internal server error"}), 500

    # ------------------------------------------------------------------ #
    # Health check                                                         #
    # ------------------------------------------------------------------ #
    @app.route("/health")
    def _health():
        """Lightweight liveness probe — no DB query required."""
        return jsonify({"status": "ok"}), 200

    # ------------------------------------------------------------------ #
    # Blueprints                                                           #
    # ------------------------------------------------------------------ #
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(users_bp, url_prefix="/api/users")
    app.register_blueprint(lessons_bp, url_prefix="/api/lessons")
    app.register_blueprint(metrics_bp, url_prefix="/api/metrics")
    app.register_blueprint(library_bp, url_prefix="/api/library")
    app.register_blueprint(credits_bp, url_prefix="/api/credits")

    logger.info("All blueprints registered — app ready")
    return app

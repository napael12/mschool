import os
import logging
import traceback
from flask import Flask, jsonify, g, send_from_directory
from werkzeug.exceptions import HTTPException
from app.config import Config
from app.extensions import db, jwt
from app.routes.auth import auth_bp
from app.routes.users import users_bp
from app.routes.lessons import lessons_bp
from app.routes.metrics import metrics_bp
from app.routes.library import library_bp
from app.routes.credits import credits_bp
import app.models  # noqa: F401 — ensure all models are registered before create_all

logger = logging.getLogger(__name__)


STATIC_FOLDER = os.path.join(os.path.dirname(__file__), '..', 'static')


def create_app():
    app = Flask(__name__, static_folder=STATIC_FOLDER, static_url_path='')
    app.config.from_object(Config)
    app.config['STATIC_FOLDER'] = STATIC_FOLDER

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
        with app.app_context():
            db.create_all()
            logger.info("db.create_all() completed")
            from sqlalchemy import text
            db.session.execute(text(
                "ALTER TABLE lessons ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'scheduled'"
            ))
            db.session.execute(text("""
                DO $$
                BEGIN
                  IF EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_name = 'lessons'
                      AND column_name = 'lesson_dt'
                      AND data_type = 'timestamp without time zone'
                  ) THEN
                    ALTER TABLE lessons
                      ALTER COLUMN lesson_dt TYPE TIMESTAMPTZ
                      USING lesson_dt AT TIME ZONE 'UTC';
                  END IF;
                END $$;
            """))
            db.session.execute(text(
                "ALTER TABLE library ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE"
            ))
            db.session.execute(text("""
                CREATE TABLE IF NOT EXISTS user_visits (
                    visit_id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
                    login_at TIMESTAMPTZ NOT NULL,
                    last_seen_at TIMESTAMPTZ NOT NULL
                )
            """))
            db.session.commit()
            logger.info("lessons schema migrations completed")
    except Exception:
        logger.error("SQLAlchemy init_app failed:\n%s", traceback.format_exc())
        raise

    jwt.init_app(app)

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
    # Visit tracking — update last_seen_at on authenticated requests      #
    # ------------------------------------------------------------------ #
    from datetime import datetime, timezone as _tz
    from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

    @app.after_request
    def _track_last_seen(response):
        try:
            verify_jwt_in_request(optional=True)
            uid = get_jwt_identity()
            if uid:
                from app.models.user_visit import UserVisit
                now = datetime.now(_tz.utc)
                visit = (
                    UserVisit.query
                    .filter_by(user_id=int(uid))
                    .order_by(UserVisit.login_at.desc())
                    .first()
                )
                if visit and (now - visit.last_seen_at).total_seconds() > 60:
                    visit.last_seen_at = now
                    db.session.commit()
        except Exception:
            pass
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
        if isinstance(exc, HTTPException):
            return exc
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

    # Serve landing page at root; React SPA for all other non-API routes
    @app.route('/')
    def serve_landing():
        return send_from_directory(app.static_folder, 'app.html')

    @app.route('/<path:path>')
    def serve_frontend(path):
        full_path = os.path.join(app.static_folder, path)
        if os.path.exists(full_path):
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.static_folder, 'index.html')

    logger.info("All blueprints registered — app ready")
    return app

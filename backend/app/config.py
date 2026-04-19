import os
from datetime import timedelta


class Config:
    DATABASE_URL = os.environ.get("DATABASE_URL", "")
    # Railway sometimes uses postgres:// — SQLAlchemy requires postgresql://
    SQLALCHEMY_DATABASE_URI = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "mschool-dev-secret-change-in-production")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)

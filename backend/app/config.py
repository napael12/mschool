import os
from datetime import timedelta


class Config:
    DATABASE_URL = os.environ.get("DATABASE_URL", "")
    # psycopg3 requires postgresql+psycopg:// dialect prefix
    # Railway sometimes provides postgres:// — normalize all variants
    SQLALCHEMY_DATABASE_URI = (
        DATABASE_URL
        .replace("postgres://", "postgresql://", 1)
        .replace("postgresql://", "postgresql+psycopg://", 1)
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "mschool-dev-secret-change-in-production")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)
    RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "re_LgW79W1U_4i1834nsbwRmdVi2UEMNdL8T")
    RESEND_FROM = os.environ.get("RESEND_FROM", "MuSchool <admin@mschool.app>")
    FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://muschool.app")

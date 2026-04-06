import json
import os
from datetime import timedelta

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load_db_config():
    config_path = os.path.join(BASE_DIR, "db_config.json")
    with open(config_path) as f:
        return json.load(f)


class Config:
    db = load_db_config()
    SQLALCHEMY_DATABASE_URI = (
        f"postgresql://{db['username']}:{db['password']}"
        f"@{db['host']}:{db['port']}/{db['database']}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = "mschool-dev-secret-change-in-production"
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)

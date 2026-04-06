from app.extensions import db


class User(db.Model):
    __tablename__ = "users"

    user_id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(250), unique=True, nullable=False)
    phone = db.Column(db.String(120))
    first_nm = db.Column(db.String(120))
    last_nm = db.Column(db.String(120))
    profile = db.Column(db.String(30), nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)

    lesson_users = db.relationship("LessonUser", back_populates="user", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "user_id": self.user_id,
            "email": self.email,
            "phone": self.phone,
            "first_nm": self.first_nm,
            "last_nm": self.last_nm,
            "profile": self.profile,
        }

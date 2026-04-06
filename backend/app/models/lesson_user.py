from app.extensions import db


class LessonUser(db.Model):
    __tablename__ = "lesson_users"

    lesson_id = db.Column(db.Integer, db.ForeignKey("lessons.lesson_id", ondelete="CASCADE"), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    user_as = db.Column(db.String(10), nullable=False, primary_key=True)

    lesson = db.relationship("Lesson", back_populates="lesson_users")
    user = db.relationship("User", back_populates="lesson_users")

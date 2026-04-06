from app.extensions import db


class LessonLibrary(db.Model):
    __tablename__ = "lesson_library"

    lesson_id = db.Column(db.Integer, db.ForeignKey("lessons.lesson_id", ondelete="CASCADE"), primary_key=True)
    library_id = db.Column(db.Integer, db.ForeignKey("library.library_id", ondelete="CASCADE"), primary_key=True)

    lesson = db.relationship("Lesson", back_populates="lesson_library")
    library_item = db.relationship("Library", back_populates="lesson_library")

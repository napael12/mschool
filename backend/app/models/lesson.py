from app.extensions import db


class Lesson(db.Model):
    __tablename__ = "lessons"

    lesson_id = db.Column(db.Integer, primary_key=True)
    lesson_dt = db.Column(db.DateTime, nullable=False)
    description = db.Column(db.String(60))
    assignment = db.Column(db.String(4000))
    comments = db.Column(db.String(4000))
    credit_cost = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    credits_applied = db.Column(db.Boolean, nullable=False, default=False)
    created_by = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False)

    creator = db.relationship("User", foreign_keys=[created_by])
    lesson_users = db.relationship("LessonUser", back_populates="lesson", cascade="all, delete-orphan")
    lesson_library = db.relationship("LessonLibrary", back_populates="lesson", cascade="all, delete-orphan")

    def to_dict(self):
        teachers = [lu.user.to_dict() for lu in self.lesson_users if lu.user_as == "Teacher"]
        students = [lu.user.to_dict() for lu in self.lesson_users if lu.user_as == "Student"]
        library_items = [ll.library_item.to_dict() for ll in self.lesson_library]
        return {
            "lesson_id": self.lesson_id,
            "lesson_dt": self.lesson_dt.isoformat(),
            "description": self.description,
            "assignment": self.assignment,
            "comments": self.comments,
            "credit_cost": float(self.credit_cost),
            "credits_applied": self.credits_applied,
            "created_by": self.created_by,
            "creator": self.creator.to_dict() if self.creator else None,
            "teachers": teachers,
            "students": students,
            "library_items": library_items,
        }

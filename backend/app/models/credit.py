from app.extensions import db


class Credit(db.Model):
    __tablename__ = "credits"

    teacher_id = db.Column(db.Integer, db.ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("users.user_id", ondelete="CASCADE"), primary_key=True)
    balance = db.Column(db.Numeric(10, 2), nullable=False, default=0)

    teacher = db.relationship("User", foreign_keys=[teacher_id])
    student = db.relationship("User", foreign_keys=[student_id])

    def to_dict(self):
        return {
            "teacher_id": self.teacher_id,
            "student_id": self.student_id,
            "balance": float(self.balance),
            "teacher": self.teacher.to_dict() if self.teacher else None,
            "student": self.student.to_dict() if self.student else None,
        }

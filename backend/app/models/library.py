from app.extensions import db


class Library(db.Model):
    __tablename__ = "library"

    library_id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    link = db.Column(db.String(2000), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)

    creator = db.relationship("User", foreign_keys=[created_by])
    lesson_library = db.relationship("LessonLibrary", back_populates="library_item", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "library_id": self.library_id,
            "title": self.title,
            "link": self.link,
            "created_by": self.created_by,
            "creator": self.creator.to_dict() if self.creator else None,
        }

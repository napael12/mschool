from datetime import timezone
from app.extensions import db


class UserVisit(db.Model):
    __tablename__ = "user_visits"

    visit_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    login_at = db.Column(db.DateTime(timezone=True), nullable=False)
    last_seen_at = db.Column(db.DateTime(timezone=True), nullable=False)

    user = db.relationship("User", foreign_keys=[user_id])

    def duration_seconds(self):
        return int((self.last_seen_at - self.login_at.replace(tzinfo=timezone.utc)
                    if self.login_at.tzinfo is None else
                    self.last_seen_at - self.login_at).total_seconds())

    def to_dict(self):
        return {
            "visit_id": self.visit_id,
            "user_id": self.user_id,
            "user": self.user.to_dict() if self.user else None,
            "login_at": self.login_at.isoformat(),
            "last_seen_at": self.last_seen_at.isoformat(),
            "duration_seconds": self.duration_seconds(),
        }

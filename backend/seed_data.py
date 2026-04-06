"""
Run this script once to populate the database with test users and sample lessons.
Usage:  python seed_data.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import bcrypt
from datetime import datetime, timedelta
from app import create_app
from app.extensions import db
from app.models.user import User
from app.models.lesson import Lesson
from app.models.lesson_user import LessonUser


def hash_pw(plain):
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


USERS = [
    {"email": "admin@mschool.com",    "first_nm": "Admin",   "last_nm": "User",    "profile": "Admin"},
    {"email": "teacher1@mschool.com", "first_nm": "Alice",   "last_nm": "Smith",   "profile": "Teacher"},
    {"email": "teacher2@mschool.com", "first_nm": "Bob",     "last_nm": "Jones",   "profile": "Teacher"},
    {"email": "student1@mschool.com", "first_nm": "Carol",   "last_nm": "White",   "profile": "Student"},
    {"email": "student2@mschool.com", "first_nm": "David",   "last_nm": "Brown",   "profile": "Student"},
    {"email": "student3@mschool.com", "first_nm": "Eve",     "last_nm": "Taylor",  "profile": "Student"},
]


def seed():
    app = create_app()
    with app.app_context():
        db.create_all()

        # Skip if already seeded
        if User.query.count() > 0:
            print("Database already has users — skipping seed.")
            return

        users = {}
        for u in USERS:
            user = User(password_hash=hash_pw("password"), **u)
            db.session.add(user)
            db.session.flush()
            users[u["email"]] = user
            print(f"  Created user: {u['email']} ({u['profile']})")

        # Sample lessons
        base = datetime.now().replace(hour=10, minute=0, second=0, microsecond=0)
        lessons_data = [
            {
                "lesson_dt": base + timedelta(days=1),
                "description": "Piano Basics",
                "assignment": "Practice C major scale for 20 minutes daily.",
                "creator": users["teacher1@mschool.com"],
                "teachers": [users["teacher1@mschool.com"]],
                "students": [users["student1@mschool.com"], users["student2@mschool.com"]],
            },
            {
                "lesson_dt": base + timedelta(days=3),
                "description": "Music Theory 101",
                "assignment": "Read chapter 2 on intervals.",
                "creator": users["teacher2@mschool.com"],
                "teachers": [users["teacher2@mschool.com"]],
                "students": [users["student2@mschool.com"], users["student3@mschool.com"]],
            },
            {
                "lesson_dt": base + timedelta(days=5),
                "description": "Advanced Chords",
                "assignment": "Learn Am, Dm, Em chord shapes.",
                "creator": users["teacher1@mschool.com"],
                "teachers": [users["teacher1@mschool.com"], users["teacher2@mschool.com"]],
                "students": [users["student1@mschool.com"], users["student3@mschool.com"]],
            },
        ]

        for ld in lessons_data:
            lesson = Lesson(
                lesson_dt=ld["lesson_dt"],
                description=ld["description"],
                assignment=ld["assignment"],
                created_by=ld["creator"].user_id,
            )
            db.session.add(lesson)
            db.session.flush()
            for t in ld["teachers"]:
                db.session.add(LessonUser(lesson_id=lesson.lesson_id, user_id=t.user_id, user_as="Teacher"))
            for s in ld["students"]:
                db.session.add(LessonUser(lesson_id=lesson.lesson_id, user_id=s.user_id, user_as="Student"))
            print(f"  Created lesson: {ld['description']}")

        db.session.commit()
        print("\nSeed complete.")


if __name__ == "__main__":
    seed()

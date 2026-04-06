# MSchool

Music school lesson scheduling web application.

## Stack
- **Frontend**: React + Material UI (Vite dev server on port 5173)
- **Backend**: Flask / Python (port 5000)
- **Database**: PostgreSQL (`ria` database, local)

---

## Setup

### 1. Database

Apply the schema to your local PostgreSQL instance:

```bash
psql -U ria -d ria -f mschool.sql
```

### 2. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
python seed_data.py          # create test users and sample lessons
python run.py                # starts on http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                  # starts on http://localhost:5173
```

---

## Test Accounts

All passwords: `password`

| Email | Role |
|-------|------|
| admin@mschool.com | Admin |
| teacher1@mschool.com | Teacher |
| teacher2@mschool.com | Teacher |
| student1@mschool.com | Student |
| student2@mschool.com | Student |
| student3@mschool.com | Student |

---

## Role Permissions

| Feature | Admin | Teacher | Student |
|---------|-------|---------|---------|
| View dashboard metrics | ✓ | — | — |
| Manage users | ✓ | — | — |
| Invite users | ✓ | ✓ | — |
| Create lessons | ✓ | ✓ | — |
| Edit own lessons | ✓ | ✓ | — |
| Delete any lesson | ✓ | — | — |
| View lessons | ✓ | ✓ (own) | ✓ (own) |
| Add comments | ✓ | ✓ | ✓ |

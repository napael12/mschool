-- MSchool Database Schema

CREATE TABLE users (
    user_id       INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email         VARCHAR(250) UNIQUE NOT NULL,
    phone         VARCHAR(120),
    first_nm      VARCHAR(120),
    last_nm       VARCHAR(120),
    profile       VARCHAR(30) NOT NULL,
    password_hash VARCHAR(256) NOT NULL
);

CREATE TABLE lessons (
    lesson_id   INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    lesson_dt   TIMESTAMP NOT NULL,
    description VARCHAR(60),
    assignment       VARCHAR(4000),
    comments         VARCHAR(4000),
    credit_cost      NUMERIC(10,2) NOT NULL DEFAULT 0,
    credits_applied  BOOLEAN NOT NULL DEFAULT FALSE,
    created_by       INT NOT NULL REFERENCES users(user_id)
);

CREATE TABLE lesson_users (
    lesson_id INT NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    user_id   INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    user_as   VARCHAR(10) NOT NULL,
    PRIMARY KEY (lesson_id, user_id, user_as)
);

CREATE TABLE library (
    library_id  INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title       VARCHAR(200) NOT NULL,
    link        VARCHAR(2000) NOT NULL,
    created_by  INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE credits (
    teacher_id  INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    student_id  INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    balance     NUMERIC(10,2) NOT NULL DEFAULT 0,
    PRIMARY KEY (teacher_id, student_id)
);

CREATE TABLE lesson_library (
    lesson_id  INT NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,
    library_id INT NOT NULL REFERENCES library(library_id) ON DELETE CASCADE,
    PRIMARY KEY (lesson_id, library_id)
);

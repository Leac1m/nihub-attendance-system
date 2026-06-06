-- Initialize nihub database schema.
--
-- This file mirrors the state of the schema *after* running all four
-- migrations in ``server/migrations/versions/``:
--
--   0001  rename courses -> departments, drop description
--   0002  add staff.is_admin
--   0003  add registrants.password_hash, registrants.email_verified_at
--   0004  create refresh_tokens + refresh_subject_type enum
--
-- Use this file for a fresh ``nihub`` database (e.g. dropping the
-- volume and re-running ``podman start nihub-postgres``).  For an
-- existing database, run the Alembic migrations instead.

-- ── Tables ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS departments (
    code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    duration VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_pin VARCHAR(10),
    verification_pin_expires_at TIMESTAMPTZ,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE
);

ALTER TABLE staff
    ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE staff
    ADD COLUMN IF NOT EXISTS verification_pin VARCHAR(10);

ALTER TABLE staff
    ADD COLUMN IF NOT EXISTS verification_pin_expires_at TIMESTAMPTZ;

ALTER TABLE staff
    ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'refresh_subject_type') THEN
        CREATE TYPE refresh_subject_type AS ENUM ('staff', 'registrant');
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS registrants (
    id VARCHAR(20) PRIMARY KEY,
    department_code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    matriculation_number VARCHAR(20) NOT NULL,
    image_url VARCHAR(255),
    password_hash VARCHAR(255),
    email_verified_at TIMESTAMPTZ,
    CONSTRAINT fk_department FOREIGN KEY (department_code) REFERENCES departments(code) ON DELETE CASCADE,
    UNIQUE(department_code, email),
    UNIQUE(department_code, matriculation_number)
);

ALTER TABLE registrants
    ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);

ALTER TABLE registrants
    ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    subject_type refresh_subject_type NOT NULL,
    subject_id VARCHAR(64) NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_refresh_tokens_subject
    ON refresh_tokens (subject_type, subject_id);

CREATE INDEX IF NOT EXISTS ix_refresh_tokens_token_hash
    ON refresh_tokens (token_hash);

CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    registrant_id VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    present BOOLEAN DEFAULT true,
    CONSTRAINT fk_registrant FOREIGN KEY (registrant_id) REFERENCES registrants(id) ON DELETE CASCADE,
    UNIQUE(registrant_id, date)
);

-- ── Seed data ───────────────────────────────────────────────────────────────

-- Insert initial departments
INSERT INTO departments (code, name, duration) VALUES
    ('CS101', 'Computer Science', '2 weeks'),
    ('DS201', 'Data Science', '4 weeks'),
    ('SEC101', 'Cyber Security', '3 weeks'),
    ('UX301', 'UI/UX Design', '4 weeks')
ON CONFLICT (code) DO NOTHING;

-- Insert initial staff
INSERT INTO staff (username, name, email, password) VALUES
    ('alice123', 'Alice Smith', 'alice.smith@example.com', 'password123'),
    ('admin', 'Admin Smith', 'admin@email.com', 'admin123')
ON CONFLICT (username) DO NOTHING;

UPDATE staff
SET is_verified = TRUE,
    verification_pin = NULL,
    verification_pin_expires_at = NULL
WHERE username IN ('alice123', 'admin');

-- Phase 2: mark the 'admin' user as an admin so the get_current_admin
-- dependency lets them through.
UPDATE staff
SET is_admin = TRUE
WHERE username = 'admin';

# Database Migrations

The NIHUB server uses [Alembic](https://alembic.sqlalchemy.org/) for PostgreSQL schema migrations. Migrations are stored in `versions/` and applied in order.

## Important Notes

- `init.sql` is the **source of truth** for fresh database installs. It creates the full schema (tables, indexes, constraints, seed data) as of the latest phase.
- Migrations handle **schema evolution** from an existing database. They are **not** applied on fresh installs — the schema is created directly by `init.sql`.
- After `git pull` or starting a fresh environment, always run:
  ```bash
  cd server
  alembic upgrade head
  ```

## Alembic Commands

```bash
# Show the currently applied migration
alembic current

# Show full migration history (oldest → newest)
alembic history

# Apply all pending migrations
alembic upgrade head

# Roll back one migration
alembic downgrade -1

# Roll back to a specific revision
alembic downgrade <revision_id>

# Create a new migration (after modifying models)
alembic revision --autogenerate -m "description of change"
```

## Migration List

### 0001 — rename courses to departments, drop description

Renames the `courses` table to `departments`, renames the FK column on `registrants` from `course_code` to `department_code`, updates related constraints and indexes, and drops the `description` column from `departments`.

**Revises:** (none — base)  
**Downgrade:** Reverses all of the above (adds `description` back, renames back to `courses`)

---

### 0002 — add staff is_admin

Adds the `is_admin BOOLEAN NOT NULL DEFAULT FALSE` column to the `staff` table. Enables proper admin permission checks in `get_current_admin` dependency.

**Revises:** 0001  
**Downgrade:** Drops the `is_admin` column

---

### 0003 — add registrant auth columns

Adds `password_hash VARCHAR(255)` (nullable, for Argon2id PHC strings) and `email_verified_at TIMESTAMPTZ` (nullable) to the `registrants` table. Allows registrants to self-service an account with password login and email verification.

**Revises:** 0002  
**Downgrade:** Drops both columns

---

### 0004 — create refresh tokens table

Creates the `refresh_tokens` table with a `refresh_subject_type` enum (`staff`, `registrant`). Stores SHA-256 hex digests of opaque tokens (never raw tokens) with subject, issued-at, expires-at, and optional revoked-at. Indexed by `(subject_type, subject_id)` and by `token_hash`.

Also used for single-use email verification tokens: `subject_id = verify_email:<registrant_id>`, `expires_at = now() + 24h`.

**Revises:** 0003  
**Downgrade:** Drops the table and the enum type
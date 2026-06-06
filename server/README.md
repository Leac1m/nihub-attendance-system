# NIHUB Server (Backend API)

FastAPI backend for the NIHUB Attendance System. Handles authentication,
department management, attendance tracking, and email dispatch.

## Tech Stack

- **Framework:** FastAPI (Python 3.11+)
- **Database:** PostgreSQL
- **Migrations:** Alembic
- **Auth:** JWT (access tokens) + refresh token rotation, Argon2id password hashing
- **Logging:** Structured JSON to stdout + `server/logs/app.log`
- **Server:** Uvicorn (Gunicorn in production)

## Module Layout

```
server/
├── main.py                  # FastAPI app entry point, lifespan hooks
├── routers/
│   ├── __init__.py
│   ├── _legacy_courses_shim.py   # 301 redirect /courses/* → /departments/*
│   ├── admin.py             # Admin-only endpoints
│   ├── attendance.py        # Attendance sessions, check-in/out
│   ├── auth.py              # Staff login, refresh, logout
│   ├── departments.py       # Department CRUD + registrant listing
│   ├── internal.py          # Health checks, client log ingestion
│   └── registrants.py       # Registrant register, verify, login
├── services/
│   ├── __init__.py
│   ├── attendance.py        # AttendanceService (check-in/out/sessions)
│   ├── database.py          # DB connection singleton
│   ├── departments.py       # DepartmentService
│   ├── email.py             # SMTP email dispatch
│   ├── proxy_log_tailer.py  # Background tail of Caddy proxy logs
│   └── registrant_auth.py   # Argon2id hashing, verify flow
├── models.py                # Pydantic request/response models
├── dependencies.py          # FastAPI dependencies (get_db, get_current_*)
├── db.py                    # DB engine, upload directory path
├── logging_config.py        # JSON logging configuration + request_id ctx
├── alembic.ini
├── migrations/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/            # Individual migration scripts
└── requirements.txt
```

## Local Development Setup

### 1. Start PostgreSQL

```bash
cd ..
docker compose up -d postgres
```

The database schema is initialised from `init.sql` on first volume creation.

### 2. Environment Variables

```bash
cd server
cp .env.example .env
# Edit .env and set at minimum:
#   DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/nihub
#   JWT_SECRET=<a-long-random-string>
```

Required environment variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Async PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWTs (min 32 chars) |
| `REFRESH_TOKEN_DAYS` | Refresh token lifetime in days (default: 7) |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP port (e.g. 587) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `WEB_BASE_URL` | Public base URL for email verification links (e.g. `http://localhost`) |
| `ARGON2_MEMORY_COST` | Argon2id memory cost (default: 65536) |
| `ARGON2_TIME_COST` | Argon2id time cost (default: 3) |
| `ARGON2_PARALLELISM` | Argon2id parallelism (default: 4) |
| `LOG_LEVEL` | Python log level (default: INFO) |

### 3. Apply Migrations

```bash
cd server
alembic upgrade head
```

### 4. Install Dependencies

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 5. Run the Development Server

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

- API: `http://localhost:8000`
- Swagger docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Database Migrations

```bash
# Show current migration
alembic current

# Show full history
alembic history

# Apply all pending migrations
alembic upgrade head

# Roll back one migration
alembic downgrade -1

# Create a new migration (after model changes)
alembic revision --autogenerate -m "description of change"
```

Always run `alembic upgrade head` after `git pull` or starting a fresh environment.

See [`migrations/README.md`](migrations/README.md) for a full list of migrations.

## API Endpoints

### Auth (Staff)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/login` | Login → `{access_token, refresh_token, expires_in, ...}` |
| `POST` | `/auth/refresh` | Rotate access token (body: `{refresh_token}`) |
| `POST` | `/auth/logout` | Revoke refresh token |

### Auth (Registrants)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/auth/registrants/register` | Register a new attendee account |
| `POST` | `/auth/registrants/verify` | Verify email (consumes email-verification token) |
| `POST` | `/auth/registrants/login` | Attendee login |

### Departments

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/departments` | List all departments |
| `POST` | `/departments` | Create department (admin) |
| `GET` | `/departments/{code}` | Get department by code |
| `POST` | `/departments` | Create department |
| `GET` | `/departments/{code}/registrants` | List registrants |
| `POST` | `/departments/{code}/check-in` | Check in a registrant |
| `POST` | `/departments/{code}/check-out` | Check out a registrant |
| `GET` | `/departments/{code}/attendance/sessions` | Get attendance sessions (`?date=YYYY-MM-DD`) |

### Admin

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/admin/whoami` | Current staff session info |
| `GET` | `/admin/departments` | List departments |
| `GET` | `/admin/departments/{code}/registrants` | List registrants |
| `POST` | `/admin/registrants` | Create registrant |
| `GET` | `/admin/departments/{code}/spreadsheet` | Download attendance spreadsheet |

### Internal

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Basic liveness probe |
| `GET` | `/health/deep` | Liveness + DB connectivity check |
| `POST` | `/_client-logs` | Ingest client-side log records (PII-stripped) |

### Deprecated

| Method | Path | Description |
|--------|------|-------------|
| `GET/POST/...` | `/courses/*` | **Deprecated.** Returns 301 redirect to `/departments/*` |

## Attendance Sessions

The system tracks attendance as discrete **sessions** (check-in or check-out events):

```
POST /departments/{code}/check-in
  Body: { "registrant_id": <int> }
  Response: { "session_id": <int>, "status": "checked_in", "first_in_at": "..." }

POST /departments/{code}/check-out
  Body: { "registrant_id": <int> }
  Response: { "session_id": <int>, "status": "checked_out", "last_out_at": "..." }

GET /departments/{code}/attendance/sessions?date=2026-06-06
  Response: [{ "registrant_id": 1, "first_in_at": "...", "last_out_at": "...", "status": "checked_in" }, ...]
```

The spreadsheet export derives `derived_status` from `first_in_at` / `last_out_at` timestamps.

## Refresh Token Model

The `refresh_tokens` table stores SHA-256 hex digests of opaque tokens (never the raw token). It is shared between staff and registrant auth, with a `subject_type` discriminator (`staff` or `registrant`).

To revoke a user's session, set `revoked_at = now()` on the matching row. To revoke all sessions for a user, update all rows matching `(subject_type, subject_id)` where `revoked_at IS NULL`.

Email verification tokens use the same table: `subject_id = verify_email:<registrant_id>`, `expires_at = now() + 24h`.

## Logging

All server logs are structured JSON, written to both stdout and `server/logs/app.log`.

Log level is controlled by the `LOG_LEVEL` environment variable (default: `INFO`).

Each request gets a unique `request_id` (from `X-Request-ID` header or UUID4) which appears in every log line for that request and is returned in the `X-Request-ID` response header.

The proxy log tailer (`services/proxy_log_tailer.py`) monitors Caddy's access/error logs in the shared `proxy_logs` volume and emits `network_failure` events when it detects upstream errors (502/503/504 or connection refused/reset patterns).

## Reverse Proxy

The server sits behind a single Caddy reverse proxy — the only publicly reachable endpoint. Both server and frontend run on the internal `nihub-net` bridge network with no host port bindings.

Public URLs through the proxy:

| URL | Upstream |
|-----|----------|
| `http://localhost/` | Frontend SPA (port 8080) |
| `http://localhost/api/*` | Server API (port 8000) |
| `http://localhost/departments/*` | Server API |
| `http://localhost/auth/*` | Server API |
| `http://localhost/admin/*` | Server API |
| `http://localhost/uploads/*` | Server static files |
| `http://localhost/health` | Server liveness |
| `http://localhost/_client-logs` | Server client log ingestion |

For TLS in production, replace `:80 { ... }` in the `Caddyfile` with `<your.domain> { ... }`. Caddy will fetch and renew a Let's Encrypt certificate automatically.
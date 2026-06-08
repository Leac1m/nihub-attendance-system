# NIHUB Attendance System — Build Context

**Last updated**: 2026-06-07
**Git main**: `b9adb2c` → `d7fa13b` (mobile admin parity — most recent commit)

---

## What is this project?

NIHUB Attendance System is a full-stack attendance management platform with three clients:
- **Web admin portal** (React + Vite, served by nginx, behind Caddy proxy)
- **Web attendee portal** (React, same deployment — allows verified attendees to view their own attendance)
- **Mobile app** (Flutter, connects directly to the API via configurable base URL)
- **Backend API** (FastAPI + PostgreSQL + Alembic migrations)

A single Caddy reverse proxy (port 80 inside container, mapped to host 8080) routes all traffic:
- `/api/*` → FastAPI backend (port 8000)
- `/uploads/*` → static file serving from backend
- `/health/*` → health check
- `/_client-logs` → client-side log ingestion
- everything else → React frontend (port 8080)

---

## Architecture overview

```
Browser/Mobile (host:8080)
         │
         ▼
    Caddy (nihub-proxy, :80)
         │
    ┌────┴──────────────┐
    ▼                  ▼
Frontend (nginx)   Backend (FastAPI/gunicorn)
                                    │
                                    ▼
                               PostgreSQL
```

### Services (compose.yml)

| Service | Image | Port (host) | Notes |
|---|---|---|---|
| `postgres` | `postgres:16-alpine` | `5432:5432` (via override) | `nihub/nihub-password` |
| `nihub-server` | `localhost/nihub-attendance-system_nihub-server` | none (proxy only) | gunicorn + uvicorn worker |
| `nihub-frontend` | `localhost/nihub-attendance-system_nihub-frontend` | none (proxy only) | nginx serving built React |
| `nihub-proxy` | `caddy:2-alpine` | `8080:80` (via override) | reverse proxy |

### Mobile app

- Connects to `http://10.1.1.253/api` on Android (default); configurable via triple-tap dev override
- On iOS/other: `http://localhost:8000`
- State: Riverpod (StateNotifier + FutureProvider), no code generation
- Auth: JWT access token + refresh token, `FlutterSecureStorage`
- Auth flow: silent refresh on launch, 401 → refresh → retry once → force sign-out on failure

---

## Database schema

**8 tables** (all via Alembic migrations 0001–0008):

| Table | Key columns |
|---|---|
| `departments` | `code` (PK), `name`, `duration` |
| `staff` | `id` (PK), `username` (unique), `name`, `email`, `password` (plain-text, testing-only), `is_verified`, `is_admin`, `verification_pin`, `verification_pin_expires_at`, `requested_admin` |
| `registrants` | `id` (PK, format `ATT-<8hex>`), `department_code` (FK), `name`, `email`, `phone`, `matriculation_number`, `image_url`, `password_hash` (Argon2id), `email_verified_at`, `deleted_at` (soft delete) |
| `attendance` | `id` (PK), `registrant_id` (FK), `date`, `present` (legacy), `first_in_at`, `last_out_at`, `derived_status` (`absent`/`partial`/`present`) |
| `attendance_sessions` | `id` (PK), `registrant_id` (FK), `session_type` (`'in'`/`'out'`), `occurred_at`, `staff_id` (always NULL from current endpoints) |
| `refresh_tokens` | `id` (PK), `token_hash` (SHA-256), `subject_type` (ENUM), `subject_id`, `issued_at`, `expires_at`, `revoked_at` |

**Spreadsheet status values**: `2`=present (green), `1`=partial (yellow), `0`=absent (red), `–`=no record

---

## Backend API (FastAPI, 6 routers)

| Router | Path prefix | Auth | Notes |
|---|---|---|---|
| `auth` | `/auth` | None | Login, register, verify, refresh, logout |
| `departments` | `/departments` | `get_current_staff` (or none for GET list) | CRUD + registrants |
| `registrants` | `/departments/{code}/register` | None | Public registration form |
| `attendance` | `/departments/{code}/attendance` | `get_current_staff` | check-in, check-out, sessions, spreadsheet |
| `admin` | `/admin` | `get_current_admin` (is_admin=true) | Registrant CRUD, attendance override, QR resend, staff approve |
| `internal` | `/_client-logs`, `/health` | None | Ops endpoints |

### Staff auth (plain-text password, HS256 JWT)
- `POST /auth/login` → `{access_token, refresh_token, ...}`, token includes `is_admin`, `name`, `email`
- `POST /auth/register` → sends 6-digit PIN to `ADMIN_EMAIL`
- `POST /auth/verify-account` → issues tokens, sets `is_verified=TRUE`
- `POST /auth/refresh` → rotates refresh token

### Admin-only endpoints (require `is_admin=true` in DB)
- `PUT /admin/departments/{code}/registrants/{id}` — edit name/email/phone (matric locked)
- `DELETE /admin/departments/{code}/registrants/{id}` — soft delete (sets `deleted_at`)
- `POST /admin/departments/{code}/registrants` — create with optional image (multipart), fires QR email
- `PUT /admin/departments/{code}/registrants/{id}/attendance` — manual status 0/1/2
- `POST /admin/departments/{code}/registrants/{id}/resend-qr` — resend registration email
- `GET /admin/departments/{code}/registrants/{id}/qr.png` — download QR PNG
- `GET /admin/whoami` — current admin profile
- `POST /admin/staff/{username}/approve` — set `is_admin=TRUE` for verified staff
- `GET /admin/staff/pending` — list verified, non-admin staff with `requested_admin=TRUE`

### Department edit
- `PUT /departments/{code}` — update name and/or duration (any staff)

---

## Current Alembic state

```
0001 -> 0002 -> 0003 -> 0004 -> 0005 -> 0006 -> 0007 -> 0008 (head)
```

- **0007**: no-op placeholder (Wave 7 mobile-admin-parity)
- **0008**: adds `staff.requested_admin BOOLEAN NOT NULL DEFAULT FALSE`

To run pending migrations: `cd server && set -a && source .env && set +a && .venv/bin/alembic upgrade head`

---

## Key constraints & preferences

- **Podman only** — never use `docker` commands directly. `podman compose up/down/build`
- **No docker user namespace remapping** — avoids the `crun exec.fifo` stale container issue after host reboot; fix stale containers with `podman rm -f $(podman ps -aq) && podman compose down --remove-orphans`
- **Build cache invalidation** — `podman compose build --no-cache` does not always invalidate COPY layers; if code is stale in container, `podman rm -f <container>` + `podman compose down` + `podman compose up -d`
- **JWT secret + SMTP credentials in `server/.env`** — never commit this file
- **Staff passwords plain text** in DB (`staff_auth.py:183` — marked "testing-only")
- **Email**: plain text only; QR as inline `MIMEImage` + file attachment
- **Git push blocked** — no GitHub credentials in environment; user must push manually
- **`flutter analyze`**: 12 info-level issues (deprecated `Share` API, async BuildContext, unnecessary underscores) — pre-existing, not to be "fixed" unless new warnings are introduced
- **`proxy_log_tailer`**: crashes on startup with `awatch() got unexpected keyword argument 'stop_on_none'` — cosmetic, non-fatal
- **ContainerDB host**: `postgres:5432` inside compose network; `localhost:5432` for local dev

---

## Test credentials

| Role | Username | Password | Notes |
|---|---|---|---|
| Admin | `admin` | `admin123` | `is_admin=TRUE`, `is_verified=TRUE` |
| Staff (unverified) | any | any | Register → PIN emailed to `ADMIN_EMAIL` |

---

## File layout

```
/
├── Caddyfile                    # Reverse proxy config
├── compose.yml                  # 4 services (postgres, server, frontend, proxy)
├── compose.override.yml        # Dev: 5432:5432 + 8080:80
├── CHANGELOG.md
├── README.md
├── system-upgrade-plans.md
├── server/
│   ├── main.py                  # FastAPI entry, lifespan, middleware
│   ├── routers/                 # auth, departments, registrants, attendance, admin, internal
│   ├── services/                # staff_auth, department_service, attendance_service, email_service, proxy_log_tailer
│   ├── models.py                # Pydantic request/response models
│   ├── db.py                    # DB connection + UPLOAD_DIR
│   ├── dependencies.py          # get_current_staff, get_current_admin
│   ├── migrations/
│   │   ├── versions/0001–0008   # Schema migrations
│   │   └── README.md            # Alembic usage guide
│   ├── init.sql                 # Fresh-db schema (mirrors 0001–0004)
│   └── .env                     # DATABASE_URL, SMTP_*, JWT_SECRET, ADMIN_EMAIL, WEB_BASE_URL
├── frontend/                    # React + Vite + TypeScript (admin + portal pages)
├── mobile/                      # Flutter (Riverpod, go_router, Dio)
│   ├── lib/
│   │   ├── app/                 # app.dart, router.dart
│   │   ├── core/
│   │   │   ├── config/          # api_config.dart, endpoints.dart
│   │   │   ├── network/         # api_client.dart (Dio), auth_event_bus.dart
│   │   │   ├── services/        # notification_service.dart
│   │   │   ├── storage/         # secure_storage.dart
│   │   │   └── theme/           # app_theme.dart
│   │   ├── features/
│   │   │   ├── auth/            # login, register, verify, auth_provider, auth_state
│   │   │   ├── admin/           # role_gate.dart (AdminOnly widget)
│   │   │   └── departments/    # departments, registrants, scan, QR
│   │   └── main.dart
│   └── pubspec.yaml             # image_picker, table_calendar, share_plus, go_router, flutter_riverpod
└── brand/                       # Source-of-truth brand assets (colors, logo SVG, email template)
```

---

## What's currently in flight / planned

### Planned (system-upgrade-plans.md)
- Remove admin web portal; mobile app takes over all admin functions → **IN PROGRESS** (Wave A/B/C complete, web portal not yet removed)
- Staff want to check in AND check out attendees → **DONE** (Phase 6)
- Auto-re-auth on mobile → **DONE** (Phase 5 silent refresh)

### Known issues
- `proxy_log_tailer` crash on startup (`awatch()` signature mismatch) — cosmetic
- `git push` requires manual credentials
- 12 pre-existing `flutter analyze` info-level warnings — do not add new warnings, but info-level is acceptable

---

## How to verify the server is up

```bash
# Smoke test (from host)
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -d "username=admin&password=admin123" | python3 -c "import sys,json; print(json.load(sys.stdin)['access_token'])")
curl "http://localhost:8080/api/departments" -H "Authorization: Bearer $TOKEN"
curl -X PUT "http://localhost:8080/api/departments/UX301" \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"UX 301 Updated"}'
curl "http://localhost:8080/api/admin/staff/pending" -H "Authorization: Bearer $TOKEN"
```

## How to rebuild the server

```bash
podman compose down
podman compose build --no-cache nihub-server
podman compose up -d
```

## How to run migrations

```bash
cd server
set -a && source .env && set +a
.venv/bin/alembic upgrade head
```
# Changelog

All notable changes to the NIHUB Attendance System are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

## [Unreleased] — Mobile Admin Parity Backend
- PUT /departments/{code} to edit department name/duration
- POST /admin/departments/{code}/registrants now accepts multipart with optional image
- POST /admin/staff/{username}/approve — grant admin role to verified staff
- GET /admin/staff/pending — list staff who requested admin role
- Staff registration accepts `requested_admin` flag; admin email notified of role requests

## Phase 7 — Branding

_Agent G is currently implementing branding changes in parallel._

## Phase 6 — Check-In / Check-Out (`phase/6-check-in-out`)

### Added
- `attendance_sessions` table with `session_type` enum (`in`/`out`)
- `POST /departments/{code}/check-in` endpoint
- `POST /departments/{code}/check-out` endpoint
- `GET /departments/{code}/attendance/sessions?date=YYYY-MM-DD` endpoint
- `AttendanceService` extracted from `DepartmentService`
- Mobile check-in/out buttons replacing Accept/Deny on registrant tiles
- Status badge on registrant list tile (checked in / checked out / not checked in)

### Changed
- Spreadsheet export now reads from `first_in_at`/`last_out_at`/`derived_status` columns

## Phase 5 — Mobile Auth & Manual Check-In (`phase/5-mobile-auth-manual-checkin`)

### Added
- Silent JWT refresh on app launch (background token validation + refresh)
- `AuthEventBus` for force-signout across all Riverpod providers
- Refresh token storage in `FlutterSecureStorage`
- `/departments/:code/registrants` manual check-in screen
- Status badge on registrant list tiles

### Changed
- All mobile `/events/*` routes renamed to `/departments/*`
- `EventModel` renamed to `DepartmentModel`; `description` field removed

## Phase 4 — Web Expansion (`phase/4-web-expansion`)

### Added
- React Router v6 with full routing (public, portal, admin)
- Auth context with Axios interceptor for automatic token refresh
- Admin dashboard (`/admin/departments`, `/admin/departments/:code/registrants`, `/admin/departments/:code/spreadsheet`)
- Attendee self-service portal (`/portal/login`, `/portal`, `/portal/attendance`)
- Client-side logger that ships to `POST /_client-logs` endpoint

### Changed
- Frontend now uses `/api/*` Vite proxy consistently in development

## Phase 3 — Reverse Proxy (`phase/3-reverse-proxy`)

### Added
- Caddy 2 reverse proxy as single public entrypoint (port 80)
- `proxy_logs` Docker volume shared between proxy and server containers
- Proxy log tailer service that emits `network_failure` events on upstream 502/503/504 errors

### Changed
- Server and frontend containers no longer expose host ports directly; all traffic routes through Caddy

## Phase 2 — Server Rename & Auth (`phase/2-server-rename-auth`)

### Added
- Alembic migration system for schema evolution
- `departments` table (renamed from `courses`) with `description` column removed
- `refresh_tokens` table for refresh token rotation (staff and registrants)
- Staff refresh token auth (`POST /auth/refresh`, `POST /auth/logout`)
- Registrant self-registration and email verification (`POST /auth/registrants/register`, `POST /auth/registrants/verify`)
- Registrant login with Argon2id password hashing (`POST /auth/registrants/login`)
- `is_admin` flag on `staff` table for admin permission checks
- `password_hash` and `email_verified_at` columns on `registrants` table

### Changed
- All `/courses/*` endpoints renamed to `/departments/*`
- `POST /auth/login` response shape changed to `{access_token, refresh_token, token_type, expires_in, refresh_expires_at}`

### Deprecated
- `/courses/*` paths — returns 301 redirect to `/departments/*`

### Removed
- `description` field from departments table

## Phase 0–1 — Server Foundation (`phase/0-1-server-foundation`)

### Added
- Structured JSON logging system with `request_id` tracing across all log lines
- Server log output to `server/logs/app.log`
- `GET /health/deep` endpoint with database connectivity check
- `POST /_client-logs` endpoint for client-side log ingestion with PII stripping
- Gunicorn configuration with JSON access logging
- `services/proxy_log_tailer.py` for monitoring Caddy proxy error logs

### Changed
- Monolithic `app.py` split into `main.py` + `routers/` + `services/` + `models.py` + `dependencies.py`
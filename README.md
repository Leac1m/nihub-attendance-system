# NIHUB Attendance System

<div align="center">
  A comprehensive, multi-client platform for managing events and tracking attendee attendance using QR code scanning.
</div>

---

## Overview

The NIHUB Attendance System provides a robust solution for tracking user attendance at various events or courses. It utilizes a central API and database, with dedicated frontends for both web (dashboard/management) and mobile (on-site QR scanning and attendance logging).

## System Architecture

```
                              ┌─────────────────────────────────────┐
                              │          Caddy Reverse Proxy         │
                              │         (single public entry)        │
                              │              :80 / :443              │
                              └──────────────┬───────────────────────┘
                                             │
                         ┌───────────────────┼───────────────────┐
                         │                   │                   │
                         ▼                   ▼                   ▼
                ┌──────────────┐    ┌────────────────┐   ┌──────────────┐
                │    Web       │    │     Server     │   │   (future)   │
                │   (React)    │    │   (FastAPI)    │   │              │
                │  port 8080   │    │   port 8000    │   │              │
                │  /admin/*    │    │  /api/*        │   │              │
                │  /portal/*   │    │  /departments/*│   │              │
                │  /register/* │    │  /auth/*       │   │              │
                └──────────────┘    │  /admin/*      │   └──────────────┘
                                    │  /health/*     │
                                    └────────┬───────┘
                                             │
                                    ┌────────▼────────┐
                                    │   PostgreSQL    │
                                    │     :5432       │
                                    └─────────────────┘
```

**Components:**
- **Server** (`server/`) — FastAPI backend. Handles auth, department management, attendance tracking, and email.
- **Frontend** (`frontend/`) — React 19 + Vite + TypeScript. Web admin dashboard (`/admin/*`), attendee portal (`/portal/*`), and registration (`/register/*`).
- **Mobile** (`mobile/`) — Flutter + Riverpod. On-site QR scanning and manual check-in/out.
- **Caddy Proxy** (`Caddyfile`) — Single public entrypoint. Routes `/api/*` to the server and everything else to the frontend SPA.
- **PostgreSQL** — Shared relational database.

## Tech Stack

| Component | Stack |
|-----------|-------|
| Backend | FastAPI + PostgreSQL + Alembic migrations + structured logging + Argon2id |
| Frontend | React 19 + Vite + TypeScript + React Router v6 + Axios |
| Mobile | Flutter + Riverpod + go_router + Dio |
| Reverse Proxy | Caddy 2 |
| Auth | JWT with refresh token rotation |

## Quick Start

```bash
# Start the entire stack
docker compose up -d --build

# Access services (via Caddy proxy)
# Web app:       http://localhost/
# Backend API:   http://localhost/api/  or  http://localhost/departments/
# Health check:  http://localhost/health
```

For local development without Docker, see each component's README.

## Key Endpoints

### Staff Auth
- `POST /auth/login` — Staff login → `{access_token, refresh_token, ...}`
- `POST /auth/refresh` — Rotate access token
- `POST /auth/logout` — Revoke refresh token
- `GET /admin/whoami` — Current staff session

### Registrant Auth
- `POST /auth/registrants/register` — Register a new attendee account
- `POST /auth/registrants/verify` — Verify email (click link in email)
- `POST /auth/registrants/login` — Attendee login

### Departments
- `GET /departments` — List all departments
- `POST /departments` — Create department (admin)
- `GET /departments/{code}` — Get department by code
- `GET /departments/{code}/registrants` — List registrants for a department
- `POST /departments/{code}/check-in` — Check in a registrant
- `POST /departments/{code}/check-out` — Check out a registrant
- `GET /departments/{code}/attendance/sessions?date=YYYY-MM-DD` — Get attendance sessions

> **Note:** `/courses/*` is deprecated. All endpoints have been renamed to `/departments/*` and return a 301 redirect.

### Admin
- `GET /admin/departments` — Admin: list departments
- `GET /admin/departments/{code}/registrants` — Admin: list registrants
- `POST /admin/registrants` — Admin: create registrant
- `GET /admin/departments/{code}/spreadsheet` — Download attendance spreadsheet

## Web Routes

| Path | Description |
|------|-------------|
| `/admin/*` | Admin dashboard (staff only) |
| `/portal/*` | Attendee self-service portal |
| `/register/:code` | Public registration for a department |
| `/verify-email?token=xxx` | Email verification landing |

## Database Migrations

The server uses **Alembic** for schema migrations.

```bash
cd server

# Apply all pending migrations
alembic upgrade head

# Check current migration
alembic current

# Roll back one step
alembic downgrade -1
```

Always run `alembic upgrade head` after `git pull` or when starting a fresh environment.

See [`server/migrations/README.md`](server/migrations/README.md) for full migration reference.

## Deployment

### Docker Compose (recommended)

```bash
docker compose up -d --build
```

The proxy (`nihub-proxy`) is the only service that binds to a host port. Server and frontend are on an internal `nihub-net` bridge network.

### TLS / HTTPS

The `Caddyfile` currently listens on plain `:80` with `auto_https off` for local development. For production, replace the `:80` site block with your domain:

```
yourdomain.com {
    reverse_proxy /* localhost:8080
}
```

Caddy will automatically fetch and renew a Let's Encrypt certificate.

### Environment Variables

Key server variables (see `server/.env.example`):

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for signing JWTs (min 32 chars) |
| `REFRESH_TOKEN_DAYS` | Refresh token lifetime (default: 7) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Email (SMTP) configuration |
| `WEB_BASE_URL` | Public base URL for email verification links |
| `ARGON2_*` | Argon2id password hashing tunables |

## Project Structure

```
nihub-attendance-system/
├── server/
│   ├── main.py              # FastAPI entry point
│   ├── routers/             # HTTP route handlers
│   ├── services/            # Business logic
│   ├── models.py            # Pydantic request/response models
│   ├── db.py                # Database connection & upload dir
│   ├── dependencies.py      # FastAPI dependencies (auth, db)
│   ├── logging_config.py    # Structured JSON logging
│   └── migrations/          # Alembic schema migrations
├── frontend/
│   ├── src/
│   │   ├── pages/           # React page components
│   │   ├── contexts/        # Auth context + axios interceptors
│   │   └── utils/           # API client, logger
│   └── vite.config.ts       # Vite config with /api proxy
├── mobile/
│   └── lib/
│       ├── providers/       # Riverpod providers
│       ├── models/          # Data models
│       └── services/        # API service layer
├── Caddyfile                # Caddy reverse proxy config
└── compose.yml              # Docker Compose orchestration
```
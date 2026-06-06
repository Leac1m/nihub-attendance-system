# NIHUB Frontend Dashboard

React 19 + Vite + TypeScript web application for the NIHUB Attendance System.
Provides a staff admin dashboard, attendee self-service portal, and public registration.

## Tech Stack

- **Framework:** React 19
- **Build Tool:** Vite
- **Language:** TypeScript
- **Routing:** React Router v6
- **HTTP Client:** Axios (with interceptor-based auto-refresh)
- **Package Manager:** pnpm

## Routes

### Public
| Path | Description |
|------|-------------|
| `/register/:code` | Public registration form for a department |
| `/verify-email` | Email verification landing page |

### Portal (Attendee Self-Service)
| Path | Description |
|------|-------------|
| `/portal/login` | Attendee login |
| `/portal` | Attendee dashboard |
| `/portal/attendance` | View own attendance record |

### Admin (Staff Only)
| Path | Description |
|------|-------------|
| `/admin` | Admin dashboard home |
| `/admin/departments` | List and manage departments |
| `/admin/departments/:code/registrants` | Manage registrants for a department |
| `/admin/departments/:code/spreadsheet` | Download attendance spreadsheet |

## Authentication

The frontend stores JWT access tokens and refresh tokens in `localStorage`.

Axios interceptors handle:
- Attaching `Authorization: Bearer <token>` to every API request
- Detecting 401 responses and automatically refreshing the access token using the stored refresh token
- Redirecting to `/admin` login on refresh failure (admin routes) or `/portal/login` (portal routes)

```
Login → { access_token, refresh_token, expires_in, refresh_expires_at }
Auto-refresh on 401 → POST /auth/refresh { refresh_token }
```

## API Integration

All API calls are made through the Caddy proxy at `/api/*` (production) or through Vite's dev proxy to `http://localhost:8000`.

In development, `vite.config.ts` proxies:
```
/api/*  →  http://localhost:8000/api/*
```

In production, the Caddy proxy routes `/api/*` to the server.

Key API paths:
- `POST /auth/login` — staff login
- `POST /auth/registrants/login` — attendee login
- `GET /departments` — list departments
- `GET /admin/departments/:code/registrants` — registrant list (admin)
- `POST /departments/:code/check-in` — check in (admin/mobile)
- `GET /admin/departments/:code/spreadsheet` — download spreadsheet

## Client-Side Logging

The frontend includes a client-side logger that captures browser console messages and ships them to `POST /_client-logs` on the server. PII ( URLs, localStorage values) is stripped before sending.

## Local Development Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` if needed. The Vite dev server proxies `/api/*` to `http://localhost:8000` automatically — no backend URL change required.

### 3. Start the Dev Server

```bash
pnpm run dev
```

The app will be available at `http://localhost:5173` (or the next available port).

## Building for Production

```bash
pnpm run build
```

Output is in the `dist/` directory. The `Containerfile` serves this directory with Nginx.

To run the production build locally via Docker:

```bash
docker compose up -d --build
# Frontend available at http://localhost/
```

## Code Quality

```bash
# Lint
pnpm run lint

# Type check
pnpm run typecheck
```
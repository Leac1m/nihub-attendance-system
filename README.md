# NIHUB Attendance System

NIHUB Attendance System is a multi-client attendance platform with:

- FastAPI backend in [server](server)
- React + Vite web frontend in [frontend](frontend)
- Expo mobile app in [mobile](mobile)
- PostgreSQL data store via Docker Compose in [compose.yml](compose.yml)

## Architecture

- API and auth: [server/app.py](server/app.py)
- Database schema and seed data: [server/init.sql](server/init.sql)
- Web client: [frontend](frontend)
- Mobile client: [mobile](mobile)
- Local infra orchestration: [compose.yml](compose.yml) and [compose.override.yml](compose.override.yml)

## Prerequisites

- Docker and Docker Compose
- Node.js 20+ and pnpm
- Python 3.11+ for local backend development
- Android Studio emulator and or Xcode simulator for native mobile runs

## Quick Start with Docker

Start the full stack:

```bash
docker compose up -d --build
```

Services:

- Postgres: localhost:5432
- Backend API: http://localhost:8000
- Frontend: http://localhost:8080

Check status and logs:

```bash
docker compose ps
docker compose logs -f postgres
docker compose logs -f nihub-server
```

Stop everything:

```bash
docker compose down
```

## Local Database Only

Run only Postgres for local backend and app development:

```bash
docker compose up -d postgres
```

Default local connection string:

```text
postgresql://nihub:nihub-password@localhost:5432/nihub
```

Inside Docker network, the backend uses:

```text
postgresql://nihub:nihub-password@postgres:5432/nihub
```

### Database Initialization

Schema and seed data are automatically initialized from [server/init.sql](server/init.sql) the first time the Postgres volume is created.

To reset DB from scratch:

```bash
docker compose down -v
docker compose up -d postgres
```

## Run Backend Locally

1. Start Postgres:

```bash
docker compose up -d postgres
```

2. Create env file from [server/.env.example](server/.env.example):

```bash
cp server/.env.example server/.env
```

3. Install dependencies and run:

```bash
cd server
python -m pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

## Run Frontend Locally

Available scripts in [frontend/package.json](frontend/package.json):

- `pnpm run dev`
- `pnpm run build`
- `pnpm run lint`
- `pnpm run preview`

Start frontend dev server:

```bash
cd frontend
pnpm install
pnpm run dev
```

Note: frontend dev server is configured in [frontend/vite.config.ts](frontend/vite.config.ts) to proxy `/api/*` requests to `http://localhost:8000`.

## Run Mobile Locally

Available scripts in [mobile/package.json](mobile/package.json):

- `pnpm run start`
- `pnpm run android`
- `pnpm run ios`
- `pnpm run web`
- `pnpm run lint`

Start mobile dev environment:

```bash
cd mobile
pnpm install
pnpm run start
```

API host behavior is defined in [mobile/src/config/api.ts](mobile/src/config/api.ts):

- Android emulator uses `10.0.2.2` to reach host machine
- Physical devices must use your machine LAN IP
- iOS simulator and web use `localhost`

## Environment Variables

SMTP variables documented in [server/.env.example](server/.env.example):

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_USE_TLS`
- `EMAIL_FROM`

Additional variables used by the backend:

- `DATABASE_URL`
- `JWT_SECRET`
- `ADMIN_EMAIL` for staff verification PIN emails

## Key API Endpoints

Auth:

- `POST /auth/login`
- `POST /auth/register`
- `POST /auth/verify-account`

Core:

- `GET /health`
- `GET /courses`
- `GET /courses/{course_code}/scan-context`
- `POST /courses/{course_code}/register`
- `POST /courses/{course_code}/attendance/{matric_number}`
- `GET /courses/{course_code}/attendance/spreadsheet`

Sample request collection is available in [server/requests/attendance.http](server/requests/attendance.http).

## Troubleshooting

Mobile app cannot reach backend:

- Use `10.0.2.2` on Android emulator, not `localhost`
- Use LAN IP on physical devices and ensure same network
- Confirm backend is running on `:8000`

Verification email not sent:

- Confirm SMTP variables in `server/.env`
- Confirm `ADMIN_EMAIL` is set
- Check backend logs for SMTP errors

Database changes not showing up:

- [server/init.sql](server/init.sql) only runs on first DB volume creation
- Reset volume with `docker compose down -v` and restart Postgres
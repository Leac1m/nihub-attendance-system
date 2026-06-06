# NIHUB Server (Backend API)

The backend for the NIHUB Attendance System, built with **FastAPI** (Python) and backed by a **PostgreSQL** database. 

It handles:
- Staff and user authentication (JWT).
- Course/Event management.
- Attendance tracking logic.
- QR Code context generation.
- SMTP email dispatching (e.g., account verification).

## 🛠️ Tech Stack

- **Framework:** FastAPI
- **Language:** Python 3.11+
- **Database:** PostgreSQL
- **Server:** Uvicorn

## 🚀 Local Development Setup

While you can run the backend via Docker Compose from the project root, running it locally gives you better debugging capabilities.

### 1. Start the Database

Start just the PostgreSQL database using the root Docker Compose file:
```bash
cd ..
docker compose up -d postgres
```
*Note: The database schema and seed data are automatically initialized from `init.sql` upon the first volume creation.*

### 2. Environment Variables

Create a `.env` file in this directory based on the provided example:
```bash
cp .env.example .env
```
Ensure variables like `DATABASE_URL`, `JWT_SECRET`, and the `SMTP_*` variables are correctly set. By default, it will connect to the local postgres instance exposed on `localhost:5432`.

### 3. Install Dependencies

It is highly recommended to use a virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
python -m pip install -r requirements.txt
```

### 4. Run the Development Server

Start the API with auto-reload enabled:
```bash
uvicorn app:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at: `http://localhost:8000`
You can view the interactive Swagger API documentation at: `http://localhost:8000/docs`

## 🗄️ Database Management

To reset the database, simply tear down the Docker volume from the root directory:
```bash
docker compose down -v
docker compose up -d postgres
```

## 🧪 Testing API Endpoints

A collection of sample HTTP requests is available in the `requests/attendance.http` file for use with the VS Code REST Client extension or JetBrains HTTP Client.

## 🌐 Reverse Proxy

The server sits behind a single Caddy reverse proxy (`nihub-proxy` in
`compose.yml` at the repo root) — the proxy is the only publicly reachable
entrypoint.  Both the server and the frontend run on an internal
`nihub-net` bridge network and have no host port mappings.

Public URLs:
- `http://localhost/` — the frontend SPA (served by `nihub-frontend`).
- `http://localhost/departments/*` — public department endpoints.
- `http://localhost/auth/*` — staff and registrant authentication.
- `http://localhost/admin/whoami` — staff session introspection.
- `http://localhost/uploads/*` — static uploads (proxied to the server).
- `http://localhost/health` and `http://localhost/health/deep` — health probes.
- `http://localhost/_client-logs` — POST endpoint used by web/mobile clients
  to ship their in-app logs to the server.

For local dev the proxy is also exposed on `localhost:8080` via
`compose.override.yml` so the existing client URL keeps working.  In
production only port 80 is published by `compose.yml`.

### Proxy failure detection

The proxy writes its access and error logs to a shared `proxy_logs`
Docker volume, which is also mounted into the server at
`/app/logs/proxy`.  A background coroutine in
`services/proxy_log_tailer.py` (started by the FastAPI `lifespan`
hook in `main.py`) tails these files with `watchfiles` and converts
every line that looks like an upstream failure (status 502/503/504 or
any of the standard Caddy "upstream connect/read/write error",
"dial tcp: ... refused", "connection reset by peer" patterns) into a
structured record on the `nihub.proxy_tailer` logger:

```json
{"event":"network_failure","level":"WARNING","logger":"nihub.proxy_tailer",
 "proxy_status":502,"method":"GET","path":"/departments",
 "client_ip":"10.0.0.5","upstream":"nihub-server","raw":"...","timestamp":"..."}
```

These records flow through the same JSON formatter as the rest of the
server logs and land in `server/logs/app.log` (and stdout) for
alerting/aggregation.

### TLS

`Caddyfile` currently listens on plain `:80` and has `auto_https off`
so it works in the dev container without certificates.  To enable
HTTPS in production, replace the `:80 { ... }` site block with
`<your.domain> { ... }` — Caddy will fetch and renew a Let's Encrypt
cert automatically.


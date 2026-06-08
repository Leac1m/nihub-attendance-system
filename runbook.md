# NIHUB Attendance System Runbook

This document outlines the steps required to deploy, run, and manage the NIHUB Attendance System.

## Architecture Overview

The system consists of the following main components:
1. **PostgreSQL Database**: Stores all application data.
2. **Server**: Backend API handling logic and data access.
3. **Frontend**: Web interface.
4. **Mobile App**: Flutter app for staff to manage attendance.
5. **Caddy Proxy**: Reverse proxy directing traffic to the server and frontend.

## Prerequisites

- Docker and Docker Compose installed (for backend infrastructure)
- Flutter SDK installed (for mobile app development)

Note: Podman can be used as an alternative to Docker. Modern Podman includes a `podman compose` command that is largely compatible with `docker compose`. On some systems the separate `podman-compose` wrapper may be available instead — adjust commands accordingly.
## Running the Backend Infrastructure

The backend services are containerized and managed via Docker Compose.

1. **Configure Environment Variables**:
   Ensure you have a `.env` file in the `server/` directory:
   ```env
   # server/.env example
   JWT_SECRET=dev-secret-change-me
   ```

2. **Start the Services**:
   From the root of the repository, run (Docker):
   ```bash
   docker compose up -d --build
   ```

   Or, if you're using Podman:
   ```bash
   podman compose up -d --build
   ```
   This will build and start:
   - `nihub-postgres`: The database instance.
   - `nihub-server`: The backend API.
   - `nihub-frontend`: The web interface.
   - `nihub-proxy`: Caddy proxy handling incoming requests.

3. **Verify Deployment**:
   Check the status of the running containers:
   ```bash
   docker compose ps
   # or with Podman:
   podman compose ps
   ```
   You can view logs for a specific service:
   ```bash
   docker compose logs -f nihub-server
   # or with Podman:
   podman compose logs -f nihub-server
   ```

## Database Initialization
The PostgreSQL container runs an initialization script on its first startup from `./server/init.sql`. If you need to re-initialize, you may need to drop the volume:
```bash
docker compose down -v
docker compose up -d
```

## Data Migration from Legacy Versions

If you are upgrading an existing deployment running an older version of the attendance system (e.g., migrating from "Courses/Events" to "Departments"), follow these steps to ensure safe data migration without data loss:

1. **Backup the Legacy Database:**
   Before running any new containers or applying updates, create a complete backup of your production database. If you are using the dockerized PostgreSQL instance:
   ```bash
   docker exec -it nihub-postgres pg_dump -U nihub nihub > legacy_database_backup.sql
   ```

2. **Deploy the Updated Backend:**
   Pull the latest code and start the new containers. **Do not** drop the existing `postgres_data` volume.
   ```bash
   docker compose up -d --build
   ```

3. **Run Database Migrations:**
   The backend uses Alembic to manage schema and data migrations (such as renaming tables from `courses` to `departments` and updating schema constraints).
   Apply the pending migrations to your database:
   ```bash
   docker compose exec nihub-server alembic upgrade head
   ```

4. **Verify Migration Integrity:**
   Check the application logs to ensure there are no migration errors:
   ```bash
   docker compose logs -f nihub-server
   ```
   Log into the web interface or use the new mobile app to verify that historical data (e.g., previous attendees and check-in sessions) is intact and properly mapped to the new "Departments" structure.

5. **Rollback (If Necessary):**
   If the migration fails, you can restore your original data from the backup:
   ```bash
   docker compose down
   # Restore the SQL dump to the database if needed, or downgrade via Alembic:
   # docker compose exec nihub-server alembic downgrade -1
   ```

## Managing the Mobile App

For detailed instructions on the mobile application, see [mobile/README.md](./mobile/README.md).

### Local Development
To run the mobile app locally:
1. Navigate to the `mobile/` directory.
2. Run `flutter pub get` to install dependencies.
3. Set the `API_BASE_URL` environment variable to point to your running backend (e.g., `http://10.0.2.2:8000` for Android emulator local testing).
4. Run `flutter run` to launch the app on an emulator or connected device.
   - For Android emulator: `flutter run -d emulator-5554`

## Stopping the System
To stop all backend services:
```bash
docker compose down
```
If you also want to remove volumes (which deletes database data, server uploads, and logs), use:
```bash
docker compose down -v
```

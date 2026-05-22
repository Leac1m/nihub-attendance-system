# NIHUB Attendance System

## Local Database Setup

The backend uses PostgreSQL for local development. The database is defined in [compose.yml](compose.yml) and seeded from [server/init.sql](server/init.sql).

### Start only the database

```bash
docker compose up -d postgres
```

This starts a PostgreSQL 16 container with these defaults:

- Database: `nihub`
- User: `nihub`
- Password: `nihub-password`
- Host port: `5432`

### Start the full backend stack

```bash
docker compose up -d
```

This starts:

- `postgres` on port `5432`
- `nihub-server` on port `8000`
- `nihub-frontend` on port `8080`

### First-time initialization

The Postgres service mounts [server/init.sql](server/init.sql) into `/docker-entrypoint-initdb.d/init.sql`, so the schema and seed data are created automatically the first time the database volume is created.

If you need to re-run the initialization from scratch, remove the volume and start Postgres again:

```bash
docker compose down -v
docker compose up -d postgres
```

### Connect from the backend

The server uses this database URL in Docker:

```text
postgresql://nihub:nihub-password@postgres:5432/nihub
```

For local development outside Docker, you can use:

```text
postgresql://nihub:nihub-password@localhost:5432/nihub
```

### Useful checks

```bash
docker compose ps
docker compose logs -f postgres
```

### Notes

- `compose.override.yml` publishes the Postgres port to the host as `5432:5432`.
- The database schema is seeded with sample courses and staff accounts from [server/init.sql](server/init.sql).
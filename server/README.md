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

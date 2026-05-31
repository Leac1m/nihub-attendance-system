from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://nihub:nihub-password@localhost:5432/nihub")
UPLOAD_DIR = Path("uploads")


def get_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)


def load_data() -> dict[str, Any]:
    """Load all data from PostgreSQL - used for migration compatibility."""
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT code, name, description, duration FROM courses")
            courses = [dict(row) for row in cur.fetchall()]
            return {"courses": courses, "staffs": []}


def save_data(data: dict[str, Any]) -> None:
    """Save data to PostgreSQL - used for migration compatibility."""
    pass  # Data is managed by individual service functions
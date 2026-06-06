"""
seed.py — Populate the NiHub attendance DB with realistic mock data.

Departments: 2
Students:    8 per department  (16 total)
Dates:       10 class days per department (spread over the last 2 weeks)
Pattern:     random present/absent per student per day (~80 % attendance rate)

Run:  /path/to/venv/python3 seed.py
"""

import os
import random
import uuid
from datetime import date, timedelta
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent / ".env")

import psycopg2
from psycopg2.extras import RealDictCursor

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://nihub:nihub-password@localhost:5432/nihub"
)


def short_id() -> str:
    """Generate a 20-char hex ID that fits the VARCHAR(20) registrants.id column."""
    return uuid.uuid4().hex[:20]


# ── Mock data ──────────────────────────────────────────────────────────────────

DEPARTMENTS = [
    {
        "code": "CS101",
        "name": "Introduction to Computer Science",
        "duration": "16 weeks",
    },
    {
        "code": "DS301",
        "name": "Data Science & Machine Learning",
        "duration": "12 weeks",
    },
]

# (name, email, phone, matric_no, department_code)
STUDENTS = [
    # CS101 — 8 students
    ("Adaeze Okonkwo",    "adaeze.okonkwo@edu.ng",    "+23480123456", "CS2021001", "CS101"),
    ("Emeka Nwosu",       "emeka.nwosu@edu.ng",        "+23480234567", "CS2021002", "CS101"),
    ("Fatima Al-Hassan",  "fatima.alhassan@edu.ng",    "+23480345678", "CS2021003", "CS101"),
    ("Chukwuemeka Eze",   "chuks.eze@edu.ng",          "+23480456789", "CS2021004", "CS101"),
    ("Ngozi Obi",         "ngozi.obi@edu.ng",           "+23480567890", "CS2021005", "CS101"),
    ("Babatunde Adeyemi", "babs.adeyemi@edu.ng",        "+23480678901", "CS2021006", "CS101"),
    ("Amina Garba",       "amina.garba@edu.ng",         "+23480789012", "CS2021007", "CS101"),
    ("Tunde Fashola",     "tunde.fashola@edu.ng",       "+23480890123", "CS2021008", "CS101"),
    # DS301 — 8 students
    ("Ifeoma Nwachukwu",  "ifeoma.nwachukwu@edu.ng",   "+23480901234", "DS2022001", "DS301"),
    ("Suleiman Musa",     "suleiman.musa@edu.ng",       "+23480012345", "DS2022002", "DS301"),
    ("Chidinma Okeke",    "chidinma.okeke@edu.ng",      "+23481123456", "DS2022003", "DS301"),
    ("Oluwaseun Adeleke", "oluwaseun.adeleke@edu.ng",   "+23481234567", "DS2022004", "DS301"),
    ("Yusuf Abdullahi",   "yusuf.abdullahi@edu.ng",     "+23481345678", "DS2022005", "DS301"),
    ("Blessing Okafor",   "blessing.okafor@edu.ng",     "+23481456789", "DS2022006", "DS301"),
    ("Kelechi Onyeka",    "kelechi.onyeka@edu.ng",      "+23481567890", "DS2022007", "DS301"),
    ("Hauwa Umar",        "hauwa.umar@edu.ng",           "+23481678901", "DS2022008", "DS301"),
]

random.seed(42)


def class_dates(n: int = 10) -> list[date]:
    """Return the last n Mon–Sat days, sorted ascending."""
    today = date.today()
    days: list[date] = []
    d = today - timedelta(days=1)
    while len(days) < n:
        if d.weekday() < 6:  # Mon(0)–Sat(5)
            days.append(d)
        d -= timedelta(days=1)
    return sorted(days)


def run() -> None:
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    cur = conn.cursor()

    print("🌱  Seeding database …\n")

    # ── Departments ───────────────────────────────────────────────────────────
    for c in DEPARTMENTS:
        cur.execute("SELECT code FROM departments WHERE code = %s", (c["code"],))
        if cur.fetchone():
            print(f"   ⏭  Department {c['code']} already exists, skipping.")
            # Update name/duration so the seed reflects the richer text
            cur.execute(
                "UPDATE departments SET name=%s, duration=%s WHERE code=%s",
                (c["name"], c["duration"], c["code"]),
            )
        else:
            cur.execute(
                "INSERT INTO departments (code, name, duration) "
                "VALUES (%s, %s, %s)",
                (c["code"], c["name"], c["duration"]),
            )
            print(f"   ✅  Created department: {c['code']} — {c['name']}")

    # ── Registrants & attendance ───────────────────────────────────────────────
    dates_per_department: dict[str, list[date]] = {
        c["code"]: class_dates(10) for c in DEPARTMENTS
    }

    for (name, email, phone, matric, department_code) in STUDENTS:
        # Look up or insert registrant
        cur.execute(
            "SELECT id FROM registrants "
            "WHERE department_code = %s AND matriculation_number = %s",
            (department_code, matric),
        )
        row = cur.fetchone()
        if row:
            registrant_id: str = row["id"]
            print(f"   ⏭  {matric} already exists (id={registrant_id})")
        else:
            registrant_id = short_id()
            cur.execute(
                "INSERT INTO registrants "
                "(id, department_code, name, email, phone, matriculation_number) "
                "VALUES (%s, %s, %s, %s, %s, %s)",
                (registrant_id, department_code, name, email, phone, matric),
            )
            print(f"   ✅  Registered {name} ({matric}) → {department_code}")

        # Attendance records — skip days that already exist
        for d in dates_per_department[department_code]:
            cur.execute(
                "SELECT id FROM attendance "
                "WHERE registrant_id = %s AND date = %s",
                (registrant_id, d),
            )
            if cur.fetchone():
                continue
            present = random.random() < 0.80  # ~80 % attendance rate
            cur.execute(
                "INSERT INTO attendance (registrant_id, date, present) "
                "VALUES (%s, %s, %s)",
                (registrant_id, d, present),
            )

    conn.commit()
    cur.close()
    conn.close()

    sample_dates = class_dates(10)
    print("\n🎉  Seed complete!")
    print(f"   Departments  : {len(DEPARTMENTS)}")
    print(f"   Registrants  : {len(STUDENTS)}")
    print(f"   Class days   : {len(sample_dates)} per department")
    print(f"   Date range   : {sample_dates[0]}  →  {sample_dates[-1]}")


if __name__ == "__main__":
    run()

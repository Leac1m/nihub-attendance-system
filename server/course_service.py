from __future__ import annotations

from datetime import date
from pathlib import Path
from typing import Any
from uuid import uuid4

import qrcode
from db import get_connection


class CourseNotFoundError(Exception):
    pass


class RegistrantExistsError(Exception):
    pass


class RegistrantNotFoundError(Exception):
    pass


class AttendanceAlreadyMarkedError(Exception):
    pass


class CourseService:
    def _get_connection(self):
        return get_connection()

    def list_courses(self) -> list[dict[str, Any]]:
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT code, name, description, duration FROM courses")
                return [dict(row) for row in cur.fetchall()]

    def get_registrants(self, course_code: str) -> list[dict[str, Any]]:
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id, name, email, phone, matriculation_number, image_url FROM registrants WHERE course_code = %s",
                    (course_code,),
                )
                return [dict(row) for row in cur.fetchall()]

    def get_registrant(self, course_code: str, registrant_id: str) -> dict[str, Any]:
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id, name, email, phone, matriculation_number, image_url FROM registrants WHERE course_code = %s AND (id = %s OR matriculation_number = %s)",
                    (course_code, registrant_id, registrant_id),
                )
                row = cur.fetchone()
                if not row:
                    raise RegistrantNotFoundError("Registrant not found in this course")

                registrant = dict(row)
                cur.execute(
                    "SELECT date, present FROM attendance WHERE registrant_id = %s ORDER BY date",
                    (registrant["id"],),
                )
                registrant["attendance_days"] = [dict(r) for r in cur.fetchall()]
                return registrant

    def get_scan_context(self, course_code: str) -> dict[str, Any]:
        course = self._get_course(course_code)
        registrants = self.get_registrants(course_code)

        if not registrants:
            raise RegistrantNotFoundError("No registrants found in this course")

        return {
            "course": {
                "name": course["name"],
                "code": course["code"],
                "description": course["description"],
                "duration": course["duration"],
            },
            "attendee": registrants[0],
        }

    def register(self, course_code: str, registrant: dict[str, Any]) -> dict[str, Any]:
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                self._verify_course(cur, course_code)

                cur.execute(
                    "SELECT id FROM registrants WHERE course_code = %s AND (email = %s OR matriculation_number = %s)",
                    (course_code, registrant["email"], registrant["matriculation_number"]),
                )
                if cur.fetchone():
                    raise RegistrantExistsError("Registrant already in this course")

                new_id = f"ATT-{uuid4().hex[:8].upper()}"
                cur.execute(
                    """INSERT INTO registrants (id, course_code, name, email, phone, matriculation_number, image_url)
                       VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                    (
                        new_id,
                        course_code,
                        registrant["name"],
                        registrant["email"],
                        registrant["phone"],
                        registrant["matriculation_number"],
                        registrant.get("image_url"),
                    ),
                )
                conn.commit()

        qr_path = self._generate_qr_code(new_id)
        return {
            "id": new_id,
            **registrant,
            "qr_code_url": f"/qr_codes/{Path(qr_path).name}",
            "attendance_days": [],
        }

    def mark_attendance(
        self,
        course_code: str,
        matric_number: str,
        attendance_date: date,
        present: bool,
    ) -> list[dict[str, Any]]:
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id FROM registrants WHERE course_code = %s AND matriculation_number = %s",
                    (course_code, matric_number),
                )
                row = cur.fetchone()
                if not row:
                    raise RegistrantNotFoundError("Registrant not found in this course")

                registrant_id = row["id"]
                attendance_date_str = str(attendance_date)

                cur.execute(
                    "SELECT id FROM attendance WHERE registrant_id = %s AND date = %s",
                    (registrant_id, attendance_date_str),
                )
                if cur.fetchone():
                    raise AttendanceAlreadyMarkedError("Attendance already marked for this date")

                cur.execute(
                    "INSERT INTO attendance (registrant_id, date, present) VALUES (%s, %s, %s)",
                    (registrant_id, attendance_date_str, present),
                )
                conn.commit()

                cur.execute(
                    "SELECT date, present FROM attendance WHERE registrant_id = %s ORDER BY date",
                    (registrant_id,),
                )
                return [dict(r) for r in cur.fetchall()]

    def _verify_course(self, cur, course_code: str) -> None:
        cur.execute("SELECT code FROM courses WHERE code = %s", (course_code,))
        if not cur.fetchone():
            raise CourseNotFoundError("Course not found")

    def _get_course(self, course_code: str) -> dict[str, Any]:
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT code, name, description, duration FROM courses WHERE code = %s",
                    (course_code,),
                )
                row = cur.fetchone()
                if not row:
                    raise CourseNotFoundError("Course not found")
                return dict(row)

    def _generate_qr_code(self, registrant_id: str) -> str:
        qr_dir = Path(__file__).parent / "qr_codes"
        qr_dir.mkdir(exist_ok=True)
        qr_path = qr_dir / f"{registrant_id}.png"
        qrcode.make(registrant_id).save(str(qr_path))
        return str(qr_path)
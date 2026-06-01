from __future__ import annotations

import io
import os
from datetime import date
from typing import Any
from uuid import uuid4

import qrcode
from db import get_connection, UPLOAD_DIR


class CourseNotFoundError(Exception):
    pass


class RegistrantExistsError(Exception):
    pass


class RegistrantNotFoundError(Exception):
    pass


class AttendanceAlreadyMarkedError(Exception):
    pass


class CourseAlreadyExistsError(Exception):
    pass


class CourseService:
    def _get_connection(self):
        return get_connection()

    def create_course(self, code: str, name: str, description: str, duration: str) -> dict:
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT code FROM courses WHERE code = %s", (code,))
                if cur.fetchone():
                    raise CourseAlreadyExistsError(f"A course with code '{code}' already exists")
                cur.execute(
                    "INSERT INTO courses (code, name, description, duration) VALUES (%s, %s, %s, %s)",
                    (code, name, description, duration),
                )
                conn.commit()
        return {"code": code, "name": name, "description": description, "duration": duration}

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

        qr_bytes = self._generate_qr_bytes(new_id)
        return {
            "id": new_id,
            **registrant,
            "qr_bytes": qr_bytes,
            "attendance_days": [],
        }

    def delete_registrant(self, course_code: str, registrant_id: str) -> None:
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM registrants WHERE id = %s AND course_code = %s",
                    (registrant_id, course_code),
                )
                conn.commit()

    def mark_attendance(
        self,
        course_code: str,
        matric_number: str,
        attendance_date: date,
        present: bool,
    ) -> list[dict[str, Any]]:
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                # If matric_number looks like a registrant ID (ATT-XXXXXXXX),
                # resolve it across all courses first, then check enrollment.
                registrant_id = matric_number
                if matric_number.startswith("ATT-"):
                    cur.execute(
                        "SELECT id, course_code FROM registrants WHERE id = %s",
                        (matric_number,),
                    )
                    row = cur.fetchone()
                    if not row:
                        raise RegistrantNotFoundError("Registrant not found")
                    registrant_id = row["id"]
                    # Verify this registrant belongs to the specified course
                    if row["course_code"] != course_code:
                        raise RegistrantNotFoundError("Registrant not found in this course")
                else:
                    # Legacy: look up by matriculation_number within this course
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

    def mark_attendance_by_id(
        self,
        course_code: str,
        registrant_id: str,
        attendance_date: date,
        present: bool,
    ) -> list[dict[str, Any]]:
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                # Verify registrant belongs to this course
                cur.execute(
                    "SELECT id FROM registrants WHERE id = %s AND course_code = %s",
                    (registrant_id, course_code),
                )
                row = cur.fetchone()
                if not row:
                    raise RegistrantNotFoundError("Registrant not found in this course")

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

    def delete_course(self, course_code: str) -> None:
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                self._verify_course(cur, course_code)
                # Fetch and delete registrant image files
                cur.execute("SELECT image_url FROM registrants WHERE course_code = %s", (course_code,))
                for (image_url,) in cur.fetchall():
                    if image_url:
                        file_path = UPLOAD_DIR / os.path.basename(image_url)
                        if file_path.exists():
                            file_path.unlink()
                # Cascade delete in DB (courses -> registrants -> attendance)
                cur.execute("DELETE FROM courses WHERE code = %s", (course_code,))
                conn.commit()

    def _generate_qr_bytes(self, registrant_id: str) -> bytes:
        """Generate a QR code image in memory and return the PNG bytes."""
        buf = io.BytesIO()
        qrcode.make(registrant_id).save(buf, format="PNG")
        return buf.getvalue()

    def get_attendance_spreadsheet(self, course_code: str) -> list[dict[str, Any]]:
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                self._verify_course(cur, course_code)

                cur.execute(
                    """SELECT r.id, r.name, r.email, r.phone, r.matriculation_number,
                              a.date, a.present
                       FROM registrants r
                       LEFT JOIN attendance a ON a.registrant_id = r.id
                       WHERE r.course_code = %s
                       ORDER BY r.name, a.date""",
                    (course_code,),
                )
                rows = cur.fetchall()

        grouped: dict[str, dict[str, Any]] = {}
        date_set: set[str] = set()

        for row in rows:
            rid = row["id"]
            if rid not in grouped:
                grouped[rid] = {
                    "id": rid,
                    "name": row["name"],
                    "email": row["email"],
                    "phone": row["phone"],
                    "matriculation_number": row["matriculation_number"],
                }
            if row["date"] is not None:
                date_set.add(str(row["date"]))
                grouped[rid][str(row["date"])] = bool(row["present"])

        all_dates = sorted(date_set)
        return [
            {
                **grouped[rid],
                **{d: grouped[rid].get(d) for d in all_dates},
            }
            for rid in sorted(grouped)
        ]
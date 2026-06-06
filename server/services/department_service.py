from __future__ import annotations

import io
import os
from datetime import date
from typing import Any
from uuid import uuid4

import qrcode

from db import UPLOAD_DIR, get_connection


class DepartmentNotFoundError(Exception):
    pass


class RegistrantExistsError(Exception):
    pass


class RegistrantNotFoundError(Exception):
    pass


class DepartmentAlreadyExistsError(Exception):
    pass


class DepartmentService:
    def _get_connection(self):
        return get_connection()

    def create_department(self, code: str, name: str, duration: str) -> dict:
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT code FROM departments WHERE code = %s", (code,))
                if cur.fetchone():
                    raise DepartmentAlreadyExistsError(
                        f"A department with code '{code}' already exists",
                    )
                cur.execute(
                    "INSERT INTO departments (code, name, duration) VALUES (%s, %s, %s)",
                    (code, name, duration),
                )
                conn.commit()
        return {"code": code, "name": name, "duration": duration}

    def list_departments(self) -> list[dict[str, Any]]:
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT code, name, duration FROM departments")
                return [dict(row) for row in cur.fetchall()]

    def get_registrants(self, department_code: str) -> list[dict[str, Any]]:
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id, name, email, phone, matriculation_number, image_url "
                    "FROM registrants WHERE department_code = %s",
                    (department_code,),
                )
                return [dict(row) for row in cur.fetchall()]

    def get_registrant(self, department_code: str, registrant_id: str) -> dict[str, Any]:
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT id, name, email, phone, matriculation_number, image_url "
                    "FROM registrants "
                    "WHERE department_code = %s AND (id = %s OR matriculation_number = %s)",
                    (department_code, registrant_id, registrant_id),
                )
                row = cur.fetchone()
                if not row:
                    raise RegistrantNotFoundError("Registrant not found in this department")

                registrant = dict(row)
                cur.execute(
                    "SELECT date, present FROM attendance WHERE registrant_id = %s ORDER BY date",
                    (registrant["id"],),
                )
                registrant["attendance_days"] = [dict(r) for r in cur.fetchall()]
                return registrant

    def register(self, department_code: str, registrant: dict[str, Any]) -> dict[str, Any]:
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                self._verify_department(cur, department_code)

                cur.execute(
                    "SELECT id FROM registrants "
                    "WHERE department_code = %s AND (email = %s OR matriculation_number = %s)",
                    (department_code, registrant["email"], registrant["matriculation_number"]),
                )
                if cur.fetchone():
                    raise RegistrantExistsError("Registrant already in this department")

                new_id = f"ATT-{uuid4().hex[:8].upper()}"
                cur.execute(
                    """INSERT INTO registrants
                       (id, department_code, name, email, phone, matriculation_number, image_url)
                       VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                    (
                        new_id,
                        department_code,
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

    def delete_registrant(self, department_code: str, registrant_id: str) -> None:
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "DELETE FROM registrants WHERE id = %s AND department_code = %s",
                    (registrant_id, department_code),
                )
                conn.commit()



    def _verify_department(self, cur, department_code: str) -> None:
        cur.execute("SELECT code FROM departments WHERE code = %s", (department_code,))
        if not cur.fetchone():
            raise DepartmentNotFoundError("Department not found")

    def _get_department(self, department_code: str) -> dict[str, Any]:
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT code, name, duration FROM departments WHERE code = %s",
                    (department_code,),
                )
                row = cur.fetchone()
                if not row:
                    raise DepartmentNotFoundError("Department not found")
                return dict(row)

    def delete_department(self, department_code: str) -> None:
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                self._verify_department(cur, department_code)
                # Fetch and delete registrant image files
                cur.execute(
                    "SELECT image_url FROM registrants WHERE department_code = %s",
                    (department_code,),
                )
                for (image_url,) in cur.fetchall():
                    if image_url:
                        file_path = UPLOAD_DIR / os.path.basename(image_url)
                        if file_path.exists():
                            file_path.unlink()
                # Cascade delete in DB (departments -> registrants -> attendance)
                cur.execute("DELETE FROM departments WHERE code = %s", (department_code,))
                conn.commit()

    def _generate_qr_bytes(self, registrant_id: str) -> bytes:
        """Generate a QR code image in memory and return the PNG bytes."""
        buf = io.BytesIO()
        qrcode.make(registrant_id).save(buf, format="PNG")
        return buf.getvalue()




service = DepartmentService()

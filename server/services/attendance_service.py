from __future__ import annotations

from datetime import date, datetime
from typing import Any

from db import get_connection


class AlreadyCheckedInError(Exception):
    pass


class AlreadyCheckedOutError(Exception):
    pass


class DepartmentNotFoundError(Exception):
    pass


class RegistrantNotFoundError(Exception):
    pass


class AttendanceService:
    def _get_connection(self):
        return get_connection()

    def _verify_department(self, cur, department_code: str) -> None:
        cur.execute("SELECT code FROM departments WHERE code = %s", (department_code,))
        if not cur.fetchone():
            raise DepartmentNotFoundError("Department not found")

    def _verify_registrant_in_department(
        self, cur, department_code: str, registrant_id: str
    ) -> dict[str, Any]:
        cur.execute(
            "SELECT id, department_code FROM registrants WHERE id = %s",
            (registrant_id,),
        )
        row = cur.fetchone()
        if not row:
            raise RegistrantNotFoundError("Registrant not found")
        if row["department_code"] != department_code:
            raise RegistrantNotFoundError("Registrant not found in this department")
        return dict(row)

    def _get_or_create_attendance_row(
        self, cur, conn, registrant_id: str, attendance_date: date
    ) -> None:
        date_str = str(attendance_date)
        cur.execute(
            "SELECT id FROM attendance WHERE registrant_id = %s AND date = %s",
            (registrant_id, date_str),
        )
        if not cur.fetchone():
            cur.execute(
                "INSERT INTO attendance (registrant_id, date, derived_status) "
                "VALUES (%s, %s, 'partial')",
                (registrant_id, date_str),
            )
            conn.commit()

    def _update_derived_status(
        self, cur, conn, registrant_id: str, attendance_date: date
    ) -> None:
        date_str = str(attendance_date)
        cur.execute(
            """
            SELECT session_type, occurred_at
            FROM attendance_sessions
            WHERE registrant_id = %s
 AND DATE(occurred_at) = %s
            ORDER BY occurred_at ASC
            """,
            (registrant_id, date_str),
        )
        sessions = cur.fetchall()

        if not sessions:
            derived_status = "absent"
            first_in_at = None
            last_out_at = None
        else:
            first_in_at = sessions[0]["occurred_at"]
            last_out_at = sessions[-1]["occurred_at"]

            session_types = [s["session_type"] for s in sessions]
            if session_types[-1] == "out":
                derived_status = "present"
            else:
                derived_status = "partial"

        cur.execute(
            """
            UPDATE attendance
            SET derived_status = %s,
                first_in_at = COALESCE(first_in_at, %s),
                last_out_at = %s
            WHERE registrant_id = %s AND date = %s
            """,
            (derived_status, first_in_at, last_out_at, registrant_id, date_str),
        )
        conn.commit()

    def check_in(
        self,
        department_code: str,
        registrant_id: str,
        occurred_at: datetime | None = None,
        staff_id: int | None = None,
    ) -> dict[str, Any]:
        occurred_at = occurred_at or datetime.utcnow()
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                self._verify_registrant_in_department(cur, department_code, registrant_id)

                today = date.today()
                cur.execute(
                    """
                    SELECT session_type, occurred_at
                    FROM attendance_sessions
                    WHERE registrant_id = %s
                      AND DATE(occurred_at) = %s
                    ORDER BY occurred_at DESC
                    LIMIT 1
                    """,
                    (registrant_id, str(today)),
                )
                last = cur.fetchone()
                if last and last["session_type"] == "in":
                    raise AlreadyCheckedInError("Already checked in")

                cur.execute(
                    """
                    INSERT INTO attendance_sessions
 (registrant_id, session_type, occurred_at, staff_id)
                    VALUES (%s, 'in', %s, %s)
                    RETURNING id, registrant_id, session_type, occurred_at
                    """,
                    (registrant_id, occurred_at, staff_id),
                )
                row = dict(cur.fetchone())
                conn.commit()

                self._get_or_create_attendance_row(
                    cur, conn, registrant_id, today
                )
                self._update_derived_status(cur, conn, registrant_id, today)

                return {
                    "session_id": row["id"],
                    "registrant_id": row["registrant_id"],
                    "session_type": row["session_type"],
                    "occurred_at": row["occurred_at"].isoformat(),
                }

    def check_out(
        self,
        department_code: str,
        registrant_id: str,
        occurred_at: datetime | None = None,
        staff_id: int | None = None,
    ) -> dict[str, Any]:
        occurred_at = occurred_at or datetime.utcnow()
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                self._verify_registrant_in_department(cur, department_code, registrant_id)

                today = date.today()
                cur.execute(
                    """
                    SELECT session_type, occurred_at
                    FROM attendance_sessions
                    WHERE registrant_id = %s
                      AND DATE(occurred_at) = %s
                    ORDER BY occurred_at DESC
                    LIMIT 1
                    """,
                    (registrant_id, str(today)),
                )
                last = cur.fetchone()
                if last and last["session_type"] == "out":
                    raise AlreadyCheckedOutError("Already checked out")

                cur.execute(
                    """
                    INSERT INTO attendance_sessions
                        (registrant_id, session_type, occurred_at, staff_id)
                    VALUES (%s, 'out', %s, %s)
                    RETURNING id, registrant_id, session_type, occurred_at
                    """,
                    (registrant_id, occurred_at, staff_id),
                )
                row = dict(cur.fetchone())
                conn.commit()

                self._get_or_create_attendance_row(
                    cur, conn, registrant_id, today
                )
                self._update_derived_status(cur, conn, registrant_id, today)

                return {
                    "session_id": row["id"],
                    "registrant_id": row["registrant_id"],
                    "session_type": row["session_type"],
                    "occurred_at": row["occurred_at"].isoformat(),
                }

    def get_sessions_for_date(
        self, department_code: str, attendance_date: date
    ) -> list[dict[str, Any]]:
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                self._verify_department(cur, department_code)

                cur.execute(
                    """
                    SELECT
                        s.registrant_id,
                        r.name,
                        s.session_type,
                        s.occurred_at,
                        s.staff_id
                    FROM attendance_sessions s
                    JOIN registrants r ON r.id = s.registrant_id
                    WHERE r.department_code = %s
                      AND DATE(s.occurred_at) = %s
                    ORDER BY s.occurred_at ASC
                    """,
                    (department_code, str(attendance_date)),
                )
                return [
                    {
                        "registrant_id": row["registrant_id"],
                        "name": row["name"],
                        "session_type": row["session_type"],
                        "occurred_at": row["occurred_at"].isoformat(),
                        "staff_id": row["staff_id"],
                    }
                    for row in cur.fetchall()
                ]

    def get_registrant_status_today(
        self, department_code: str, registrant_id: str
    ) -> str:
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                self._verify_registrant_in_department(cur, department_code, registrant_id)

                today = date.today()
                cur.execute(
                    """
                    SELECT session_type
                    FROM attendance_sessions
                    WHERE registrant_id = %s
                      AND DATE(occurred_at) = %s
                    ORDER BY occurred_at DESC
                    LIMIT 1
                    """,
                    (registrant_id, str(today)),
                )
                last = cur.fetchone()
                if not last:
                    return "not_checked_in"
                return "checked_in" if last["session_type"] == "in" else "checked_out"

    def set_manual_status(
        self, department_code: str, registrant_id: str, date_str: str, status_int: int
    ) -> None:
        status_map = {0: "absent", 1: "partial", 2: "present"}
        derived_status = status_map[status_int]
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                self._verify_department(cur, department_code)
                self._verify_registrant_in_department(cur, registrant_id, department_code)
                cur.execute(
                    """INSERT INTO attendance (registrant_id, date, derived_status)
                       VALUES (%s, %s, %s)
                       ON CONFLICT (registrant_id, date)
                       DO UPDATE SET derived_status = %s""",
                    (registrant_id, date_str, derived_status, derived_status),
                )
                conn.commit()

    def get_attendance_spreadsheet(
        self, department_code: str
    ) -> list[dict[str, Any]]:
        with self._get_connection() as conn:
            with conn.cursor() as cur:
                self._verify_department(cur, department_code)

                cur.execute(
                    """
                    SELECT
                        r.id,
                        r.name,
                        r.email,
                        r.phone,
                        r.matriculation_number,
                        a.date,
                        a.first_in_at,
                        a.last_out_at,
                        a.derived_status
                    FROM registrants r
                    LEFT JOIN attendance a ON a.registrant_id = r.id
                    WHERE r.department_code = %s
                    ORDER BY r.name, a.date
                    """,
                    (department_code,),
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
                status = row["derived_status"]
                if status == "present":
                    grouped[rid][str(row["date"])] = 1
                elif status == "absent":
                    grouped[rid][str(row["date"])] = 0
                else:
                    grouped[rid][str(row["date"])] = "P"

        all_dates = sorted(date_set)
        return [
            {**grouped[rid], **{d: grouped[rid].get(d) for d in all_dates}}
            for rid in sorted(grouped)
        ]


service = AttendanceService()

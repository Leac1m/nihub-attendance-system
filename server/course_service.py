from __future__ import annotations

from datetime import date
from pathlib import Path
from typing import Any
from uuid import uuid4

import qrcode
from db import load_data, save_data


class CourseNotFoundError(Exception):
    pass


class RegistrantExistsError(Exception):
    pass


class RegistrantNotFoundError(Exception):
    pass


class AttendanceAlreadyMarkedError(Exception):
    pass


class CourseService:
    def load_data(self) -> dict[str, Any]:
        return load_data()

    def save_data(self, data: dict[str, Any]) -> None:
        save_data(data)

    def list_courses(self) -> list[dict[str, Any]]:
        courses = self.load_data()["courses"]
        normalized: list[dict[str, Any]] = []

        for course in courses:
            normalized.append(
                {
                    "name": course.get("name") or course.get("course_name") or "",
                    "code": course.get("code") or course.get("course_code") or "",
                    "description": course.get("description", ""),
                    "duration": course.get("duration", ""),
                    "registrants": course.get("registrants", []),
                }
            )

        return normalized

    def get_registrants(self, course_code: str) -> list[dict[str, Any]]:
        data = self.load_data()
        course = self._find_course(data, course_code)
        return [self._normalize_registrant(registrant) for registrant in course.get("registrants", [])]

    def get_registrant(self, course_code: str, registrant_id: str) -> dict[str, Any]:
        data = self.load_data()
        course = self._find_course(data, course_code)
        course.setdefault("registrants", [])

        registrant = next(
            (
                self._normalize_registrant(item)
                for item in course["registrants"]
                if self._normalize_registrant(item).get("id") == registrant_id
                or self._normalize_registrant(item).get("matriculation_number") == registrant_id
            ),
            None,
        )
        if not registrant:
            raise RegistrantNotFoundError("Registrant not found in this course")

        return registrant

    def get_scan_context(self, course_code: str) -> dict[str, Any]:
        data = self.load_data()
        course = self._find_course(data, course_code)
        registrants = [self._normalize_registrant(item) for item in course.get("registrants", [])]

        if not registrants:
            raise RegistrantNotFoundError("No registrants found in this course")

        return {
            "course": {
                "name": course.get("name") or course.get("course_name") or "",
                "code": course.get("code") or course.get("course_code") or "",
                "description": course.get("description", ""),
                "duration": course.get("duration", ""),
            },
            "attendee": registrants[0],
        }

    def register(self, course_code: str, registrant: dict[str, Any]) -> dict[str, Any]:
        data = self.load_data()
        course = self._find_course(data, course_code)
        course.setdefault("registrants", [])

        exists = next(
            (
                r for r in course["registrants"]
                if r["email"] == registrant["email"]
                or r["matriculation_number"] == registrant["matriculation_number"]
            ),
            None,
        )
        if exists:
            raise RegistrantExistsError("Registrant already in this course")

        new_registrant = {
            "id": f"ATT-{uuid4().hex[:8].upper()}",
            **registrant,
            "attendance_days": [],
        }
        course["registrants"].append(new_registrant)
        self.save_data(data)

        qr_path = self._generate_qr_code(new_registrant["id"])
        new_registrant["qr_code_url"] = f"/qr_codes/{Path(qr_path).name}"

        return new_registrant

    def mark_attendance(
        self,
        course_code: str,
        matric_number: str,
        attendance_date: date,
        present: bool,
    ) -> list[dict[str, Any]]:
        data = self.load_data()
        course = self._find_course(data, course_code)
        course.setdefault("registrants", [])

        registrant = next(
            (r for r in course["registrants"] if r["matriculation_number"] == matric_number),
            None,
        )
        if not registrant:
            raise RegistrantNotFoundError("Registrant not found in this course")

        registrant.setdefault("attendance_days", [])
        attendance_date_str = str(attendance_date)

        duplicate = next(
            (d for d in registrant["attendance_days"] if d["date"] == attendance_date_str),
            None,
        )
        if duplicate:
            raise AttendanceAlreadyMarkedError("Attendance already marked for this date")

        registrant["attendance_days"].append(
            {"date": attendance_date_str, "present": present}
        )
        self.save_data(data)
        return registrant["attendance_days"]

    def _find_course(self, data: dict[str, Any], course_code: str) -> dict[str, Any]:
        course = next(
            (
                c
                for c in data["courses"]
                if c.get("code") == course_code or c.get("course_code") == course_code
            ),
            None,
        )
        if not course:
            raise CourseNotFoundError("Course not found")
        return course

    def _generate_qr_code(self, registrant_id: str) -> str:
        qr_dir = Path(__file__).parent / "qr_codes"
        qr_dir.mkdir(exist_ok=True)
        qr_path = qr_dir / f"{registrant_id}.png"
        qrcode.make(registrant_id).save(str(qr_path))
        return str(qr_path)

    def _normalize_registrant(self, registrant: dict[str, Any]) -> dict[str, Any]:
        normalized = dict(registrant)
        matriculation_number = normalized.get("matriculation_number")
        if not normalized.get("id"):
            if matriculation_number:
                normalized["id"] = f"ATT-{matriculation_number}"
            else:
                normalized["id"] = f"ATT-{uuid4().hex[:8].upper()}"
        return normalized
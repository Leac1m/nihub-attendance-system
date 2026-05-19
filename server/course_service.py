from __future__ import annotations

from datetime import date
from typing import Any

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
        return self.load_data()["courses"]

    def get_registrants(self, course_code: str) -> list[dict[str, Any]]:
        data = self.load_data()
        course = self._find_course(data, course_code)
        return course.get("registrants", [])

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

        new_registrant = {**registrant, "attendance_days": []}
        course["registrants"].append(new_registrant)
        self.save_data(data)
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
            (c for c in data["courses"] if c.get("course_code") == course_code),
            None,
        )
        if not course:
            raise CourseNotFoundError("Course not found")
        return course
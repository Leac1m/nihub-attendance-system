# TODO(phase 2): rename to /departments
# The current paths use ``/courses`` for backward compatibility.  A later
# phase will introduce the new ``/departments`` path alongside the old
# one and then deprecate it.

"""Department/course management endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from dependencies import get_current_staff
from models import CourseCreate
from services.course_service import (
    CourseAlreadyExistsError,
    CourseNotFoundError,
    RegistrantNotFoundError,
    service,
)
from services.staff_auth import StaffPublic

router = APIRouter(tags=["departments"])


@router.post("/courses", status_code=201)
async def create_course(
    payload: CourseCreate,
    staff: StaffPublic = Depends(get_current_staff),
):
    try:
        course = service.create_course(
            code=payload.code.strip().upper(),
            name=payload.name.strip(),
            description=payload.description.strip(),
            duration=payload.duration.strip(),
        )
        return {"message": "Department created", "course": course}
    except CourseAlreadyExistsError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/courses")
async def get_courses():
    courses = service.list_courses()
    return {
        "courses": [
            {
                "name": course.get("name") or course.get("course_name") or "",
                "code": course.get("code") or course.get("course_code") or "",
                "description": course.get("description", ""),
                "duration": course.get("duration", ""),
            }
            for course in courses
        ]
    }


@router.get("/courses/{course_code}/registrants")
async def get_course_registrants(
    course_code: str,
    staff: StaffPublic = Depends(get_current_staff),
):
    try:
        return {
            "code": course_code,
            "registrants": service.get_registrants(course_code),
        }
    except CourseNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get("/courses/{course_code}/registrants/{registrant_id}")
async def get_course_registrant(
    course_code: str,
    registrant_id: str,
    staff: StaffPublic = Depends(get_current_staff),
):
    try:
        return {
            "code": course_code,
            "registrant": service.get_registrant(course_code, registrant_id),
        }
    except CourseNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except RegistrantNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete("/courses/{course_code}", status_code=200)
async def delete_course(
    course_code: str,
    staff: StaffPublic = Depends(get_current_staff),
):
    try:
        service.delete_course(course_code)
        return {"message": "Department deleted"}
    except CourseNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

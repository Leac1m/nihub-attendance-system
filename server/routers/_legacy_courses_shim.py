"""Backward-compatibility shim that 301-redirects ``/courses/*`` → ``/departments/*``.

Phase 2 renames the resource from "course" to "department" throughout
the API, but old mobile / web clients may still call the old paths.
This router registers 301 permanent redirects so the old paths keep
working for one release.

The shim must be included *after* the real ``/departments/*`` router
in :mod:`main` so the live endpoints match first; anything left over
falls through to the redirect.
"""

from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import RedirectResponse

router = APIRouter(tags=["legacy-courses-shim"])


def _redirect(target: str) -> RedirectResponse:
    return RedirectResponse(url=target, status_code=301)


# GET /courses → GET /departments
@router.get("/courses", include_in_schema=False)
async def legacy_list_courses() -> RedirectResponse:
    return _redirect("/departments")


# GET /courses/{code}/registrants → GET /departments/{code}/registrants
@router.get("/courses/{code}/registrants", include_in_schema=False)
async def legacy_get_registrants(code: str) -> RedirectResponse:
    return _redirect(f"/departments/{code}/registrants")


# POST /courses/{code}/register → POST /departments/{code}/register
@router.post("/courses/{code}/register", include_in_schema=False)
async def legacy_register(code: str) -> RedirectResponse:
    return _redirect(f"/departments/{code}/register")


# GET /courses/{code}/registrants/{id} → GET /departments/{code}/registrants/{id}
@router.get("/courses/{code}/registrants/{registrant_id}", include_in_schema=False)
async def legacy_get_registrant(code: str, registrant_id: str) -> RedirectResponse:
    return _redirect(f"/departments/{code}/registrants/{registrant_id}")


# POST /courses → POST /departments
@router.post("/courses", include_in_schema=False)
async def legacy_create_course() -> RedirectResponse:
    return _redirect("/departments")


# POST /courses/{code}/attendance → POST /departments/{code}/attendance
@router.post("/courses/{code}/attendance", include_in_schema=False)
async def legacy_mark_attendance_by_id(code: str) -> RedirectResponse:
    return _redirect(f"/departments/{code}/attendance")


# POST /courses/{code}/attendance/{matric} → POST /departments/{code}/attendance/{matric}
@router.post("/courses/{code}/attendance/{matric_number}", include_in_schema=False)
async def legacy_mark_attendance(code: str, matric_number: str) -> RedirectResponse:
    return _redirect(f"/departments/{code}/attendance/{matric_number}")


# GET /courses/{code}/attendance/spreadsheet → GET /departments/{code}/attendance/spreadsheet
@router.get("/courses/{code}/attendance/spreadsheet", include_in_schema=False)
async def legacy_spreadsheet(code: str) -> RedirectResponse:
    return _redirect(f"/departments/{code}/attendance/spreadsheet")


# DELETE /courses/{code} → DELETE /departments/{code}
@router.delete("/courses/{code}", include_in_schema=False)
async def legacy_delete_course(code: str) -> RedirectResponse:
    return _redirect(f"/departments/{code}")

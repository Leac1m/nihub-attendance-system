# TODO(phase 7+): add is_active, owner_id, etc. as the system grows
"""Department management endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from dependencies import get_current_staff
from models import DepartmentCreate
from services.department_service import (
    DepartmentAlreadyExistsError,
    DepartmentNotFoundError,
    RegistrantNotFoundError,
    service,
)
from services.staff_auth import StaffPublic

router = APIRouter(tags=["departments"])


@router.post("/departments", status_code=201)
async def create_department(
    payload: DepartmentCreate,
    staff: StaffPublic = Depends(get_current_staff),
):
    try:
        department = service.create_department(
            code=payload.code.strip().upper(),
            name=payload.name.strip(),
            duration=payload.duration.strip(),
        )
        return {"message": "Department created", "department": department}
    except DepartmentAlreadyExistsError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("/departments")
async def get_departments():
    departments = service.list_departments()
    return {
        "departments": [
            {
                "name": dept.get("name", ""),
                "code": dept.get("code", ""),
                "duration": dept.get("duration", ""),
            }
            for dept in departments
        ]
    }


@router.get("/departments/{department_code}/registrants")
async def get_department_registrants(
    department_code: str,
    staff: StaffPublic = Depends(get_current_staff),
):
    try:
        return {
            "code": department_code,
            "registrants": service.get_registrants(department_code),
        }
    except DepartmentNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.get("/departments/{department_code}/registrants/{registrant_id}")
async def get_department_registrant(
    department_code: str,
    registrant_id: str,
    staff: StaffPublic = Depends(get_current_staff),
):
    try:
        return {
            "code": department_code,
            "registrant": service.get_registrant(department_code, registrant_id),
        }
    except DepartmentNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except RegistrantNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.delete("/departments/{department_code}", status_code=200)
async def delete_department(
    department_code: str,
    staff: StaffPublic = Depends(get_current_staff),
):
    try:
        service.delete_department(department_code)
        return {"message": "Department deleted"}
    except DepartmentNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))

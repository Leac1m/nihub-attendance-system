"""Administrative endpoints.

Phase 4 will fill this router in.  For now it is intentionally empty so
that the import graph and middleware wiring are exercised — but it now
imports :func:`get_current_admin` so any future endpoint that uses it
as a dependency will get the real ``is_admin`` DB check rather than
the old staff-only stub.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from dependencies import get_current_admin
from services.department_service import (
    DepartmentNotFoundError,
    RegistrantNotFoundError,
    RegistrantExistsError,
    service as department_service,
)
from services.attendance_service import service as attendance_service
from services.staff_auth import StaffPublic

router = APIRouter(prefix="/admin", tags=["admin"])

get_current_admin = get_current_admin


class RegistrantUpdateRequest(BaseModel):
    name: str
    email: str
    phone: str


class RegistrantCreateRequest(BaseModel):
    name: str
    email: str
    phone: str
    matriculation_number: str


class ManualAttendanceRequest(BaseModel):
    date: str
    status: int


@router.put("/departments/{department_code}/registrants/{registrant_id}")
async def admin_update_registrant(
    department_code: str,
    registrant_id: str,
    payload: RegistrantUpdateRequest,
    admin: StaffPublic = Depends(get_current_admin),
):
    try:
        updated = department_service.update_registrant(
            department_code, registrant_id, payload.model_dump()
        )
        return {"registrant": updated}
    except RegistrantNotFoundError:
        raise HTTPException(404, "Registrant not found")


@router.delete("/departments/{department_code}/registrants/{registrant_id}")
async def admin_delete_registrant(
    department_code: str,
    registrant_id: str,
    admin: StaffPublic = Depends(get_current_admin),
):
    department_service.soft_delete_registrant(department_code, registrant_id)
    return {"message": "Registrant deleted"}


@router.post("/departments/{department_code}/registrants")
async def admin_create_registrant(
    department_code: str,
    payload: RegistrantCreateRequest,
    admin: StaffPublic = Depends(get_current_admin),
):
    try:
        created = department_service.create_registrant_by_admin(
            department_code, payload.model_dump()
        )
        return {"registrant": created}
    except RegistrantExistsError:
        raise HTTPException(
            400,
            "A registrant with this matriculation number or email already exists in this department",
        )
    except DepartmentNotFoundError:
        raise HTTPException(404, "Department not found")


@router.put("/departments/{department_code}/registrants/{registrant_id}/attendance")
async def admin_set_attendance(
    department_code: str,
    registrant_id: str,
    payload: ManualAttendanceRequest,
    admin: StaffPublic = Depends(get_current_admin),
):
    if payload.status not in (0, 1, 2):
        raise HTTPException(400, "status must be 0, 1, or 2")
    attendance_service.set_manual_status(
        department_code, registrant_id, payload.date, payload.status
    )
    return {"message": "Attendance updated"}


@router.post("/departments/{department_code}/registrants/{registrant_id}/resend-qr")
async def admin_resend_qr(
    department_code: str,
    registrant_id: str,
    admin: StaffPublic = Depends(get_current_admin),
):
    try:
        registrant = department_service.get_registrant(department_code, registrant_id)
        department = department_service._get_department(department_code)
        qr_bytes = department_service.generate_qr_bytes(registrant["id"])
        from services.email_service import email_service
        email_service.send_registration_email(registrant, qr_bytes, department=department)
        return {"sent": True}
    except Exception:
        return {"sent": False, "reason": "email service not configured or failed"}


@router.get("/departments/{department_code}/registrants/{registrant_id}/qr.png")
async def admin_download_qr(
    department_code: str,
    registrant_id: str,
    admin: StaffPublic = Depends(get_current_admin),
):
    from fastapi.responses import Response
    registrant = department_service.get_registrant(department_code, registrant_id)
    qr_bytes = department_service.generate_qr_bytes(registrant["id"])
    return Response(content=qr_bytes, media_type="image/png")


@router.get("/whoami", response_model=StaffPublic)
async def admin_whoami(admin: StaffPublic = Depends(get_current_admin)) -> StaffPublic:
    return admin
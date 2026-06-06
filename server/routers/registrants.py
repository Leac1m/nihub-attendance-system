"""Registrant endpoints (public registration flow)."""

from __future__ import annotations

import logging
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from db import UPLOAD_DIR
from services.course_service import (
    CourseNotFoundError,
    RegistrantExistsError,
    service,
)
from services.email_service import email_service

logger = logging.getLogger("nihub.registrants")

router = APIRouter(tags=["registrants"])


@router.post("/courses/{course_code}/register")
async def register_for_course(
    course_code: str,
    name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    matriculation_number: str = Form(...),
    image: UploadFile | None = File(None),
):
    try:
        image_filename = None

        if image:
            file_extension = Path(image.filename).suffix if image.filename else ".jpg"
            image_filename = f"{uuid4().hex}{file_extension}"

            file_path = UPLOAD_DIR / image_filename
            content = await image.read()
            with open(file_path, "wb") as f:
                f.write(content)

        registrant_data = {
            "name": name,
            "email": email,
            "phone": phone,
            "matriculation_number": matriculation_number,
            "image_url": f"/uploads/{image_filename}" if image_filename else None,
        }

        created = service.register(course_code, registrant_data)

        # Fetch course info to include in registration email
        try:
            course_info = service._get_course(course_code)
        except CourseNotFoundError:
            course_info = None

        # Send registration email with QR code - rollback on failure
        try:
            email_service.send_registration_email(created, created.get("qr_bytes", b""), course=course_info)
        except Exception as exc:
            logger.warning(
                "Failed to send registration email to %s: %s",
                created.get("email"),
                exc,
            )
            # Rollback: delete the registrant and image
            service.delete_registrant(course_code, created["id"])
            if image_filename:
                file_path = UPLOAD_DIR / image_filename
                if file_path.exists():
                    file_path.unlink()
            raise HTTPException(status_code=500, detail="Registration failed: could not send confirmation email")

        return {"message": "Registration saved"}
    except CourseNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except RegistrantExistsError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

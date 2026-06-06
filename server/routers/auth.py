"""Authentication endpoints: login, register, verify-account."""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm

from models import (
    LoginResponse,
    StaffRegisterRequest,
    StaffRegisterResponse,
    StaffVerifyRequest,
)
from services.email_service import email_service
from services.staff_auth import (
    InvalidCredentialsError,
    InvalidVerificationCodeError,
    StaffAlreadyExistsError,
    StaffNotFoundError,
    StaffNotVerifiedError,
    VerificationCodeExpiredError,
    auth_service,
)

logger = logging.getLogger("nihub.auth")

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()) -> LoginResponse:
    try:
        staff = auth_service.authenticate(form_data.username, form_data.password)
        token = auth_service.create_access_token(subject=staff["username"])
        return {"access_token": token, "token_type": "bearer"}
    except (StaffNotFoundError, InvalidCredentialsError):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    except StaffNotVerifiedError:
        raise HTTPException(status_code=403, detail="Account not verified yet")


@router.post("/register", response_model=StaffRegisterResponse, status_code=201)
async def register_staff(payload: StaffRegisterRequest) -> StaffRegisterResponse:
    verification_pin = auth_service.generate_verification_pin()
    verification_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)

    try:
        staff = auth_service.create_staff(
            username=payload.username,
            email=payload.email,
            password=payload.password,
            verification_pin=verification_pin,
            verification_pin_expires_at=verification_expires_at,
        )

        try:
            email_service.send_staff_verification_email(
                username=staff["username"],
                email=staff["email"],
                verification_pin=verification_pin,
                expires_at=verification_expires_at.isoformat(),
            )
        except Exception as exc:
            logger.warning(
                "Failed to send staff verification email to admin for %s: %s",
                staff.get("email"),
                exc,
            )

        return {
            "message": "Staff account created. Share the PIN with the admin for verification.",
            "username": staff["username"],
            "email": staff["email"],
            "verification_expires_at": verification_expires_at,
        }
    except StaffAlreadyExistsError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/verify-account", response_model=LoginResponse)
async def verify_staff_account(payload: StaffVerifyRequest) -> LoginResponse:
    try:
        staff = auth_service.verify_staff_account(payload.username, payload.pin)
        token = auth_service.create_access_token(subject=staff["username"])
        return {"access_token": token, "token_type": "bearer"}
    except StaffNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except VerificationCodeExpiredError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except InvalidVerificationCodeError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

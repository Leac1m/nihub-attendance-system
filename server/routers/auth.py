"""Authentication endpoints: login, register, verify-account, refresh, logout,
and the registrant self-service auth flow.

The staff flow (login / register / verify-account) is unchanged in
behaviour — we just attach a refresh token to the login response and
add the new ``/auth/refresh`` and ``/auth/logout`` endpoints.

The registrant flow (``/auth/registrants/*``) is new in Phase 2:
``register`` sets a password and emails a 24h verification link,
``verify`` consumes the link and returns tokens, ``login`` issues
tokens to an already-verified account.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi.security import OAuth2PasswordRequestForm

from models import (
    LoginResponse,
    LogoutRequest,
    RefreshRequest,
    RegistrantLoginRequest,
    RegistrantRegisterRequest,
    RegistrantVerifyRequest,
    StaffRegisterRequest,
    StaffRegisterResponse,
    StaffVerifyRequest,
)
from services.email_service import email_service
from services.registrant_auth import (
    AlreadyRegisteredError,
    EmailNotVerifiedError,
    InvalidCredentialsError as RegistrantInvalidCredentialsError,
    RegistrantNotFoundError as RegistrantAuthNotFoundError,
    auth_service as registrant_auth_service,
)
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


def _web_base_url() -> str:
    """Base URL used in email links (verification / welcome)."""
    return os.getenv("WEB_BASE_URL", "http://localhost:8080").rstrip("/")


def _login_response(
    access_token: str, refresh_token: str, refresh_expires_at: datetime,
) -> dict:
    """Build a uniform login-shaped response body.

    The token's expiry in seconds (``expires_in``) is computed from
    the configured ``access_token_minutes`` on the staff service
    (registrant and staff share the same 60-minute default).
    """
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in": auth_service.access_token_minutes * 60,
        "refresh_expires_at": refresh_expires_at,
    }


# ── Staff flow ───────────────────────────────────────────────────────────────


@router.post("/login", response_model=LoginResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()) -> LoginResponse:
    try:
        staff = auth_service.authenticate(form_data.username, form_data.password)
        access_token = auth_service.create_access_token(
            subject=staff["username"],
            is_admin=staff.get("is_admin", False),
            name=staff.get("name", staff["username"]),
            email=staff.get("email", ""),
        )
        refresh_token, refresh_expires_at = auth_service.create_refresh_token(
            subject_type="staff", subject_id=staff["username"],
        )
        return _login_response(access_token, refresh_token, refresh_expires_at)
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
        access_token = auth_service.create_access_token(
            subject=staff["username"],
            is_admin=staff.get("is_admin", False),
            name=staff.get("name", staff["username"]),
            email=staff.get("email", ""),
        )
        refresh_token, refresh_expires_at = auth_service.create_refresh_token(
            subject_type="staff", subject_id=staff["username"],
        )
        return _login_response(access_token, refresh_token, refresh_expires_at)
    except StaffNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except VerificationCodeExpiredError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except InvalidVerificationCodeError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


# ── Refresh / logout ─────────────────────────────────────────────────────────


@router.post("/refresh", response_model=LoginResponse)
async def refresh_token(payload: RefreshRequest) -> LoginResponse:
    """Rotate a refresh token; returns a fresh access + refresh pair.

    The old token is marked revoked as part of the rotation.  Any
    subsequent call with the same token is rejected.
    """
    try:
        (
            access_token,
            new_refresh,
            new_exp,
            _subject_type,
            _subject_id,
        ) = auth_service.rotate_refresh_token(payload.refresh_token)
    except InvalidCredentialsError as exc:
        raise HTTPException(status_code=401, detail=str(exc))
    return _login_response(access_token, new_refresh, new_exp)


@router.post("/logout", status_code=204)
async def logout(payload: LogoutRequest) -> Response:
    """Revoke a refresh token.  Idempotent: 204 either way."""
    auth_service.revoke_refresh_token(payload.refresh_token)
    return Response(status_code=204)


# ── Registrant flow ──────────────────────────────────────────────────────────


@router.post("/registrants/register", status_code=200)
async def register_registrant(payload: RegistrantRegisterRequest) -> dict:
    """Begin the registrant self-service auth flow.

    The registrant must already have a row in ``registrants`` (created
    by the public registration form).  This endpoint hashes the
    password and emails a 24h verification link.
    """
    try:
        row, raw_token, expires_at = registrant_auth_service.begin_registration(
            email=payload.email,
            matriculation_number=payload.matriculation_number,
            department_code=payload.department_code,
            password=payload.password,
        )
    except RegistrantAuthNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except AlreadyRegisteredError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except EmailNotVerifiedError as exc:
        # Reused for "account is fully set up" — guide to login.
        raise HTTPException(status_code=400, detail=str(exc))

    verification_url = f"{_web_base_url()}/verify-email?token={raw_token}"
    try:
        email_service.send_registrant_verification_email(
            email=row["email"],
            matriculation_number=row["matriculation_number"],
            department_code=row["department_code"],
            verification_url=verification_url,
        )
    except Exception as exc:
        logger.warning(
            "Failed to send registrant verification email to %s: %s",
            row.get("email"),
            exc,
        )
        # Don't fail the request — the registrant can retry by re-POSTing
        # (which will issue a new token via begin_registration).

    return {
        "message": "Verification email sent",
        "email": row["email"],
        "matriculation_number": row["matriculation_number"],
        "department_code": row["department_code"],
        "verification_expires_at": expires_at,
    }


@router.post("/registrants/verify", response_model=LoginResponse)
async def verify_registrant(payload: RegistrantVerifyRequest) -> LoginResponse:
    """Consume a verification token and issue tokens."""
    registrant_id = registrant_auth_service.consume_verification_token(payload.token)
    if not registrant_id:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired verification token",
        )

    # Look up the (now verified) row to build tokens.
    with _registrant_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT id, department_code, name, email, matriculation_number
                FROM registrants
                WHERE id = %s
                """,
                (registrant_id,),
            )
            row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Registrant vanished mid-verification")

    registrant_auth_service.mark_email_verified(registrant_id)

    access_token = registrant_auth_service.create_access_token(
        registrant_id=registrant_id,
        department_code=row["department_code"],
        matriculation_number=row["matriculation_number"],
    )
    refresh_token, refresh_expires_at = auth_service.create_refresh_token(
        subject_type="registrant",
        subject_id=row["matriculation_number"],
    )

    # Fire-and-forget welcome email.
    try:
        email_service.send_registrant_welcome_email(
            email=row["email"],
            name=row["name"],
            department_code=row["department_code"],
            matriculation_number=row["matriculation_number"],
        )
    except Exception as exc:
        logger.warning(
            "Failed to send registrant welcome email to %s: %s",
            row.get("email"),
            exc,
        )

    return _login_response(access_token, refresh_token, refresh_expires_at)


@router.post("/registrants/login", response_model=LoginResponse)
async def login_registrant(payload: RegistrantLoginRequest) -> LoginResponse:
    """Authenticate a verified registrant and return a fresh token pair."""
    try:
        row = registrant_auth_service.authenticate(
            department_code=payload.department_code,
            matriculation_number=payload.matriculation_number,
            password=payload.password,
        )
    except RegistrantAuthNotFoundError as exc:
        raise HTTPException(status_code=401, detail=str(exc))
    except RegistrantInvalidCredentialsError as exc:
        raise HTTPException(status_code=401, detail=str(exc))
    except EmailNotVerifiedError as exc:
        raise HTTPException(status_code=403, detail=str(exc))

    access_token = registrant_auth_service.create_access_token(
        registrant_id=row["id"],
        department_code=row["department_code"],
        matriculation_number=row["matriculation_number"],
    )
    refresh_token, refresh_expires_at = auth_service.create_refresh_token(
        subject_type="registrant",
        subject_id=row["matriculation_number"],
    )
    return _login_response(access_token, refresh_token, refresh_expires_at)


# Helper for the verify endpoint (avoids polluting imports above).
from contextlib import contextmanager  # noqa: E402
from db import get_connection  # noqa: E402


@contextmanager
def _registrant_conn():
    with get_connection() as conn:
        yield conn

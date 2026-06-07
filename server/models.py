"""Pydantic request/response models for the public HTTP API.

Models that are service-internal (e.g. ``StaffPublic`` in
:mod:`services.staff_auth`) live next to the service that owns them.
"""

from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, EmailStr, Field


class AttendanceRecord(BaseModel):
    date: date
    present: bool = True


class AttendanceByIdRecord(BaseModel):
    id: str
    present: bool = True
    date: date


class CheckInRequest(BaseModel):
    id: str
    occurred_at: datetime | None = None


class CheckOutRequest(BaseModel):
    id: str
    occurred_at: datetime | None = None


class SessionResponse(BaseModel):
    session_id: int
    registrant_id: str
    session_type: str
    occurred_at: datetime


class SessionsForDateResponse(BaseModel):
    date: date
    sessions: list[SessionResponse]


class RegistrantCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    matriculation_number: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"
    expires_in: int | None = None


class StaffRegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str
    requested_admin: bool = False


class StaffVerifyRequest(BaseModel):
    username: str
    pin: str


class StaffRegisterResponse(BaseModel):
    message: str
    username: str
    email: EmailStr
    verification_expires_at: datetime


class DepartmentCreate(BaseModel):
    code: str = Field(..., max_length=20)
    name: str = Field(..., max_length=100)
    duration: str = Field(default="", max_length=50)


class DepartmentUpdate(BaseModel):
    name: str | None = Field(None, max_length=100)
    duration: str | None = Field(None, max_length=50)


class DepartmentResponse(BaseModel):
    code: str
    name: str
    duration: str


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str


class RegistrantRegisterRequest(BaseModel):
    """Body for ``POST /auth/registrants/register``.

    The registrant is identified by ``(department_code, matriculation_number)``;
    the rest of the fields (name / phone) are kept for symmetry with the
    public registration form but the row's existing values are not
    overwritten.
    """
    email: EmailStr
    matriculation_number: str
    name: str | None = None
    phone: str | None = None
    password: str = Field(..., min_length=8)
    department_code: str


class RegistrantLoginRequest(BaseModel):
    matriculation_number: str
    department_code: str
    password: str


class RegistrantVerifyRequest(BaseModel):
    token: str

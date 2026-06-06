"""Pydantic request/response models for the public HTTP API.

Models that are service-internal (e.g. ``StaffPublic`` in
:mod:`services.staff_auth`) live next to the service that owns them.
"""

from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, EmailStr


class AttendanceRecord(BaseModel):
    date: date
    present: bool = True


class AttendanceByIdRecord(BaseModel):
    id: str
    present: bool = True
    date: date


class RegistrantCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    matriculation_number: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class StaffRegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str


class StaffVerifyRequest(BaseModel):
    username: str
    pin: str


class StaffRegisterResponse(BaseModel):
    message: str
    username: str
    email: EmailStr
    verification_expires_at: datetime


class CourseCreate(BaseModel):
    code: str
    name: str
    description: str = ""
    duration: str = ""

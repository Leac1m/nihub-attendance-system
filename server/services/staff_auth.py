from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import secrets
from typing import Any

import jwt
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel

from db import get_connection


class StaffAuthError(Exception):
    pass


class StaffNotFoundError(StaffAuthError):
    pass


class StaffAlreadyExistsError(StaffAuthError):
    pass


class InvalidCredentialsError(StaffAuthError):
    pass


class StaffNotVerifiedError(StaffAuthError):
    pass


class InvalidVerificationCodeError(StaffAuthError):
    pass


class VerificationCodeExpiredError(StaffAuthError):
    pass


@dataclass
class StaffAuthService:
    secret_key: str
    algorithm: str = "HS256"
    access_token_minutes: int = 60

    def generate_verification_pin(self, length: int = 6) -> str:
        upper_bound = 10**length
        return str(secrets.randbelow(upper_bound)).zfill(length)

    def find_staff_by_username(self, username: str) -> dict[str, Any] | None:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT
                        username,
                        name,
                        email,
                        password,
                        is_verified,
                        verification_pin,
                        verification_pin_expires_at
                    FROM staff
                    WHERE username = %s
                    """,
                    (username,),
                )
                row = cur.fetchone()
                if row:
                    return dict(row)
                return None

    def create_staff(
        self,
        *,
        username: str,
        email: str,
        password: str,
        verification_pin: str,
        verification_pin_expires_at: datetime,
    ) -> dict[str, Any]:
        try:
            with get_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        """
                        INSERT INTO staff (
                            username,
                            name,
                            email,
                            password,
                            is_verified,
                            verification_pin,
                            verification_pin_expires_at
                        )
                        VALUES (%s, %s, %s, %s, FALSE, %s, %s)
                        RETURNING
                            username,
                            name,
                            email,
                            password,
                            is_verified,
                            verification_pin,
                            verification_pin_expires_at
                        """,
                        (
                            username,
                            username,
                            email,
                            password,
                            verification_pin,
                            verification_pin_expires_at,
                        ),
                    )
                    row = cur.fetchone()
                    conn.commit()
                    return dict(row)
        except Exception as exc:
            if getattr(exc, "pgcode", None) == "23505":
                raise StaffAlreadyExistsError("A staff account with that username already exists")
            raise

    def verify_staff_account(self, username: str, verification_pin: str) -> dict[str, Any]:
        staff = self.find_staff_by_username(username)
        if not staff:
            raise StaffNotFoundError("Staff account not found")

        if staff.get("is_verified"):
            return staff

        stored_pin = staff.get("verification_pin")
        if not stored_pin or stored_pin != verification_pin:
            raise InvalidVerificationCodeError("Invalid verification code")

        expires_at = staff.get("verification_pin_expires_at")
        if expires_at and datetime.now(timezone.utc) > expires_at:
            raise VerificationCodeExpiredError("Verification code has expired")

        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE staff
                    SET is_verified = TRUE,
                        verification_pin = NULL,
                        verification_pin_expires_at = NULL
                    WHERE username = %s
                    RETURNING
                        username,
                        name,
                        email,
                        password,
                        is_verified,
                        verification_pin,
                        verification_pin_expires_at
                    """,
                    (username,),
                )
                row = cur.fetchone()
                conn.commit()
                return dict(row)

    def authenticate(self, username: str, password: str) -> dict[str, Any]:
        staff = self.find_staff_by_username(username)
        if not staff:
            raise StaffNotFoundError("Staff account not found")

        # Testing-only: plain-text comparison. Replace with hashed passwords ASAP.
        if staff.get("password") != password:
            raise InvalidCredentialsError("Invalid username or password")

        if not staff.get("is_verified"):
            raise StaffNotVerifiedError("Account not verified yet")

        return staff

    def create_access_token(self, subject: str) -> str:
        now = datetime.now(tz=timezone.utc)
        exp = now + timedelta(minutes=self.access_token_minutes)
        payload = {"sub": subject, "exp": exp}
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)

    def decode_access_token(self, token: str) -> dict[str, Any]:
        try:
            return jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
        except jwt.PyJWTError:
            raise InvalidCredentialsError("Invalid or expired token")


class StaffPublic(BaseModel):
    username: str
    name: str
    email: str


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def _build_default_auth_service() -> StaffAuthService:
    """Construct a :class:`StaffAuthService` using the current ``JWT_SECRET``.

    ``load_dotenv`` must have been called before this runs (it is, in
    :mod:`main`).  Falls back to a development secret if the env var is
    not set.
    """
    return StaffAuthService(secret_key=os.getenv("JWT_SECRET", "dev-secret-change-me"))


# Singleton instance shared across the app.  Re-importing this module is
# safe — the same env-derived secret is reused.
auth_service: StaffAuthService = _build_default_auth_service()

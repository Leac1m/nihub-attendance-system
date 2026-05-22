from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel

from db import get_connection


class StaffAuthError(Exception):
    pass


class StaffNotFoundError(StaffAuthError):
    pass


class InvalidCredentialsError(StaffAuthError):
    pass


@dataclass
class StaffAuthService:
    secret_key: str
    algorithm: str = "HS256"
    access_token_minutes: int = 60

    def find_staff_by_username(self, username: str) -> dict[str, Any] | None:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT username, name, email, password FROM staff WHERE username = %s",
                    (username,),
                )
                row = cur.fetchone()
                if row:
                    return dict(row)
                return None

    def authenticate(self, username: str, password: str) -> dict[str, Any]:
        staff = self.find_staff_by_username(username)
        if not staff:
            raise StaffNotFoundError("Staff account not found")

        # Testing-only: plain-text comparison. Replace with hashed passwords ASAP.
        if staff.get("password") != password:
            raise InvalidCredentialsError("Invalid username or password")

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
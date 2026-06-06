"""FastAPI dependencies shared across routers."""

from __future__ import annotations

from fastapi import Depends, HTTPException

from services.staff_auth import (
    InvalidCredentialsError,
    StaffNotFoundError,
    StaffPublic,
    auth_service,
    oauth2_scheme,
)


def get_current_staff(token: str = Depends(oauth2_scheme)) -> StaffPublic:
    """Decode the bearer token and return the authenticated staff member.

    Raises ``HTTPException(401)`` for invalid/expired tokens or unknown
    staff accounts.
    """
    try:
        payload = auth_service.decode_access_token(token)
        username = payload.get("sub")
        if not username:
            raise InvalidCredentialsError("Invalid token subject")

        staff = auth_service.find_staff_by_username(username)
        if not staff:
            raise StaffNotFoundError("Staff account not found")

        return StaffPublic(
            username=staff["username"],
            name=staff["name"],
            email=staff["email"],
        )
    except (InvalidCredentialsError, StaffNotFoundError):
        raise HTTPException(status_code=401, detail="Could not validate credentials")

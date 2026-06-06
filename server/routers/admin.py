"""Administrative endpoints.

Phase 4 will fill this router in.  For now it is intentionally empty so
that the import graph and middleware wiring are exercised — but it now
imports :func:`get_current_admin` so any future endpoint that uses it
as a dependency will get the real ``is_admin`` DB check rather than
the old staff-only stub.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends

from dependencies import get_current_admin
from services.staff_auth import StaffPublic

# TODO(phase 4): add admin-only endpoints here (staff list/create/delete,
# department administration, audit log viewer, etc.).

router = APIRouter(prefix="/admin", tags=["admin"])

# Re-exported so existing call sites can still import it from this
# module.  New endpoints should ``from dependencies import
# get_current_admin`` directly.
get_current_admin = get_current_admin


# A trivial placeholder that exercises the admin dependency end-to-end
# (handy for verifying the 403 path during smoke tests).  Will be
# removed or replaced once real admin endpoints land.
@router.get("/whoami", response_model=StaffPublic)
async def admin_whoami(admin: StaffPublic = Depends(get_current_admin)) -> StaffPublic:
    return admin

"""Administrative endpoints.

Phase 4 will fill this router in.  For now it is intentionally empty so
that the import graph and middleware wiring are exercised.
"""

from __future__ import annotations

from fastapi import APIRouter

from dependencies import get_current_staff

# TODO(phase 4): add admin-only endpoints here (staff list/create/delete,
# department administration, audit log viewer, etc.).

router = APIRouter(prefix="/admin", tags=["admin"])

# Temporary shim: every admin endpoint will eventually guard with this.
# Until then it is just an alias for the regular staff dependency.
get_current_admin = get_current_staff

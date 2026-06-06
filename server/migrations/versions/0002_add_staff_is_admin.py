"""add staff.is_admin

Phase 2 of the NIHUB Attendance System upgrade.  Introduces the
``is_admin`` flag on the ``staff`` table so the
``get_current_admin`` dependency can do a real permission check
(rather than silently letting any logged-in staff member hit admin
endpoints).

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-06 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE staff ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE",
    )


def downgrade() -> None:
    op.execute("ALTER TABLE staff DROP COLUMN is_admin")

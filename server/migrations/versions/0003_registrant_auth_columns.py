"""add registrant auth columns

Phase 2 of the NIHUB Attendance System upgrade.  Adds the
``password_hash`` and ``email_verified_at`` columns to ``registrants``
so they can self-service an account against the same row that the
public registration form already inserts.

``password_hash`` is an Argon2id PHC string (see
``services.registrant_auth``); the column is nullable because
registrants created via the public form do not have a password yet.

``email_verified_at`` is nullable so we can enforce "must verify
before login" without a separate boolean column.

Revision ID: 0003
Revises: 0002
Create Date: 2026-06-06 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "ALTER TABLE registrants ADD COLUMN password_hash VARCHAR(255)",
    )
    op.execute(
        "ALTER TABLE registrants ADD COLUMN email_verified_at TIMESTAMPTZ",
    )


def downgrade() -> None:
    op.execute("ALTER TABLE registrants DROP COLUMN email_verified_at")
    op.execute("ALTER TABLE registrants DROP COLUMN password_hash")

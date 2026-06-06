"""create refresh_tokens table

Phase 2 of the NIHUB Attendance System upgrade.  Introduces a generic
refresh-token store that works for both staff and registrants.

The table is intentionally narrow: we store the SHA-256 hex digest of
the opaque token (never the token itself), the subject (``staff``
username or ``registrant`` matriculation number) plus a type tag, and
the lifecycle timestamps.  Rotated/revoked tokens are tracked via
``revoked_at`` so the rotate flow can revoke the old token when it
issues a new one.

The same table is also used to issue single-use email verification
links for registrants: the row's ``subject_id`` is set to
``verify_email:<id>`` and its ``expires_at`` is 24 hours; the
verification endpoint looks the token up by hash, sets
``registrants.email_verified_at = now()`` and revokes the row.

Revision ID: 0004
Revises: 0003
Create Date: 2026-06-06 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE TYPE refresh_subject_type AS ENUM ('staff', 'registrant')")

    op.execute(
        """
        CREATE TABLE refresh_tokens (
            id SERIAL PRIMARY KEY,
            token_hash VARCHAR(64) NOT NULL UNIQUE,
            subject_type refresh_subject_type NOT NULL,
            subject_id VARCHAR(64) NOT NULL,
            issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            expires_at TIMESTAMPTZ NOT NULL,
            revoked_at TIMESTAMPTZ
        )
        """,
    )
    op.execute(
        "CREATE INDEX ix_refresh_tokens_subject "
        "ON refresh_tokens (subject_type, subject_id)",
    )
    op.execute(
        "CREATE INDEX ix_refresh_tokens_token_hash "
        "ON refresh_tokens (token_hash)",
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS refresh_tokens")
    op.execute("DROP TYPE IF EXISTS refresh_subject_type")

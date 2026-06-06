"""attendance_sessions table

Phase 6 of the NIHUB Attendance System upgrade. Introduces a
check-in / check-out session model:

- ``attendance_sessions`` table records each individual in/out event
- ``attendance`` gains ``first_in_at``, ``last_out_at``, and
  ``derived_status`` columns for fast status queries
- Backfill populates ``first_in_at`` and ``derived_status`` from the
  existing ``present`` boolean column.

Revision ID: 0005
Revises: 0004
Create Date: 2026-06-06 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE TYPE session_type_enum AS ENUM ('in', 'out')")

    op.execute(
        """
        CREATE TABLE attendance_sessions (
            id SERIAL PRIMARY KEY,
            registrant_id VARCHAR(20) NOT NULL REFERENCES registrants(id) ON DELETE CASCADE,
            session_type session_type_enum NOT NULL,
            occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            staff_id INTEGER REFERENCES staff(id) ON DELETE SET NULL,
            notes TEXT
        )
        """,
    )

    op.execute(
        "CREATE INDEX ix_attendance_sessions_registrant_occurred "
        "ON attendance_sessions (registrant_id, occurred_at DESC)",
    )

    op.execute(
        "ALTER TABLE attendance "
        "ADD COLUMN first_in_at TIMESTAMPTZ",
    )
    op.execute(
        "ALTER TABLE attendance "
        "ADD COLUMN last_out_at TIMESTAMPTZ",
    )
    op.execute(
        "ALTER TABLE attendance "
        "ADD COLUMN derived_status VARCHAR(20)",
    )

    op.execute(
        """
        UPDATE attendance SET
            first_in_at = (date || 'T12:00:00Z')::timestamptz,
            derived_status = CASE WHEN present THEN 'present' ELSE 'absent' END
        WHERE present = true
        """,
    )
    op.execute(
        """
        UPDATE attendance SET
            derived_status = 'absent'
        WHERE present = false AND derived_status IS NULL
        """,
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS attendance_sessions")
    op.execute("DROP TYPE IF EXISTS session_type_enum")
    op.execute("ALTER TABLE attendance DROP COLUMN IF EXISTS first_in_at")
    op.execute("ALTER TABLE attendance DROP COLUMN IF EXISTS last_out_at")
    op.execute("ALTER TABLE attendance DROP COLUMN IF EXISTS derived_status")

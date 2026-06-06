"""rename courses to departments, drop description

Phase 2 of the NIHUB Attendance System upgrade.  Replaces the
``courses`` table with ``departments`` (mirroring the UI language),
drops the ``description`` column, and renames the FK column in
``registrants`` so the schema is self-consistent with the new code.

Revision ID: 0001
Revises:
Create Date: 2026-06-06 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Rename the table.  Postgres will auto-rename the primary key index
    # from ``courses_pkey`` to ``departments_pkey`` but we make the rename
    # explicit so the intent is auditable in the migration log.
    op.execute("ALTER TABLE courses RENAME TO departments")
    op.execute("ALTER INDEX IF EXISTS courses_pkey RENAME TO departments_pkey")

    # Rename the FK column on registrants.
    op.execute(
        "ALTER TABLE registrants RENAME COLUMN course_code TO department_code",
    )

    # Rename the FK constraint.  The original name in init.sql is
    # ``fk_course``; the PG-generated unique-key names are
    # ``registrants_course_code_email_key`` and
    # ``registrants_course_code_matriculation_number_key``.
    op.execute("ALTER TABLE registrants RENAME CONSTRAINT fk_course TO fk_department")
    op.execute(
        "ALTER TABLE registrants RENAME CONSTRAINT "
        "registrants_course_code_email_key TO "
        "registrants_department_code_email_key",
    )
    op.execute(
        "ALTER TABLE registrants RENAME CONSTRAINT "
        "registrants_course_code_matriculation_number_key TO "
        "registrants_department_code_matriculation_number_key",
    )

    # Drop the description column.  Phase 2 removes the concept entirely
    # (no UI or email path will read it any more).
    op.execute("ALTER TABLE departments DROP COLUMN description")


def downgrade() -> None:
    # Reverse the above in the opposite order.
    op.execute("ALTER TABLE departments ADD COLUMN description TEXT")

    op.execute(
        "ALTER TABLE registrants RENAME CONSTRAINT "
        "registrants_department_code_matriculation_number_key TO "
        "registrants_course_code_matriculation_number_key",
    )
    op.execute(
        "ALTER TABLE registrants RENAME CONSTRAINT "
        "registrants_department_code_email_key TO "
        "registrants_course_code_email_key",
    )
    op.execute("ALTER TABLE registrants RENAME CONSTRAINT fk_department TO fk_course")
    op.execute(
        "ALTER TABLE registrants RENAME COLUMN department_code TO course_code",
    )

    op.execute("ALTER INDEX IF EXISTS departments_pkey RENAME TO courses_pkey")
    op.execute("ALTER TABLE departments RENAME TO courses")

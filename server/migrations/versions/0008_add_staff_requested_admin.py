"""add staff.requested_admin for admin role request."""
from alembic import op
import sqlalchemy as sa

revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("staff", sa.Column("requested_admin", sa.Boolean(), nullable=False, server_default=sa.text("FALSE")))


def downgrade() -> None:
    op.drop_column("staff", "requested_admin")
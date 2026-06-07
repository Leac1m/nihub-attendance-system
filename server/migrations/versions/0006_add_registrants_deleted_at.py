"""add registrants.deleted_at for soft-delete"""
from alembic import op

revision = '0006'
down_revision = '0005'
branch_labels = None
def upgrade():
    op.execute("ALTER TABLE registrants ADD COLUMN deleted_at TIMESTAMPTZ NULL")
    op.execute("CREATE INDEX ix_registrants_deleted_at ON registrants(department_code, deleted_at)")
def downgrade():
    op.execute("DROP INDEX ix_registrants_deleted_at")
    op.execute("ALTER TABLE registrants DROP COLUMN deleted_at")
"""add last_asked_at to snippets

Revision ID: 0003_add_last_asked_at_to_snippets
Revises: 0002_add_username_to_users
Create Date: 2026-05-02 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "0003_add_last_asked_at_to_snippets"
down_revision = "0002_add_username_to_users"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "snippets",
        sa.Column("last_asked_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade():
    op.drop_column("snippets", "last_asked_at")

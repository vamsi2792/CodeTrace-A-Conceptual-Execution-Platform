"""add username to users

Revision ID: 0002_add_username_to_users
Revises: 0001_initial
Create Date: 2026-04-29 16:35:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "0002_add_username_to_users"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("username", sa.String(), nullable=True))
    op.execute("UPDATE users SET username = split_part(email, '@', 1) WHERE username IS NULL")
    op.alter_column("users", "username", nullable=False)


def downgrade():
    op.drop_column("users", "username")

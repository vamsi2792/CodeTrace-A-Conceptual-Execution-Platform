"""initial schema

Revision ID: 0001_initial
Revises: 
Create Date: 2026-04-29 00:00:00.000000
"""

from alembic import op
import sqlalchemy as sa

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("email", sa.String(), nullable=False, unique=True, index=True),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_table(
        "snippets",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("difficulty_level", sa.String(), nullable=False),
        sa.Column("code_text", sa.Text(), nullable=False),
        sa.Column("expected_output", sa.Text(), nullable=False),
        sa.Column("explanation", sa.Text(), nullable=False),
    )
    op.create_table(
        "user_stats",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False, unique=True),
        sa.Column("snippets_solved", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("current_streak", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("accuracy_percentage", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_table(
        "attempts",
        sa.Column("id", sa.Integer(), primary_key=True, nullable=False),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("snippet_id", sa.Integer(), sa.ForeignKey("snippets.id"), nullable=False),
        sa.Column("user_answer", sa.Text(), nullable=False),
        sa.Column("is_correct", sa.Boolean(), nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade():
    op.drop_table("attempts")
    op.drop_table("user_stats")
    op.drop_table("snippets")
    op.drop_table("users")

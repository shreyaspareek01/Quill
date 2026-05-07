"""add image_url column to posts table

Revision ID: 3f4cb5220ca1
Revises: 28bd2a82a8f6
Create Date: 2026-05-07 09:55:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3f4cb5220ca1'
down_revision: Union[str, Sequence[str], None] = '28bd2a82a8f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('posts', sa.Column('image_url', sa.String(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('posts', 'image_url')

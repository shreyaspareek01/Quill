"""add content column to posts table

Revision ID: 9cc63b425c6d
Revises: 5caa005261ed
Create Date: 2026-05-04 22:39:56.553928

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9cc63b425c6d'
down_revision: Union[str, Sequence[str], None] = '5caa005261ed'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('posts',sa.Column('content',sa.String(),nullable=False))
    pass


def downgrade() -> None:
    """Downgrade schema.""" 
    op.drop_column('posts','content')

"""add user table

Revision ID: d0e6e925fac5
Revises: 9cc63b425c6d
Create Date: 2026-05-04 22:59:08.734895

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd0e6e925fac5'
down_revision: Union[str, Sequence[str], None] = '9cc63b425c6d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table('users',sa.Column('id',sa.Integer(),nullable=False,primary_key=True),sa.Column('email',sa.String(),nullable=False,unique=True),sa.Column('password',sa.String(),nullable=False),sa.Column('created_at',sa.TIMESTAMP(timezone=True),server_default=sa.text('now()'),nullable=False)) 
    pass


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('users')

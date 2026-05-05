"""add foreign-key to posts table

Revision ID: 92945fd0e014
Revises: d0e6e925fac5
Create Date: 2026-05-04 23:04:30.204718

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '92945fd0e014'
down_revision: Union[str, Sequence[str], None] = 'd0e6e925fac5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column("posts",sa.Column("owner_id",sa.Integer(),nullable=False))
    op.create_foreign_key("posts_users_fk",source_table="posts",referent_table="users",local_cols=['owner_id'],remote_cols=['id'],ondelete="CASCADE")
    pass


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("posts_users_fk",table_name="posts")
    op.drop_column("posts","owner_id")
    pass

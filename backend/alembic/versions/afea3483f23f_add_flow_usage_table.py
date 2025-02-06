"""add flow usage table

Revision ID: afea3483f23f
Revises: 9b5772d9c04a
Create Date: 2024-03-21 12:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision: str = 'afea3483f23f'
down_revision: Union[str, None] = '9b5772d9c04a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 创建流量使用表
    op.create_table('flow_usage',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('instance_no', sa.String(32), nullable=False),
        sa.Column('daily_usage', sa.Float(), default=0.0),
        sa.Column('monthly_usage', sa.Float(), default=0.0),
        sa.Column('total_usage', sa.Float(), default=0.0),
        sa.Column('remark', sa.Text()),
        sa.Column('created_at', sa.TIMESTAMP(), default=datetime.now),
        sa.Column('updated_at', sa.TIMESTAMP(), default=datetime.now, onupdate=datetime.now),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
    )
    op.create_index('ix_flow_usage_user_id', 'flow_usage', ['user_id'])
    op.create_index('ix_flow_usage_instance_no', 'flow_usage', ['instance_no'])

def downgrade() -> None:
    op.drop_table('flow_usage')

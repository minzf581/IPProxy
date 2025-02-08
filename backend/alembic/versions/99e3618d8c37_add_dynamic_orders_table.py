"""add dynamic orders table

Revision ID: 99e3618d8c37
Revises: afea3483f23f
Create Date: 2024-03-21 15:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision: str = '99e3618d8c37'
down_revision: Union[str, None] = 'afea3483f23f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 创建动态订单表
    op.create_table('dynamic_orders',
        sa.Column('id', sa.String(50), nullable=False),
        sa.Column('order_no', sa.String(50), nullable=False, unique=True, index=True),
        sa.Column('app_order_no', sa.String(50), nullable=False, unique=True, index=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id')),
        sa.Column('agent_id', sa.Integer(), sa.ForeignKey('users.id')),
        sa.Column('pool_type', sa.String(50)),
        sa.Column('traffic', sa.Integer()),
        sa.Column('unit_price', sa.Float()),
        sa.Column('total_amount', sa.Float()),
        sa.Column('proxy_type', sa.String(20)),
        sa.Column('status', sa.String(20)),
        sa.Column('remark', sa.String(255), nullable=True),
        sa.Column('proxy_info', sa.JSON, nullable=True),
        sa.Column('created_at', sa.DateTime(), default=datetime.utcnow),
        sa.Column('updated_at', sa.DateTime(), default=datetime.utcnow, onupdate=datetime.utcnow),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_dynamic_orders_user_id', 'dynamic_orders', ['user_id'])
    op.create_index('ix_dynamic_orders_agent_id', 'dynamic_orders', ['agent_id'])
    op.create_index('ix_dynamic_orders_status', 'dynamic_orders', ['status'])

def downgrade() -> None:
    op.drop_table('dynamic_orders')

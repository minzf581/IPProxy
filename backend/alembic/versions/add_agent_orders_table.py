"""add agent orders table

Revision ID: add_agent_orders_table
Revises: add_agent_and_user_prices
Create Date: 2024-03-22 17:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision: str = 'add_agent_orders_table'
down_revision: Union[str, None] = 'add_agent_and_user_prices'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 创建代理商订单表
    op.create_table(
        'agent_orders',
        sa.Column('id', sa.Integer(), nullable=False, autoincrement=True),
        sa.Column('order_no', sa.String(50), nullable=False, unique=True, index=True),
        sa.Column('agent_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False, index=True),
        sa.Column('amount', sa.DECIMAL(10, 4), nullable=False),
        sa.Column('type', sa.String(20), nullable=False),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('remark', sa.Text()),
        sa.Column('created_at', sa.TIMESTAMP(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.TIMESTAMP(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP'), onupdate=sa.text('CURRENT_TIMESTAMP')),
        sa.PrimaryKeyConstraint('id')
    )
    
    # 创建索引
    op.create_index('ix_agent_orders_order_no', 'agent_orders', ['order_no'])
    op.create_index('ix_agent_orders_agent_id', 'agent_orders', ['agent_id'])
    op.create_index('ix_agent_orders_type', 'agent_orders', ['type'])
    op.create_index('ix_agent_orders_status', 'agent_orders', ['status'])
    op.create_index('ix_agent_orders_created_at', 'agent_orders', ['created_at'])

def downgrade() -> None:
    # 删除索引
    op.drop_index('ix_agent_orders_created_at')
    op.drop_index('ix_agent_orders_status')
    op.drop_index('ix_agent_orders_type')
    op.drop_index('ix_agent_orders_agent_id')
    op.drop_index('ix_agent_orders_order_no')
    
    # 删除表
    op.drop_table('agent_orders') 
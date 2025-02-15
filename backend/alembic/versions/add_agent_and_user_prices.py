"""add agent and user prices tables

Revision ID: add_agent_and_user_prices
Revises: add_min_agent_price
Create Date: 2024-03-22 16:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from datetime import datetime
from sqlalchemy import inspect

# revision identifiers, used by Alembic.
revision: str = 'add_agent_and_user_prices'
down_revision: Union[str, None] = 'add_min_agent_price'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 检查并删除已存在的表
    connection = op.get_bind()
    inspector = inspect(connection)
    
    if 'agent_prices' in inspector.get_table_names():
        op.drop_table('agent_prices')
    if 'user_prices' in inspector.get_table_names():
        op.drop_table('user_prices')
    
    # 创建新的agent_prices表
    op.create_table(
        'agent_prices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('agent_id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('price', sa.DECIMAL(10, 4), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), nullable=False, default=datetime.now),
        sa.Column('updated_at', sa.TIMESTAMP(), nullable=False, default=datetime.now, onupdate=datetime.now),
        sa.ForeignKeyConstraint(['agent_id'], ['users.id'], name='fk_agent_prices_agent'),
        sa.ForeignKeyConstraint(['product_id'], ['product_inventory.id'], name='fk_agent_prices_product'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('agent_id', 'product_id', name='uix_agent_product')
    )
    
    # 创建user_prices表
    op.create_table(
        'user_prices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('agent_id', sa.Integer(), nullable=False),
        sa.Column('price', sa.DECIMAL(10, 4), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), nullable=False, default=datetime.now),
        sa.Column('updated_at', sa.TIMESTAMP(), nullable=False, default=datetime.now, onupdate=datetime.now),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_user_prices_user'),
        sa.ForeignKeyConstraint(['product_id'], ['product_inventory.id'], name='fk_user_prices_product'),
        sa.ForeignKeyConstraint(['agent_id'], ['users.id'], name='fk_user_prices_agent'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'product_id', name='uix_user_product')
    )
    
    # 创建索引
    op.create_index('ix_agent_prices_agent_id', 'agent_prices', ['agent_id'])
    op.create_index('ix_agent_prices_product_id', 'agent_prices', ['product_id'])
    op.create_index('ix_user_prices_user_id', 'user_prices', ['user_id'])
    op.create_index('ix_user_prices_product_id', 'user_prices', ['product_id'])
    op.create_index('ix_user_prices_agent_id', 'user_prices', ['agent_id'])

def downgrade() -> None:
    # 删除索引
    op.drop_index('ix_agent_prices_agent_id')
    op.drop_index('ix_agent_prices_product_id')
    op.drop_index('ix_user_prices_user_id')
    op.drop_index('ix_user_prices_product_id')
    op.drop_index('ix_user_prices_agent_id')
    
    # 删除表
    op.drop_table('user_prices')
    op.drop_table('agent_prices') 
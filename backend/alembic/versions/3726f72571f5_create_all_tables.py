"""create all tables

Revision ID: 3726f72571f5
Revises: 
Create Date: 2024-03-21 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision: str = '3726f72571f5'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 创建用户表
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(50), nullable=False),
        sa.Column('password', sa.String(255), nullable=False),
        sa.Column('email', sa.String(255), unique=True, nullable=True),
        sa.Column('phone', sa.String(20), unique=True, nullable=True),
        sa.Column('status', sa.Integer(), nullable=False, default=1),
        sa.Column('is_admin', sa.Boolean(), default=False),
        sa.Column('is_agent', sa.Boolean(), default=False),
        sa.Column('balance', sa.Float(), nullable=False, default=0.0),
        sa.Column('remark', sa.String(255), nullable=True),
        sa.Column('last_login_at', sa.TIMESTAMP(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), nullable=False, default=datetime.now),
        sa.Column('updated_at', sa.TIMESTAMP(), nullable=False, default=datetime.now, onupdate=datetime.now),
        sa.Column('agent_id', sa.Integer(), nullable=True),
        sa.Column('ipipv_username', sa.String(50), unique=True, nullable=True),
        sa.Column('ipipv_password', sa.String(255), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['agent_id'], ['users.id'], ),
        sa.UniqueConstraint('username')
    )
    op.create_index('ix_users_username', 'users', ['username'])
    op.create_index('ix_users_email', 'users', ['email'])
    op.create_index('ix_users_agent_id', 'users', ['agent_id'])

    # 创建代理商价格表
    op.create_table('agent_prices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('agent_id', sa.Integer(), nullable=False),
        sa.Column('dynamic_proxy_price', sa.DECIMAL(10,4), nullable=False),
        sa.Column('static_proxy_price', sa.DECIMAL(10,4), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), nullable=False, default=datetime.now),
        sa.Column('updated_at', sa.TIMESTAMP(), nullable=False, default=datetime.now, onupdate=datetime.now),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['agent_id'], ['users.id'], ),
        sa.UniqueConstraint('agent_id')
    )

    # 创建产品库存表
    op.create_table('product_inventory',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('product_no', sa.String(50), nullable=False),
        sa.Column('product_name', sa.String(100), nullable=False),
        sa.Column('proxy_type', sa.SmallInteger(), nullable=False),
        sa.Column('use_type', sa.String(20), nullable=False),
        sa.Column('protocol', sa.String(20), nullable=False),
        sa.Column('use_limit', sa.SmallInteger(), nullable=False),
        sa.Column('sell_limit', sa.SmallInteger(), nullable=False),
        sa.Column('area_code', sa.String(20)),
        sa.Column('country_code', sa.String(3), nullable=False),
        sa.Column('state_code', sa.String(6), nullable=False),
        sa.Column('city_code', sa.String(9), nullable=False),
        sa.Column('detail', sa.Text()),
        sa.Column('cost_price', sa.DECIMAL(10,4), nullable=False),
        sa.Column('inventory', sa.Integer(), nullable=False, default=0),
        sa.Column('ip_type', sa.SmallInteger(), default=1),
        sa.Column('isp_type', sa.SmallInteger(), default=0),
        sa.Column('net_type', sa.SmallInteger(), default=0),
        sa.Column('duration', sa.Integer(), nullable=False),
        sa.Column('unit', sa.SmallInteger(), nullable=False),
        sa.Column('band_width', sa.Integer()),
        sa.Column('band_width_price', sa.DECIMAL(10,4)),
        sa.Column('max_band_width', sa.Integer()),
        sa.Column('flow', sa.Integer()),
        sa.Column('cpu', sa.Integer()),
        sa.Column('memory', sa.Float()),
        sa.Column('enable', sa.SmallInteger(), default=1),
        sa.Column('supplier_code', sa.String(20)),
        sa.Column('ip_count', sa.Integer()),
        sa.Column('ip_duration', sa.Integer()),
        sa.Column('assign_ip', sa.SmallInteger(), default=-1),
        sa.Column('cidr_status', sa.SmallInteger(), default=-1),
        sa.Column('static_type', sa.String(20)),
        sa.Column('last_sync_time', sa.TIMESTAMP()),
        sa.Column('created_at', sa.TIMESTAMP(), default=datetime.now),
        sa.Column('updated_at', sa.TIMESTAMP(), default=datetime.now, onupdate=datetime.now),
        sa.Column('ip_start', sa.String(15)),
        sa.Column('ip_end', sa.String(15)),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('product_no')
    )
    op.create_index('ix_product_inventory_product_no', 'product_inventory', ['product_no'])
    op.create_index('ix_product_inventory_proxy_type', 'product_inventory', ['proxy_type'])
    op.create_index('ix_product_inventory_country_code', 'product_inventory', ['country_code'])
    op.create_index('ix_product_inventory_city_code', 'product_inventory', ['city_code'])
    op.create_index('ix_product_inventory_static_type', 'product_inventory', ['static_type'])

    # 创建静态订单表
    op.create_table('static_orders',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('order_no', sa.String(32), nullable=False),
        sa.Column('app_order_no', sa.String(32), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('agent_id', sa.Integer(), nullable=False),
        sa.Column('product_no', sa.String(50), nullable=False),
        sa.Column('proxy_type', sa.Integer(), nullable=False),
        sa.Column('region_code', sa.String(20)),
        sa.Column('country_code', sa.String(3)),
        sa.Column('city_code', sa.String(9)),
        sa.Column('static_type', sa.String(20)),
        sa.Column('ip_count', sa.Integer(), nullable=False),
        sa.Column('duration', sa.Integer(), nullable=False),
        sa.Column('unit', sa.Integer(), nullable=False),
        sa.Column('amount', sa.DECIMAL(10,2), nullable=False),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('callback_count', sa.Integer(), default=0),
        sa.Column('last_callback_time', sa.TIMESTAMP()),
        sa.Column('remark', sa.Text()),
        sa.Column('created_at', sa.TIMESTAMP(), default=datetime.now),
        sa.Column('updated_at', sa.TIMESTAMP(), default=datetime.now, onupdate=datetime.now),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['agent_id'], ['users.id'], ),
        sa.UniqueConstraint('order_no')
    )
    op.create_index('ix_static_orders_order_no', 'static_orders', ['order_no'])
    op.create_index('ix_static_orders_user_id', 'static_orders', ['user_id'])
    op.create_index('ix_static_orders_agent_id', 'static_orders', ['agent_id'])
    op.create_index('ix_static_orders_status', 'static_orders', ['status'])

    # 创建实例表
    op.create_table('instances',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('instance_no', sa.String(32), nullable=False),
        sa.Column('order_no', sa.String(32), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('proxy_ip', sa.String(15), nullable=False),
        sa.Column('proxy_port', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(50), nullable=False),
        sa.Column('password', sa.String(50), nullable=False),
        sa.Column('expire_time', sa.TIMESTAMP(), nullable=False),
        sa.Column('status', sa.SmallInteger(), nullable=False, default=1),
        sa.Column('created_at', sa.TIMESTAMP(), default=datetime.now),
        sa.Column('updated_at', sa.TIMESTAMP(), default=datetime.now, onupdate=datetime.now),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['order_no'], ['static_orders.order_no'], ),
        sa.UniqueConstraint('instance_no')
    )
    op.create_index('ix_instances_instance_no', 'instances', ['instance_no'])
    op.create_index('ix_instances_order_no', 'instances', ['order_no'])
    op.create_index('ix_instances_user_id', 'instances', ['user_id'])
    op.create_index('ix_instances_status', 'instances', ['status'])

def downgrade() -> None:
    op.drop_table('instances')
    op.drop_table('static_orders')
    op.drop_table('product_inventory')
    op.drop_table('agent_prices')
    op.drop_table('users')

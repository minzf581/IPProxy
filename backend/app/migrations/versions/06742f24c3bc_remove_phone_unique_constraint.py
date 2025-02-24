"""remove phone unique constraint

Revision ID: 06742f24c3bc
Revises: f091f46bf452
Create Date: 2024-02-23 00:15:23.123456

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '06742f24c3bc'
down_revision: Union[str, None] = 'f091f46bf452'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 创建新表（没有唯一性约束）
    op.create_table(
        'users_new',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(50), unique=True, nullable=False),
        sa.Column('app_username', sa.String(50), unique=True, nullable=True),
        sa.Column('platform_account', sa.String(50), unique=True, nullable=True),
        sa.Column('password', sa.String(255), nullable=False),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('phone', sa.String(20), nullable=True),  # 移除唯一性约束
        sa.Column('status', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('is_admin', sa.Boolean(), default=False),
        sa.Column('is_agent', sa.Boolean(), default=False),
        sa.Column('balance', sa.Numeric(10, 2), nullable=False, default=0),
        sa.Column('remark', sa.Text()),
        sa.Column('last_login_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('agent_id', sa.Integer(), nullable=True),
        sa.Column('ipipv_username', sa.String(50), unique=True, nullable=True),
        sa.Column('ipipv_password', sa.String(255), nullable=True),
        sa.Column('total_recharge', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('total_consumption', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['agent_id'], ['users.id'])
    )

    # 复制数据
    op.execute('INSERT INTO users_new SELECT * FROM users')
    
    # 删除旧表
    op.drop_table('users')
    
    # 重命名新表
    op.rename_table('users_new', 'users')


def downgrade() -> None:
    # 创建新表（带有唯一性约束）
    op.create_table(
        'users_new',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(50), unique=True, nullable=False),
        sa.Column('app_username', sa.String(50), unique=True, nullable=True),
        sa.Column('platform_account', sa.String(50), unique=True, nullable=True),
        sa.Column('password', sa.String(255), nullable=False),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('phone', sa.String(20), unique=True, nullable=True),  # 恢复唯一性约束
        sa.Column('status', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('is_admin', sa.Boolean(), default=False),
        sa.Column('is_agent', sa.Boolean(), default=False),
        sa.Column('balance', sa.Numeric(10, 2), nullable=False, default=0),
        sa.Column('remark', sa.Text()),
        sa.Column('last_login_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('agent_id', sa.Integer(), nullable=True),
        sa.Column('ipipv_username', sa.String(50), unique=True, nullable=True),
        sa.Column('ipipv_password', sa.String(255), nullable=True),
        sa.Column('total_recharge', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.Column('total_consumption', sa.Numeric(10, 2), nullable=False, server_default='0'),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['agent_id'], ['users.id'])
    )

    # 复制数据
    op.execute('INSERT INTO users_new SELECT * FROM users')
    
    # 删除旧表
    op.drop_table('users')
    
    # 重命名新表
    op.rename_table('users_new', 'users') 
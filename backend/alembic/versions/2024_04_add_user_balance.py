"""add user balance

Revision ID: 2024_04_add_user_balance
Revises: 
Create Date: 2024-04-10 10:00:00.000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic
revision = '2024_04_add_user_balance'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # 添加 balance 字段
    op.add_column('users', sa.Column('balance', sa.Numeric(10, 2), nullable=False, server_default='0'))

def downgrade():
    # 删除 balance 字段
    op.drop_column('users', 'balance') 
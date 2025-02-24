"""add user balance

Revision ID: 2024_04_add_user_balance
Revises: previous_revision_id
Create Date: 2024-04-10 10:00:00.000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic
revision = '2024_04_add_user_balance'
down_revision = None  # 请根据实际情况修改
branch_labels = None
depends_on = None

def upgrade():
    # 添加 balance 字段，默认值为 0
    op.add_column('users', sa.Column('balance', sa.Float(), nullable=False, server_default='0'))

def downgrade():
    # 删除 balance 字段
    op.drop_column('users', 'balance') 
"""modify username constraint

Revision ID: 2024_04_modify_username_constraint
Revises: 2024_04_add_user_balance
Create Date: 2024-04-10 11:00:00.000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic
revision = '2024_04_modify_username_constraint'
down_revision = '2024_04_add_user_balance'
branch_labels = None
depends_on = None

def upgrade():
    # 删除原有的用户名唯一约束
    op.drop_constraint('users_username_key', 'users')
    
    # 创建新的复合唯一约束
    op.create_index('ix_users_username_agent_id', 'users', ['username', 'agent_id'], unique=True) 
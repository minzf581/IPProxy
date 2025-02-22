"""add user financial fields

Revision ID: add_user_financial_fields_202502221905
Revises: f091f46bf452
Create Date: 2025-02-22 19:05:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = 'add_user_financial_fields_202502221905'
down_revision = 'f091f46bf452'  # 当前head版本
branch_labels = None
depends_on = None

def upgrade():
    # 添加新字段
    op.add_column('users', sa.Column('total_recharge', sa.Numeric(10, 2), nullable=False, server_default='0'))
    op.add_column('users', sa.Column('total_consumption', sa.Numeric(10, 2), nullable=False, server_default='0'))
    
    # 更新现有数据
    op.execute("""
        UPDATE users u
        SET total_recharge = (
            SELECT COALESCE(SUM(amount), 0)
            FROM transactions t
            WHERE t.user_id = u.id AND t.type = 'recharge'
        ),
        total_consumption = (
            SELECT COALESCE(SUM(amount), 0)
            FROM transactions t
            WHERE t.user_id = u.id AND t.type = 'consumption'
        )
    """)

def downgrade():
    op.drop_column('users', 'total_consumption')
    op.drop_column('users', 'total_recharge') 
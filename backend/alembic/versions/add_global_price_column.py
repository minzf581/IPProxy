"""add global_price column

Revision ID: e6b45db80ea4
Revises: 99e3618d8c37
Create Date: 2024-03-21 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'e6b45db80ea4'
down_revision = '99e3618d8c37'
branch_labels = None
depends_on = None

def upgrade():
    # 添加 global_price 字段
    op.add_column('product_inventory', 
        sa.Column('global_price', sa.DECIMAL(10, 4), nullable=True)
    )

def downgrade():
    # 删除 global_price 字段
    op.drop_column('product_inventory', 'global_price') 
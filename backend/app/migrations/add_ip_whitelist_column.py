"""添加 ip_whitelist 列到 product_inventory 表

此迁移文件用于向 product_inventory 表添加 ip_whitelist 列，用于存储 IP 白名单列表。
"""

from alembic import op
import sqlalchemy as sa

def upgrade():
    """升级数据库结构"""
    # 添加 ip_whitelist 列，类型为 JSON，默认值为空列表
    op.add_column('product_inventory', 
        sa.Column('ip_whitelist', sa.JSON, nullable=True, server_default='[]')
    )

def downgrade():
    """回滚数据库结构"""
    # 删除 ip_whitelist 列
    op.drop_column('product_inventory', 'ip_whitelist') 
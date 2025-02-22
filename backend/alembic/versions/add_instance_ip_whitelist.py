"""add instance ip whitelist

Revision ID: add_instance_ip_whitelist_202502222115
Revises: add_user_financial_fields_202502221905
Create Date: 2025-02-22 21:15:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_instance_ip_whitelist_202502222115'
down_revision = 'add_user_financial_fields_202502221905'
branch_labels = None
depends_on = None

def upgrade():
    # SQLite不直接支持JSON类型，所以我们使用TEXT
    with op.batch_alter_table('instances') as batch_op:
        batch_op.add_column(sa.Column('ip_whitelist', sa.Text(), nullable=True))

def downgrade():
    with op.batch_alter_table('instances') as batch_op:
        batch_op.drop_column('ip_whitelist') 
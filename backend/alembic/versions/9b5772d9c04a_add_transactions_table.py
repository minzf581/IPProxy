"""add transactions table

Revision ID: 9b5772d9c04a
Revises: 3726f72571f5
Create Date: 2024-03-21 12:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from datetime import datetime

# revision identifiers, used by Alembic.
revision: str = '9b5772d9c04a'
down_revision: Union[str, None] = '3726f72571f5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 创建交易表
    op.create_table('transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('transaction_no', sa.String(32), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('agent_id', sa.Integer(), nullable=False),
        sa.Column('order_no', sa.String(32), nullable=False),
        sa.Column('amount', sa.DECIMAL(10,2), nullable=False),
        sa.Column('balance', sa.DECIMAL(10,2), nullable=False),
        sa.Column('type', sa.String(20), nullable=False),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('remark', sa.Text()),
        sa.Column('created_at', sa.TIMESTAMP(), default=datetime.now),
        sa.Column('updated_at', sa.TIMESTAMP(), default=datetime.now, onupdate=datetime.now),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.ForeignKeyConstraint(['agent_id'], ['users.id'], ),
        sa.UniqueConstraint('transaction_no')
    )
    op.create_index('ix_transactions_transaction_no', 'transactions', ['transaction_no'])
    op.create_index('ix_transactions_user_id', 'transactions', ['user_id'])
    op.create_index('ix_transactions_agent_id', 'transactions', ['agent_id'])
    op.create_index('ix_transactions_order_no', 'transactions', ['order_no'])
    op.create_index('ix_transactions_type', 'transactions', ['type'])
    op.create_index('ix_transactions_status', 'transactions', ['status'])

def downgrade() -> None:
    op.drop_table('transactions')

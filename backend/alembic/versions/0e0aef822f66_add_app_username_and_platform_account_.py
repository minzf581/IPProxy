"""add app_username and platform_account to user model

Revision ID: 0e0aef822f66
Revises: e6b45db80ea4
Create Date: 2025-02-13 19:25:08.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector
from alembic.operations import BatchOperations
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey

# revision identifiers, used by Alembic.
revision: str = '0e0aef822f66'
down_revision: Union[str, None] = 'e6b45db80ea4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 添加唯一约束
    with op.batch_alter_table('users') as batch_op:
        batch_op.create_unique_constraint('uq_users_app_username', ['app_username'])
        batch_op.create_unique_constraint('uq_users_platform_account', ['platform_account'])


def downgrade() -> None:
    # 删除唯一约束
    with op.batch_alter_table('users') as batch_op:
        batch_op.drop_constraint('uq_users_platform_account', type_='unique')
        batch_op.drop_constraint('uq_users_app_username', type_='unique')

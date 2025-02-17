"""
更新用户信息脚本
==============

此脚本用于更新用户的app_username和platform_account字段。

使用方法：
python3 scripts/update_user.py
"""

import os
import sys
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from app.database import SessionLocal
from app.models.user import User
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def update_user():
    """更新用户信息"""
    db = SessionLocal()
    try:
        # 获取ID为6的用户
        user = db.query(User).filter(User.id == 6).first()
        if not user:
            logger.error("未找到ID为6的用户")
            return
        
        # 更新用户信息
        user.app_username = "agent3"  # 设置app_username
        user.platform_account = "agent3"  # 设置platform_account
        user.is_agent = True  # 确保是代理商
        user.status = 1  # 确保状态为激活
        
        # 提交更改
        db.commit()
        logger.info(f"用户信息更新成功: ID={user.id}, username={user.username}, "
                   f"app_username={user.app_username}, platform_account={user.platform_account}, "
                   f"is_agent={user.is_agent}, status={user.status}")
        
    except Exception as e:
        logger.error(f"更新用户信息失败: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_user() 
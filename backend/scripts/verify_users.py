"""
验证用户脚本
==========

此脚本用于验证数据库中的用户是否正确创建
"""

import os
import sys
import logging
from pathlib import Path
from sqlalchemy.orm import Session

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from app.database import SessionLocal
from app.models.user import User
from app.models.agent_price import AgentPrice
from app.core.security import verify_password

# 配置日志
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def verify_users(db: Session):
    """验证用户账号和密码"""
    try:
        # 验证管理员账号
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            logger.error("找不到管理员账号")
            return False
            
        logger.debug(f"开始验证管理员密码")
        if not verify_password("admin123", admin.password):
            logger.error("管理员密码验证失败")
            return False
        logger.info("管理员账号验证成功")

        # 验证代理商账号
        agent = db.query(User).filter(User.username == "agent").first()
        if not agent:
            logger.error("找不到代理商账号")
            return False
            
        logger.debug(f"开始验证代理商密码")
        if not verify_password("agent123", agent.password):
            logger.error("数据库用户验证失败")
            return False
        logger.info("代理商账号验证成功")

        return True
        
    except Exception as e:
        logger.error(f"验证过程发生错误: {str(e)}")
        logger.exception("详细错误信息:")
        return False

def main():
    """主函数"""
    db = SessionLocal()
    try:
        if verify_users(db):
            logger.info("所有用户验证成功")
            sys.exit(0)
        else:
            logger.error("用户验证失败")
            sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()
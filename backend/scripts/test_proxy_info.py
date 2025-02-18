"""
测试代理信息获取脚本
=================

此脚本用于测试不同的用户名组合，以找出正确的参数组合。
"""

import asyncio
import sys
from pathlib import Path
import logging
from app.services.proxy_service import ProxyService
from app.database import SessionLocal
from app.models.user import User
from app.models.main_user import MainUser

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(name)s] %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

async def test_combination(proxy_service: ProxyService, username: str, app_username: str):
    """测试一个用户名组合"""
    try:
        params = {
            "username": username,
            "appUsername": app_username,
            "proxyType": 104,
            "productNo": "out_dynamic_1"
        }
        
        logger.info(f"测试组合: username={username}, appUsername={app_username}")
        response = await proxy_service._make_request(
            "api/open/app/proxy/info/v2",
            params
        )
        
        logger.info(f"响应: {response}")
        return response
    except Exception as e:
        logger.error(f"测试失败: {str(e)}")
        return None

async def main():
    """主函数"""
    try:
        logger.info("开始测试代理信息获取...")
        
        # 初始化数据库会话
        db = SessionLocal()
        
        # 获取所有可能的用户名
        main_user = db.query(MainUser).first()
        agent = db.query(User).filter(
            User.username == "agent1",
            User.is_agent == True
        ).first()
        
        if not main_user or not agent:
            logger.error("未找到主账号或代理商信息")
            return
        
        # 所有可能的用户名组合
        combinations = [
            # 组合1：主账号的用户名
            (main_user.username, main_user.app_username),
            # 组合2：代理商的IPIPV用户名和主账号的app_username
            (agent.ipipv_username, main_user.app_username),
            # 组合3：主账号的username和代理商的app_username
            (main_user.username, agent.app_username),
            # 组合4：代理商的IPIPV用户名和app_username
            (agent.ipipv_username, agent.app_username),
            # 组合5：代理商的app_username和主账号的username
            (agent.app_username, main_user.username),
            # 组合6：主账号的app_username和代理商的IPIPV用户名
            (main_user.app_username, agent.ipipv_username),
        ]
        
        # 初始化代理服务
        proxy_service = ProxyService()
        
        # 测试所有组合
        for username, app_username in combinations:
            logger.info("="*50)
            logger.info(f"测试组合:")
            logger.info(f"username: {username}")
            logger.info(f"appUsername: {app_username}")
            
            response = await test_combination(proxy_service, username, app_username)
            
            logger.info("="*50)
            logger.info("")  # 空行分隔
        
        logger.info("测试完成!")
        
    except Exception as e:
        logger.error(f"测试过程中出错: {str(e)}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(main()) 
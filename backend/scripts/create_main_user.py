"""
创建主账号脚本
==============

此脚本用于创建 IPIPV 平台的主账号。

使用方法：
python3 scripts/create_main_user.py
"""

import os
import sys
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from app.database import SessionLocal
from app.models.main_user import MainUser
from app.services.ipipv_base_api import IPIPVBaseAPI
from app.core.config import settings
import logging
import asyncio
import json

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def create_main_user():
    """创建主账号"""
    db = SessionLocal()
    try:
        # 检查是否已存在主账号
        main_user = db.query(MainUser).filter(MainUser.username == settings.IPPROXY_MAIN_USERNAME).first()
        if main_user:
            logger.info("主账号已存在:", main_user.app_username)
            return

        # 创建 IPIPV API 实例
        ipipv_api = IPIPVBaseAPI()

        # 构建请求参数
        request_params = {
            "version": "v2",
            "encrypt": "AES",
            "appUsername": settings.IPPROXY_MAIN_USERNAME,
            "password": settings.IPPROXY_MAIN_PASSWORD,
            "phone": settings.IPPROXY_MAIN_PHONE,
            "email": settings.IPPROXY_MAIN_EMAIL,
            "authType": settings.IPPROXY_MAIN_AUTH_TYPE,
            "authName": settings.IPPROXY_MAIN_AUTH_NAME,
            "no": settings.IPPROXY_MAIN_AUTH_NO,
            "status": settings.IPPROXY_MAIN_STATUS,
            "mainUsername": settings.IPPROXY_MAIN_USERNAME,
            "appMainUsername": settings.IPPROXY_MAIN_USERNAME,
            "platformAccount": settings.IPPROXY_MAIN_USERNAME,
            "channelAccount": settings.IPPROXY_MAIN_USERNAME,
            "limitFlow": 1024 * 1024  # 1TB流量
        }

        logger.info("开始调用 IPIPV API 创建主账号...")
        logger.info(f"请求参数: {json.dumps(request_params, ensure_ascii=False, indent=2)}")

        # 调用 IPIPV API 创建主账号
        response = await ipipv_api._make_request(
            "api/open/app/user/v2",
            request_params
        )

        logger.info(f"IPIPV API 响应: {json.dumps(response, ensure_ascii=False, indent=2)}")

        if response and response.get("code") == 200:
            # 获取 IPIPV API 返回的数据
            ipipv_data = response.get("data", {})
            
            # 创建主账号记录
            main_user = MainUser(
                username=ipipv_data.get("username", settings.IPPROXY_MAIN_USERNAME),
                app_username=ipipv_data.get("appUsername", settings.IPPROXY_MAIN_USERNAME),
                password=settings.IPPROXY_MAIN_PASSWORD,
                phone=settings.IPPROXY_MAIN_PHONE,
                email=settings.IPPROXY_MAIN_EMAIL,
                auth_type=settings.IPPROXY_MAIN_AUTH_TYPE,
                auth_name=settings.IPPROXY_MAIN_AUTH_NAME,
                auth_no=settings.IPPROXY_MAIN_AUTH_NO,
                status=settings.IPPROXY_MAIN_STATUS
            )
            
            db.add(main_user)
            db.commit()
            logger.info("主账号创建成功: %s", main_user.app_username)
            logger.info("IPIPV API 返回数据: %s", json.dumps(ipipv_data, ensure_ascii=False, indent=2))
        else:
            error_msg = response.get("msg") if response else "未知错误"
            logger.error("创建主账号失败: %s", error_msg)
            
    except Exception as e:
        logger.error("创建主账号失败: %s", str(e))
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(create_main_user()) 
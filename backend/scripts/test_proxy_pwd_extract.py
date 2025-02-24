"""
测试账密提取流程
=============

此脚本用于测试完整的账密提取流程，包括：
1. 创建主账号
2. 创建子账号
3. 开通代理实例
4. 使用子账号进行账密提取
"""

import os
import sys
from pathlib import Path

# 添加项目根目录到 Python 路径
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)
sys.path.append(PROJECT_ROOT)

import asyncio
import logging
from app.services.proxy_service import ProxyService
from app.database import SessionLocal
from app.models.user import User
from app.core.config import settings
import json
import time
import random
import string

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(name)s] %(levelname)s: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

def generate_random_username(prefix: str = "test_user_") -> str:
    """生成随机用户名"""
    random_num = ''.join(random.choices(string.digits, k=4))
    return f"{prefix}{random_num}"

def generate_order_num() -> str:
    """生成订单号"""
    return f"TEST_{int(time.time())}_{random.randint(1000, 9999)}"

async def create_main_user(proxy_service: ProxyService) -> dict:
    """创建主账号
    
    Returns:
        dict: 包含主账号信息的字典
    """
    try:
        username = generate_random_username("test_main_")
        password = "12345678"  # 使用固定密码便于测试
        
        params = {
            "appUsername": username,
            "password": password,
            "version": "v2"
        }
        
        logger.info("="*50)
        logger.info("开始创建主账号")
        logger.info(f"用户名: {username}")
        logger.info(f"请求参数: {json.dumps(params, ensure_ascii=False)}")
        
        response = await proxy_service._make_request(
            "api/open/app/user/v2",
            params
        )
        
        if not response or response.get("code") not in [0, 200]:
            error_msg = response.get("msg", "未知错误") if response else "无响应"
            logger.error(f"创建主账号失败: {error_msg}")
            return None
            
        logger.info(f"创建主账号响应: {json.dumps(response, ensure_ascii=False)}")
        
        # 从响应中获取内部用户名
        internal_username = response.get("data", {}).get("username")
        if not internal_username:
            logger.error("响应中未包含内部用户名")
            return None
            
        return {
            "app_username": username,
            "username": internal_username,  # 添加内部用户名
            "password": password,
            "response": response
        }
        
    except Exception as e:
        logger.error(f"创建主账号异常: {str(e)}")
        return None

async def create_sub_user(proxy_service: ProxyService, main_user: dict) -> dict:
    """创建子账号
    
    Args:
        proxy_service: 代理服务实例
        main_user: 主账号信息字典
        
    Returns:
        dict: 包含子账号信息的字典
    """
    try:
        username = generate_random_username("test_sub_")
        
        params = {
            "appUsername": username,
            "appMainUsername": main_user["app_username"],
            "mainUsername": main_user["username"],  # 使用内部用户名
            "limitFlow": 200,  # 限制流量200GB
            "status": 1,
            "remark": "Auto created proxy user",
            "version": "v2"
        }
        
        logger.info("="*50)
        logger.info("开始创建子账号")
        logger.info(f"子账号: {username}")
        logger.info(f"主账号: {main_user['username']}")
        logger.info(f"请求参数: {json.dumps(params, ensure_ascii=False)}")
        
        # 先等待1秒，确保主账号创建完成
        await asyncio.sleep(1)
        
        response = await proxy_service._make_request(
            "api/open/app/proxy/user/v2",
            params
        )
        
        if not response or response.get("code") not in [0, 200]:
            error_msg = response.get("msg", "未知错误") if response else "无响应"
            logger.error(f"创建子账号失败: {error_msg}")
            return None
            
        logger.info(f"创建子账号响应: {json.dumps(response, ensure_ascii=False)}")
        
        # 从响应中获取内部用户名
        internal_username = response.get("data", {}).get("username")
        if not internal_username:
            logger.error("响应中未包含子账号内部用户名")
            return None
            
        # 等待1秒，确保子账号创建完成
        await asyncio.sleep(1)
        
        return {
            "app_username": username,
            "username": internal_username,  # 添加内部用户名
            "main_username": main_user["username"],
            "response": response
        }
        
    except Exception as e:
        logger.error(f"创建子账号异常: {str(e)}")
        return None

async def open_dynamic_instance(proxy_service: ProxyService, main_user: dict) -> dict:
    """开通动态代理实例
    
    Args:
        proxy_service: 代理服务实例
        main_user: 主账号信息字典
        
    Returns:
        dict: 开通结果
    """
    try:
        params = {
            "appOrderNo": generate_order_num(),
            "params": [{
                "productNo": "out_dynamic_1",
                "proxyType": 104,
                "appUsername": main_user["app_username"],  # 使用appUsername而不是内部username
                "flow": 300,
                "unit": 1,
                "duration": 1
            }]
        }
        
        logger.info("="*50)
        logger.info(f"开始开通动态代理实例")
        logger.info(f"用户名: {main_user['app_username']}")
        logger.info(f"请求参数: {json.dumps(params, ensure_ascii=False)}")
        
        response = await proxy_service._make_request(
            "api/open/app/instance/open/v2",
            params
        )
        
        if not response or response.get("code") not in [0, 200]:
            error_msg = response.get("msg", "未知错误") if response else "无响应"
            logger.error(f"开通实例失败: {error_msg}")
            return None
            
        logger.info(f"开通实例响应: {json.dumps(response, ensure_ascii=False)}")
        return response
        
    except Exception as e:
        logger.error(f"开通动态代理实例异常: {str(e)}")
        return None

async def extract_proxy_by_pwd(proxy_service: ProxyService, sub_user: dict, main_user: dict) -> dict:
    """使用子账号进行账密提取
    
    Args:
        proxy_service: 代理服务实例
        sub_user: 子账号信息字典
        main_user: 主账号信息字典
        
    Returns:
        dict: 提取结果
    """
    try:
        params = {
            "appUsername": sub_user["app_username"],  # 使用子账号的应用用户名
            "mainUsername": main_user["app_username"],  # 使用主账号的应用用户名
            "proxyType": 104,
            "num": 1,
            "validTime": 5,  # 5分钟有效期
            "version": "v2",
            "productNo": "out_dynamic_1"
        }
        
        logger.info("="*50)
        logger.info("开始账密提取")
        logger.info(f"子账号: {sub_user['app_username']}")
        logger.info(f"主账号: {main_user['app_username']}")
        logger.info(f"请求参数: {json.dumps(params, ensure_ascii=False)}")
        
        response = await proxy_service._make_request(
            "api/open/app/proxy/draw/pwd/v2",
            params
        )
        
        if not response or response.get("code") not in [0, 200]:
            error_msg = response.get("msg", "未知错误") if response else "无响应"
            logger.error(f"账密提取失败: {error_msg}")
            return None
            
        logger.info(f"账密提取响应: {json.dumps(response, ensure_ascii=False)}")
        return response
        
    except Exception as e:
        logger.error(f"账密提取异常: {str(e)}")
        return None

async def main():
    """主函数"""
    try:
        proxy_service = ProxyService()
        
        # 1. 创建主账号
        main_user = await create_main_user(proxy_service)
        if not main_user:
            logger.error("创建主账号失败，终止测试")
            return
            
        # 等待5秒，确保主账号完全创建成功
        logger.info("等待5秒钟，确保主账号创建完成...")
        await asyncio.sleep(5)
        
        # 2. 创建子账号
        sub_user = await create_sub_user(proxy_service, main_user)
        if not sub_user:
            logger.error("创建子账号失败，终止测试")
            return
        
        # 等待5秒，确保子账号创建完成
        logger.info("等待5秒钟，确保子账号创建完成...")
        await asyncio.sleep(5)
        
        # 3. 开通代理实例
        instance = await open_dynamic_instance(proxy_service, main_user)
        if not instance:
            logger.error("开通代理实例失败，终止测试")
            return
        
        # 等待5秒钟，确保实例开通完成
        logger.info("等待5秒钟，确保实例开通完成...")
        await asyncio.sleep(5)
        
        # 4. 使用子账号进行账密提取
        extract_result = await extract_proxy_by_pwd(proxy_service, sub_user, main_user)
        if not extract_result:
            logger.error("账密提取失败")
            return
        
        logger.info("="*50)
        logger.info("测试完成!")
        logger.info(f"主账号: {main_user['username']}")
        logger.info(f"子账号: {sub_user['username']}")
        logger.info("提取结果:")
        logger.info(json.dumps(extract_result, ensure_ascii=False, indent=2))
        
    except Exception as e:
        logger.error(f"测试过程发生异常: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main()) 
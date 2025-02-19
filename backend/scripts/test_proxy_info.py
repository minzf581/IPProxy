"""
测试新创建用户开通代理实例
=================

此脚本用于测试新创建的用户开通代理实例的完整流程。
"""

import asyncio
import sys
from pathlib import Path
import logging
from app.services.proxy_service import ProxyService
from app.database import SessionLocal
from app.models.user import User
from app.models.main_user import MainUser
from app.config import settings
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

async def create_new_user(proxy_service: ProxyService) -> dict:
    """创建新用户
    
    Returns:
        dict: 包含新用户信息的字典
    """
    try:
        username = generate_random_username()
        password = "12345678"  # 使用固定密码便于测试
        
        params = {
            "appUsername": username,
            "password": password,
            "version": "v2"
        }
        
        logger.info("="*50)
        logger.info("开始创建新用户")
        logger.info(f"用户名: {username}")
        logger.info(f"请求参数: {json.dumps(params, ensure_ascii=False)}")
        
        response = await proxy_service._make_request(
            "api/open/app/user/v2",
            params
        )
        
        if not response:
            logger.error("创建用户失败: 无响应")
            return None
            
        if response.get("code") not in [0, 200]:
            error_msg = response.get("msg", "未知错误")
            logger.error(f"创建用户失败: {error_msg}")
            return None
            
        logger.info(f"创建用户响应: {json.dumps(response, ensure_ascii=False)}")
        
        # 从响应中提取用户信息
        user_data = response.get("data", {})
        if isinstance(user_data, str):
            # 如果data是字符串，可能需要解密或解析
            logger.info("需要处理加密的用户数据")
            # 这里假设ProxyService会自动处理解密
        
        return {
            "app_username": username,
            "password": password,
            "response": response
        }
        
    except Exception as e:
        logger.error(f"创建用户异常: {str(e)}")
        return None

async def verify_user_status(proxy_service: ProxyService, username: str) -> bool:
    """验证用户状态
    
    Args:
        proxy_service: 代理服务实例
        username: 用户名
        
    Returns:
        bool: 用户是否可用
    """
    try:
        params = {
            "appUsername": username,
            "version": "v2"
        }
        
        logger.info("="*50)
        logger.info(f"验证用户状态: {username}")
        logger.info(f"请求参数: {json.dumps(params, ensure_ascii=False)}")
        
        response = await proxy_service._make_request(
            "api/open/app/user/v2",
            params
        )
        
        if not response:
            logger.error("验证用户状态失败: 无响应")
            return False
            
        if response.get("code") not in [0, 200]:
            error_msg = response.get("msg", "未知错误")
            logger.error(f"验证用户状态失败: {error_msg}")
            return False
            
        logger.info(f"用户状态响应: {json.dumps(response, ensure_ascii=False)}")
        
        # 检查用户状态
        user_data = response.get("data", {})
        if isinstance(user_data, dict):
            status = user_data.get("status")
            auth_status = user_data.get("authStatus")
            logger.info(f"用户状态: status={status}, authStatus={auth_status}")
            return status == 1
            
        return True
        
    except Exception as e:
        logger.error(f"验证用户状态异常: {str(e)}")
        return False

async def open_dynamic_instance(proxy_service: ProxyService, username: str) -> dict:
    """开通动态代理实例"""
    try:
        app_order_no = f"TEST_{int(time.time())}_{random.randint(1000, 9999)}"
        
        params = {
            "appOrderNo": app_order_no,
            "params": [{
                "productNo": "out_dynamic_1",
                "proxyType": 104,
                "appUsername": username,
                "flow": 300,
                "duration": 1,
                "unit": 1
            }]
        }
        
        logger.info("="*50)
        logger.info(f"开始开通动态代理实例: {username}")
        logger.info(f"请求参数: {json.dumps(params, ensure_ascii=False)}")
        
        response = await proxy_service._make_request(
            "api/open/app/instance/open/v2",
            params
        )
        
        if not response:
            logger.error("开通实例失败: 无响应")
            return None
            
        if response.get("code") not in [0, 200]:
            error_msg = response.get("msg", "未知错误")
            logger.error(f"开通实例失败: {error_msg}")
            return None
            
        logger.info(f"开通实例响应: {json.dumps(response, ensure_ascii=False)}")
        return response
        
    except Exception as e:
        logger.error(f"开通动态代理实例异常: {str(e)}")
        return None

async def check_order_status(proxy_service: ProxyService, order_no: str) -> dict:
    """检查订单状态"""
    try:
        params = {
            "orderNo": order_no,
            "version": "v2"
        }
        
        logger.info("="*50)
        logger.info(f"开始查询订单状态: {order_no}")
        logger.info(f"请求参数: {json.dumps(params, ensure_ascii=False)}")
        
        response = await proxy_service._make_request(
            "api/open/app/order/v2",
            params
        )
        
        if not response:
            logger.error("查询订单状态失败: 无响应")
            return None
            
        if response.get("code") not in [0, 200]:
            error_msg = response.get("msg", "未知错误")
            logger.error(f"查询订单状态失败: {error_msg}")
            return None
            
        logger.info(f"订单状态响应: {json.dumps(response, ensure_ascii=False)}")
        return response
        
    except Exception as e:
        logger.error(f"查询订单状态异常: {str(e)}")
        return None

async def draw_proxy(proxy_service: ProxyService, username: str) -> dict:
    """测试代理提取API
    
    Args:
        proxy_service: 代理服务实例
        username: 用户名
        
    Returns:
        dict: 代理提取响应
    """
    try:
        params = {
            "appUsername": username,
            "addressCode": "",  # 可选
            "sessTime": "5",    # 默认5分钟
            "num": 1,           # 默认1个
            "proxyType": 104,   # 动态国外
            "maxFlowLimit": 0,  # 可选
            "productNo": "out_dynamic_1"  # 产品编号
        }
        
        logger.info("="*50)
        logger.info(f"开始提取代理: {username}")
        logger.info(f"请求参数: {json.dumps(params, ensure_ascii=False)}")
        
        response = await proxy_service._make_request(
            "api/open/app/proxy/draw/api/v2",
            params
        )
        
        if not response:
            logger.error("提取代理失败: 无响应")
            return None
            
        if response.get("code") not in [0, 200]:
            error_msg = response.get("msg", "未知错误")
            logger.error(f"提取代理失败: {error_msg}")
            return None
            
        logger.info(f"提取代理响应: {json.dumps(response, ensure_ascii=False)}")
        return response
        
    except Exception as e:
        logger.error(f"提取代理异常: {str(e)}")
        return None

async def test_new_user_instance(proxy_service: ProxyService) -> dict:
    """测试新用户开通实例的完整流程
    
    Returns:
        dict: 测试结果
    """
    try:
        # 1. 创建新用户
        user_info = await create_new_user(proxy_service)
        if not user_info:
            logger.error("创建用户失败")
            return None
            
        username = user_info["app_username"]
        logger.info(f"成功创建用户: {username}")
        
        # 2. 验证用户状态
        if not await verify_user_status(proxy_service, username):
            logger.error(f"用户 {username} 状态验证失败")
            return None
            
        # 3. 开通实例
        instance_response = await open_dynamic_instance(proxy_service, username)
        if not instance_response:
            logger.error(f"用户 {username} 开通实例失败")
            return None
            
        # 4. 查询订单状态
        order_no = instance_response.get("data", {}).get("orderNo")
        if order_no:
            order_status = await check_order_status(proxy_service, order_no)
            if not order_status:
                logger.error(f"查询订单 {order_no} 状态失败")
                
        # 5. 测试代理提取
        proxy_response = await draw_proxy(proxy_service, username)
        if not proxy_response:
            logger.error(f"用户 {username} 提取代理失败")
        
        return {
            "user_info": user_info,
            "instance_response": instance_response,
            "proxy_response": proxy_response
        }
        
    except Exception as e:
        logger.error(f"测试过程中出错: {str(e)}")
        return None

async def main():
    """主函数"""
    try:
        logger.info("开始测试新用户开通实例...")
        
        # 初始化代理服务
        proxy_service = ProxyService()
        
        # 测试一个新用户
        result = await test_new_user_instance(proxy_service)
        if not result:
            logger.error("测试失败")
            return
            
        # 输出测试结果
        logger.info("\n测试结果:")
        logger.info("="*50)
        
        user_info = result["user_info"]
        instance_response = result["instance_response"]
        proxy_response = result["proxy_response"]
        
        logger.info(f"\n用户信息:")
        logger.info(f"应用用户名: {user_info['app_username']}")
        
        if instance_response:
            order_no = instance_response.get("data", {}).get("orderNo")
            logger.info(f"订单号: {order_no}")
            
        if proxy_response:
            logger.info(f"代理提取响应: {json.dumps(proxy_response, ensure_ascii=False)}")
            
        logger.info("\n测试完成!")
        
    except Exception as e:
        logger.error(f"测试过程中出错: {str(e)}")
        logger.exception(e)

if __name__ == "__main__":
    asyncio.run(main())
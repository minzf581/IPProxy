"""
测试代理信息获取脚本
=================

此脚本用于测试不同的用户名组合，以找出正确的参数组合。
同时测试开通动态代理实例的功能。
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

def generate_order_no(app_username: str) -> str:
    """生成订单号
    
    格式: {appUsername}_{timestamp}_{random}
    示例: test1006_1677123456_1234
    
    Args:
        app_username: 应用用户名
        
    Returns:
        str: 生成的订单号
    """
    timestamp = int(time.time())
    random_num = random.randint(1000, 9999)
    return f"{app_username}_{timestamp}_{random_num}"

async def verify_account(proxy_service: ProxyService, app_username: str) -> bool:
    """验证账号是否有效
    
    Args:
        proxy_service: 代理服务实例
        app_username: 应用用户名
        
    Returns:
        bool: 账号是否有效
    """
    try:
        if not app_username:
            logger.error("应用用户名为空")
            return False
            
        # 查询用户信息
        params = {
            "appUsername": app_username,
            "version": "v2"
        }
        
        logger.info(f"验证账号: {app_username}")
        logger.info(f"请求参数: {json.dumps(params, ensure_ascii=False)}")
        
        response = await proxy_service._make_request(
            "api/open/app/user/v2",
            params
        )
        
        if not response:
            logger.error(f"账号验证失败: 无响应")
            return False
            
        if response.get("code") not in [0, 200]:
            error_msg = response.get("msg", "未知错误")
            logger.warning(f"账号验证失败: {app_username}, 错误: {error_msg}")
            return False
            
        logger.info(f"账号验证成功: {app_username}")
        return True
            
    except Exception as e:
        logger.error(f"账号验证异常: {str(e)}")
        return False

async def open_dynamic_instance(proxy_service: ProxyService, app_username: str = "test_son_1001"):
    """开通动态代理实例"""
    try:
        # 首先验证账号
        if not await verify_account(proxy_service, app_username):
            logger.error(f"账号验证失败，无法开通实例: {app_username}")
            return None
            
        # 使用固定的订单号
        app_order_no = "TEST20240726094927"
        
        # 请求参数
        params = {
            "appOrderNo": app_order_no,
            "params": [{
                "productNo": "out_dynamic_1",
                "proxyType": 104,
                "appUsername": app_username,
                "flow": 300,
                "duration": 1,
                "unit": 1  # 修改为1（天）
            }]
        }
        
        logger.info("="*50)
        logger.info("开始开通动态代理实例")
        logger.info(f"使用系统分配的用户名: {app_username}")
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
            
        logger.info(f"开通响应: {json.dumps(response, ensure_ascii=False)}")
        logger.info("="*50)
        
        return response
        
    except Exception as e:
        logger.error(f"开通动态代理实例异常: {str(e)}")
        return None

async def create_proxy_user(proxy_service: ProxyService, main_user: MainUser) -> dict:
    """创建代理商子账号
    
    Args:
        proxy_service: 代理服务实例
        main_user: 主账号信息
        
    Returns:
        dict: 创建结果
    """
    try:
        # 确保主账号存在且已认证
        if not main_user or not main_user.username:
            logger.error("主账号不存在或未认证")
            return None
            
        params = {
            "appUsername": "test_son_1001",
            "password": "12345678",
            "limitFlow": 2000,  # 修改为2000MB
            "appMainUsername": main_user.app_username,  # 使用主账号的 app_username
            "mainUsername": main_user.username,         # 使用主账号的 IPIPV 用户名
            "remark": "测试子账号",
            "status": 1,
            "platformAccount": main_user.app_username,
            "channelAccount": main_user.app_username,
            "authType": settings.IPPROXY_MAIN_AUTH_TYPE,
            "authName": settings.IPPROXY_MAIN_AUTH_NAME,
            "no": settings.IPPROXY_MAIN_AUTH_NO,
            "version": "v2"  # 添加版本号
        }
        
        logger.info("="*50)
        logger.info("开始创建代理商子账号")
        logger.info(f"请求参数: {json.dumps(params, ensure_ascii=False)}")
        
        response = await proxy_service._make_request(
            "api/open/app/proxy/user/v2",
            params
        )
        
        if not response:
            logger.error("创建子账号失败: 无响应")
            return None
            
        if response.get("code") not in [0, 200]:
            error_msg = response.get("msg", "未知错误")
            logger.error(f"创建子账号失败: {error_msg}")
            return None
            
        logger.info(f"创建响应: {json.dumps(response, ensure_ascii=False)}")
        logger.info("="*50)
        
        return response
        
    except Exception as e:
        logger.error(f"创建代理商子账号异常: {str(e)}")
        return None

async def test_combination(proxy_service: ProxyService, username: str, app_username: str):
    """测试一个用户名组合"""
    try:
        # 验证参数
        if not username or not app_username:
            logger.error("用户名参数无效")
            return None
            
        params = {
            "username": username,
            "appUsername": app_username,
            "proxyType": 104,
            "productNo": "out_dynamic_1",
            "version": "v2"  # 添加版本号
        }
        
        logger.info(f"测试组合: username={username}, appUsername={app_username}")
        logger.info(f"请求参数: {json.dumps(params, ensure_ascii=False)}")
        
        response = await proxy_service._make_request(
            "api/open/app/proxy/info/v2",
            params
        )
        
        if not response:
            logger.error("查询资源失败: 无响应")
            return None
            
        if response.get("code") not in [0, 200]:
            error_msg = response.get("msg", "未知错误")
            logger.warning(f"查询资源失败: {error_msg}")
            
        logger.info(f"响应: {json.dumps(response, ensure_ascii=False)}")
        return response
        
    except Exception as e:
        logger.error(f"测试组合异常: {str(e)}")
        return None

async def retry_query_resources(proxy_service: ProxyService, username: str, app_username: str, max_retries: int = 3):
    """带重试机制的资源查询
    
    Args:
        proxy_service: 代理服务实例
        username: IPIPV平台用户名
        app_username: 应用平台用户名
        max_retries: 最大重试次数
        
    Returns:
        dict: 查询结果
    """
    for attempt in range(max_retries):
        logger.info(f"\n第 {attempt + 1} 次尝试查询资源")
        
        response = await test_combination(proxy_service, username, app_username)
        if response and response.get("code") in [0, 200]:
            data = response.get("data", {})
            # 检查是否有非零资源
            if any(float(data.get(key, 0)) > 0 for key in ["total", "used", "balance"]):
                logger.info("查询到非零资源，返回结果")
                return response
                
        # 最后一次尝试不需要等待
        if attempt < max_retries - 1:
            wait_time = 30  # 等待30秒
            logger.info(f"等待 {wait_time} 秒后重试...")
            await asyncio.sleep(wait_time)
    
    logger.warning(f"经过 {max_retries} 次尝试，仍未查询到非零资源")
    return response  # 返回最后一次查询的结果

async def check_order_status(proxy_service: ProxyService, order_no: str) -> dict:
    """检查订单状态
    
    Args:
        proxy_service: 代理服务实例
        order_no: 订单号
        
    Returns:
        dict: 订单状态信息
    """
    try:
        params = {
            "orderNo": order_no,
            "version": "v2"
        }
        
        logger.info("="*50)
        logger.info("开始查询订单状态")
        logger.info(f"订单号: {order_no}")
        logger.info(f"请求参数: {json.dumps(params, ensure_ascii=False)}")
        
        response = await proxy_service._make_request(
            "api/open/app/order/v2",  # 修改为正确的API路径
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
        logger.info("="*50)
        
        return response
        
    except Exception as e:
        logger.error(f"查询订单状态异常: {str(e)}")
        return None

async def main():
    """主函数"""
    try:
        logger.info("开始测试...")
        
        # 初始化数据库会话
        db = SessionLocal()
        
        try:
            # 获取主账号信息
            main_user = db.query(MainUser).first()
            
            if not main_user:
                logger.error("未找到主账号信息")
                return
                
            # 初始化代理服务
            proxy_service = ProxyService()
            
            # 统一使用 test1006 作为用户名
            app_username = "test1006"
            
            # 1. 先查询开通前的资源状态
            logger.info("\n第一步：查询开通前的资源状态")
            logger.info("="*50)
            
            before_response = await test_combination(proxy_service, app_username, app_username)
            if before_response:
                logger.info(f"开通前资源状态: {json.dumps(before_response.get('data', {}), ensure_ascii=False)}")
            
            # 2. 开通动态代理实例
            logger.info("\n第二步：开通动态代理实例")
            logger.info("="*50)
            
            instance_response = await open_dynamic_instance(proxy_service, app_username)
            if instance_response:
                logger.info(f"开通实例响应: {json.dumps(instance_response, ensure_ascii=False)}")
                
                # 2.1 检查订单状态
                order_no = instance_response.get("data", {}).get("orderNo")
                if order_no:
                    logger.info("\n第二步(补充)：检查订单状态")
                    logger.info("="*50)
                    
                    order_status = await check_order_status(proxy_service, order_no)
                    if order_status:
                        logger.info(f"订单状态: {json.dumps(order_status.get('data', {}), ensure_ascii=False)}")
                
                # 3. 查询资源状态（只查询一次）
                logger.info("\n第三步：查询资源状态")
                logger.info("="*50)
                
                after_response = await test_combination(proxy_service, app_username, app_username)
                if after_response:
                    logger.info(f"资源状态: {json.dumps(after_response.get('data', {}), ensure_ascii=False)}")
            else:
                logger.error("开通动态代理实例失败")
            
            logger.info("\n测试完成!")
            
        finally:
            db.close()
            
    except Exception as e:
        logger.error(f"测试过程中出错: {str(e)}")
        logger.exception(e)  # 打印完整堆栈跟踪

if __name__ == "__main__":
    asyncio.run(main()) 
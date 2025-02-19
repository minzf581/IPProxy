"""
测试代理信息获取脚本
=================

此脚本用于测试代理信息的获取功能，包括：
1. 订单信息获取
2. 资源列表显示
3. 白名单管理

使用方法：
python3 test_proxy_info.py
"""

import os
import sys
from pathlib import Path
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

from app.services.ipipv_base_api import IPIPVBaseAPI
from app.core.config import settings

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ProxyInfoTester(IPIPVBaseAPI):
    """代理信息测试类"""
    
    async def get_order_info(self, order_no: str) -> Dict[str, Any]:
        """
        获取订单信息
        
        Args:
            order_no: 订单号
            
        Returns:
            Dict[str, Any]: 订单信息
        """
        try:
            logger.info(f"开始查询订单状态: {order_no}")
            
            # 构建请求参数
            params = {
                "orderNo": order_no,
                "version": "v2"
            }
            
            logger.info(f"请求参数: {json.dumps(params)}")
            
            # 调用API获取订单信息
            response = await self._make_request(
                "api/open/app/order/v2",
                params
            )
            
            logger.info(f"订单状态响应: {json.dumps(response)}")
            
            if not response or response.get("code") not in [0, 200]:
                error_msg = response.get("msg", "未知错误") if response else "API返回为空"
                logger.error(f"获取订单信息失败: {error_msg}")
                return None
                
            # 处理订单信息
            order_data = response.get("data", {})
            if isinstance(order_data, str):
                try:
                    order_data = json.loads(order_data)
                except json.JSONDecodeError:
                    logger.error(f"解析订单数据失败: {order_data}")
                    return None
            
            # 格式化资源信息
            resources = []
            for instance in order_data.get("instances", []):
                resource = {
                    "productNo": instance.get("productNo", ""),
                    "total": instance.get("flowTotal", 0),
                    "used": instance.get("flowTotal", 0) - instance.get("flowBalance", 0),
                    "balance": instance.get("flowBalance", 0),
                    "ipWhiteList": instance.get("extendIp", "").split(",") if instance.get("extendIp") else [],
                    "ipUsed": 0,  # 需要从其他接口获取
                    "ipTotal": 1,  # 默认值
                    "username": instance.get("username", ""),
                    "password": instance.get("pwd", ""),
                    "instanceNo": instance.get("instanceNo", ""),
                    "status": instance.get("status", 0)
                }
                resources.append(resource)
            
            return {
                "code": 0,
                "msg": "success",
                "data": resources
            }
            
        except Exception as e:
            logger.error(f"获取订单信息失败: {str(e)}")
            return None

async def main():
    """主函数"""
    try:
        tester = ProxyInfoTester()
        
        # 测试获取订单信息
        order_no = "C20250219094459922057"  # 示例订单号
        order_info = await tester.get_order_info(order_no)
        
        if order_info and order_info.get("code") == 0:
            resources = order_info.get("data", [])
            logger.info("\n=== 已购资源列表 ===")
            for resource in resources:
                logger.info(f"""
资源类型: {resource['productNo']}
总流量: {resource['total']} MB
已使用流量: {resource['used']} MB
剩余流量: {resource['balance']} MB
IP白名单: {', '.join(resource['ipWhiteList']) if resource['ipWhiteList'] else '未设置'}
已使用IP数量: {resource['ipUsed']}
总IP数量: {resource['ipTotal']}
状态: {'正常' if resource['status'] == 1 else '异常'}
                """)
        else:
            logger.error("获取订单信息失败")
            
    except Exception as e:
        logger.error(f"测试过程发生错误: {str(e)}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(main()) 
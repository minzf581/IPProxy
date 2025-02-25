"""
代理服务模块
==========

此模块提供代理服务相关的功能，包括：
1. 代理提取
2. 代理管理
3. 订单处理
4. 资源统计

使用示例：
--------
```python
proxy_service = ProxyService()
result = await proxy_service.extract_proxy(params)
```

注意事项：
--------
1. 所有方法都应该使用异步调用
2. 确保正确处理错误情况
3. 添加必要的日志记录
"""

import uuid
import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from decimal import Decimal
from app.models.user import User
from app.models.transaction import Transaction
from app.models.dynamic_order import DynamicOrder
from app.models.static_order import StaticOrder
from app.models.product_inventory import ProductInventory
from app.models.resource_usage import ResourceUsageStatistics
from app.models.area import Area
from app.services.ipipv_base_api import IPIPVBaseAPI
from sqlalchemy.orm import Session
from app.core.security import get_password_hash
import traceback
import time  # 添加 time 模块导入
from app.database import SessionLocal, get_db
from app.core.config import settings
import asyncio
import random
from fastapi import HTTPException

# 添加自定义 JSON 编码器
class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return str(obj)
        return super(DecimalEncoder, self).default(obj)

logger = logging.getLogger(__name__)

class ProxyService(IPIPVBaseAPI):
    """代理服务类，处理所有代理相关的操作"""
    
    async def get_proxy_info(self, proxy_id: str) -> Optional[Dict[str, Any]]:
        """
        获取代理信息
        Args:
            proxy_id: 订单号，可以是appOrderNo或IPIPV平台的orderNo
        """
        try:
            logger.info(f"[ProxyService] 获取代理信息: proxy_id={proxy_id}")
            
            # 从数据库查询订单信息
            db = SessionLocal()
            try:
                # 尝试通过appOrderNo和orderNo两种方式查询
                order = db.query(DynamicOrder).filter(
                    (DynamicOrder.app_order_no == proxy_id) | 
                    (DynamicOrder.order_no == proxy_id)
                ).first()
                
                if order:
                    # 使用IPIPV平台的orderNo查询
                    ipipv_order_no = order.order_no
                else:
                    # 如果数据库中没有找到，直接使用传入的proxy_id
                    ipipv_order_no = proxy_id
                
                # 调用IPIPV API
                response = await self._make_request(
                    "api/open/app/order/v2",
                    {"orderNo": ipipv_order_no, "version": "v2"}
                )
                
                logger.info(f"[ProxyService] API响应: {response}")
                
                if not response:
                    logger.error(f"[ProxyService] API返回空数据: {ipipv_order_no}")
                    return {
                        "code": 404,
                        "msg": "未找到代理信息",
                        "data": None
                    }
                
                # 检查响应状态
                if response.get("code") not in [0, 200]:
                    error_msg = response.get("msg", "未知错误")
                    logger.error(f"[ProxyService] API返回错误: {error_msg}")
                    return {
                        "code": response.get("code", 500),
                        "msg": error_msg,
                        "data": None
                    }
                
                # 如果找到了订单，更新本地数据库的代理信息
                if order and response.get("data"):
                    order.proxy_info = response.get("data")
                    db.commit()
                    logger.info(f"[ProxyService] 更新本地订单代理信息: {ipipv_order_no}")
                
                return {
                    "code": 0,
                    "msg": "success",
                    "data": response.get("data")
                }
                
            except Exception as e:
                logger.error(f"[ProxyService] 数据库操作失败: {str(e)}")
                raise
            finally:
                db.close()
            
        except Exception as e:
            error_msg = f"获取代理信息失败: {str(e)}"
            logger.error(f"[ProxyService] {error_msg}")
            logger.error(traceback.format_exc())
            return {
                "code": 500,
                "msg": error_msg,
                "data": None
            }
            
    async def create_proxy(self, params: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """创建代理"""
        try:
            logger.info(f"[ProxyService] 开始创建代理: {json.dumps(params, ensure_ascii=False)}")
            return await self._make_request("api/open/app/proxy/v2", params)
        except Exception as e:
            logger.error(f"[ProxyService] 创建代理失败: {str(e)}")
            return None
            
    async def update_proxy(self, proxy_id: str, params: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """更新代理信息"""
        try:
            logger.info(f"[ProxyService] 更新代理信息: proxy_id={proxy_id}")
            return await self._make_request(f"api/open/app/proxy/{proxy_id}/v2", params)
        except Exception as e:
            logger.error(f"[ProxyService] 更新代理信息失败: {str(e)}")
            return None
            
    async def delete_proxy(self, proxy_id: str) -> bool:
        """删除代理"""
        try:
            logger.info(f"[ProxyService] 删除代理: proxy_id={proxy_id}")
            result = await self._make_request(f"api/open/app/proxy/{proxy_id}/v2", method="DELETE")
            return result is not None
        except Exception as e:
            logger.error(f"[ProxyService] 删除代理失败: {str(e)}")
            return False
            
    async def get_proxy_list(self, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """获取代理列表"""
        try:
            logger.info(f"[ProxyService] 获取代理列表: {json.dumps(params, ensure_ascii=False)}")
            result = await self._make_request("api/open/app/proxy/list/v2", params)
            return result.get("list", []) if isinstance(result, dict) else []
        except Exception as e:
            logger.error(f"[ProxyService] 获取代理列表失败: {str(e)}")
            return []
            
    async def get_proxy_statistics(self) -> Optional[Dict[str, Any]]:
        """获取代理统计信息"""
        try:
            logger.info("[ProxyService] 获取代理统计信息")
            return await self._make_request("api/open/app/proxy/statistics/v2")
        except Exception as e:
            logger.error(f"[ProxyService] 获取代理统计信息失败: {str(e)}")
            return None

    async def create_dynamic_proxy(self, params: Dict[str, Any], db: Session) -> Optional[Dict[str, Any]]:
        """
        创建动态代理
        
        Args:
            params: 创建参数，包括：
                - poolId: 代理池ID
                - trafficAmount: 流量数量
                - username: 用户名
                - userId: 用户ID
                - agentId: 代理商ID
                - remark: 可选，备注
                
        Returns:
            dict: 创建成功的代理信息
            None: 创建失败
        """
        try:
            logger.info(f"开始创建动态代理: {params}")
            
            # 生成订单号
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            order_no = f"DYN{timestamp}{uuid.uuid4().hex[:6]}"
            app_order_no = f"APP{timestamp}{uuid.uuid4().hex[:6]}"
            
            # 构建API请求参数
            api_params = {
                "appOrderNo": app_order_no,
                "params": [{
                    "productNo": params["poolId"],
                    "proxyType": 104,  # 动态国外代理
                    "appUsername": params["username"],
                    "flow": params["trafficAmount"],
                    "duration": 1,
                    "unit": 1
                }]
            }
            
            # 调用API创建代理
            response = await self._make_request("api/open/app/instance/open/v2", api_params)
            if not response or response.get("code") not in [0, 200]:
                error_msg = response.get("msg", "未知错误") if response else "API调用失败"
                logger.error(f"创建动态代理失败: {error_msg}")
                return None
            
            # 创建订单记录
            order = DynamicOrder(
                id=str(uuid.uuid4()),
                order_no=order_no,
                app_order_no=app_order_no,
                user_id=params["userId"],
                agent_id=params["agentId"],
                pool_type=params["poolId"],
                traffic=params["trafficAmount"],
                unit_price=params.get("unitPrice", 0),
                total_amount=params.get("totalAmount", 0),
                proxy_type="dynamic",
                status="pending",
                remark=params.get("remark", ""),
                proxy_info=response.get("data")
            )
            
            # 获取用户信息
            user = db.query(User).filter(User.id == params["userId"]).first()
            if not user:
                raise Exception("用户不存在")
                
            # 计算订单金额
            order_amount = params.get("totalAmount", 0)
            
            # 检查用户余额是否足够
            if user.balance < order_amount:
                raise Exception("用户余额不足")
                
            # 扣除用户余额
            user.balance -= order_amount
            # 更新用户消费总额
            user.total_consumption += order_amount
            
            # 创建交易记录
            transaction = Transaction(
                transaction_no=f"DYN{datetime.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6]}",
                user_id=user.id,
                agent_id=params["agentId"],
                order_no=order.order_no,
                amount=Decimal(str(order_amount)),
                balance=Decimal(str(user.balance)),
                type="consumption",  # 消费类型
                status="success",
                remark=f"购买动态代理 {params['trafficAmount']}GB"
            )
            db.add(transaction)
            
            # 获取或创建资源使用记录
            usage_stats = db.query(ResourceUsageStatistics).filter(
                ResourceUsageStatistics.user_id == user.id,
                ResourceUsageStatistics.product_no == params["poolId"]
            ).first()
            
            if not usage_stats:
                usage_stats = ResourceUsageStatistics(
                    user_id=user.id,
                    product_no=params["poolId"],
                    resource_type="dynamic",
                    total_amount=params["trafficAmount"],
                    used_amount=0,
                    today_usage=0,
                    month_usage=0,
                    last_month_usage=0
                )
                db.add(usage_stats)
            else:
                usage_stats.total_amount += params["trafficAmount"]
            
            # 添加订单和更新用户信息
            db.add(order)
            db.commit()
            logger.info(f"[ProxyService] 订单创建成功: {order.id}")
            logger.info(f"[ProxyService] 用户余额更新成功: 当前余额={user.balance}")
            
            return {
                "code": 0,
                "msg": "success",
                "data": {
                    "order": order.to_dict(),
                    "api_response": response
                }
            }
        except Exception as e:
            logger.error(f"创建动态代理失败: {str(e)}")
            if 'db' in locals():
                db.rollback()
            return None
    
    async def refresh_proxy(self, proxy_id: str) -> bool:
        """
        刷新代理
        
        Args:
            proxy_id: 代理ID
            
        Returns:
            bool: 是否刷新成功
        """
        try:
            logger.info(f"刷新代理: {proxy_id}")
            result = await self._make_request(
                "api/open/app/proxy/refresh/v2", 
                {"proxyId": proxy_id}
            )
            return result is not None
        except Exception as e:
            logger.error(f"刷新代理失败: {str(e)}")
            return False
    
    async def calculate_price(self, params: Dict[str, Any]) -> Optional[float]:
        """
        计算代理价格
        
        Args:
            params: 计价参数，包括：
                - proxyType: 代理类型
                - duration: 时长
                - amount: 数量
                
        Returns:
            float: 计算得到的价格
            None: 计算失败
        """
        try:
            logger.info(f"计算代理价格: {params}")
            result = await self._make_request(
                "api/open/app/proxy/price/calculate/v2", 
                params
            )
            return float(result["price"]) if result and "price" in result else None
        except Exception as e:
            logger.error(f"计算代理价格失败: {str(e)}")
            return None
    
    async def get_proxy_pools(self) -> List[Dict[str, Any]]:
        """
        获取代理池列表
        
        Returns:
            list: 代理池列表
            空列表: 获取失败
        """
        try:
            logger.info("获取代理池列表")
            result = await self._make_request("api/open/app/proxy/pools/v2")
            return result if isinstance(result, list) else []
        except Exception as e:
            logger.error(f"获取代理池列表失败: {str(e)}")
            return []
    
    async def get_ip_ranges(self, params: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        获取IP范围列表
        
        Args:
            params: 查询参数，包括：
                - regionCode: 区域代码
                - countryCode: 国家代码
                - cityCode: 城市代码
                - staticType: 静态代理类型
                
        Returns:
            list: IP范围列表
            空列表: 获取失败
        """
        try:
            logger.info(f"获取IP范围列表: {params}")
            response = await self._make_request(
                "api/open/app/product/query/v2",
                params
            )
            return response if isinstance(response, list) else []
        except Exception as e:
            logger.error(f"获取IP范围列表失败: {str(e)}")
            return []

    async def query_product(self, params: Dict[str, Any], db: Session) -> Dict[str, Any]:
        """查询产品信息"""
        try:
            logger.info(f"[ProxyService] 开始查询产品: {params}")
            
            # 构建基础查询
            query = db.query(ProductInventory)
            
            # 添加过滤条件
            if "proxyType" in params:
                proxy_type = params["proxyType"]
                if isinstance(proxy_type, list):
                    query = query.filter(ProductInventory.proxy_type.in_(proxy_type))
                else:
                    query = query.filter(ProductInventory.proxy_type == proxy_type)
                
            # 获取产品列表
            products = query.filter(ProductInventory.enable == True).all()
            
            # 格式化响应数据
            formatted_products = []
            for product in products:
                formatted_product = {
                    "productNo": product.product_no,
                    "name": product.product_name,
                    "proxyType": product.proxy_type,
                    "area": product.area_code,
                    "country": product.country_code,
                    "city": product.city_code,
                    "price": float(product.global_price) if product.global_price else 0,
                    "minAgentPrice": float(product.min_agent_price) if product.min_agent_price else 0,
                    "stock": product.inventory,
                    "status": product.enable,
                    "flow": product.flow,
                    "duration": product.duration,
                    "unit": product.unit
                }
                formatted_products.append(formatted_product)
            
            return {
                "code": 0,
                "msg": "success",
                "data": formatted_products
            }
            
        except Exception as e:
            logger.error(f"[ProxyService] 查询产品失败: {str(e)}")
            logger.error(traceback.format_exc())
            return {
                "code": 500,
                "msg": f"查询产品失败: {str(e)}",
                "data": []
            }

    async def create_proxy_user(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        创建代理用户
        Args:
            params: 创建参数，包括：
                - appUsername: 用户名
                - limitFlow: 流量限制（MB）
                - remark: 备注
                - user_id: 用户ID
                - agent_id: 代理商ID
                - password: 可选，密码，默认生成随机密码
        """
        try:
            logger.info(f"[ProxyService] 开始创建代理用户: {json.dumps(params)}")
            
            # 验证必要参数
            if "appUsername" not in params:
                return {
                    "code": 400,
                    "msg": "缺少必要参数: appUsername",
                    "data": None
                }
            
            # 生成随机密码（如果未提供）
            if "password" not in params:
                params["password"] = str(uuid.uuid4())[:8]
            
            # 1. 创建IPIPV用户
            user_params = {
                "appUsername": params["appUsername"],
                "password": params["password"],
                "version": "v2"
            }
            
            logger.info(f"[ProxyService] 创建用户请求参数: {json.dumps(user_params)}")
            
            # 调用IPIPV API创建用户
            user_response = await self._make_request(
                "api/open/app/user/v2",
                user_params
            )
            
            logger.info(f"[ProxyService] IPIPV用户创建响应: {json.dumps(user_response)}")
            
            if not user_response or user_response.get("code") not in [0, 200]:
                error_msg = user_response.get("msg", "未知错误") if user_response else "API返回为空"
                logger.error(f"[ProxyService] 创建IPIPV用户失败: {error_msg}")
                return {
                    "code": user_response.get("code", 500) if user_response else 500,
                    "msg": error_msg,
                    "data": None
                }
            
            # 获取IPIPV返回的用户信息
            ipipv_data = user_response.get("data", {})
            ipipv_username = ipipv_data.get("username")
            if not ipipv_username:
                logger.error("[ProxyService] API返回数据中没有username")
                return {
                    "code": 500,
                    "msg": "API返回数据中没有username",
                    "data": None
                }
            
            # 1.1 进行实名认证
            auth_params = {
                "username": params["username"],
                "appUsername": params["username"],
                "authType": 1,
                "authName": "飞蚁",  # 实名认证名称
                "no": "00000000000",  # 认证号码
                "vsp": "vsp"  # vsp信息
            }
            auth_result = await self._make_request("api/open/app/userAuth/v2", auth_params)
            if auth_result.get("code") not in [0, 200]:
                raise Exception(f"实名认证失败: {auth_result.get('msg')}")
            logger.info(f"[ProxyService] 实名认证成功: {json.dumps(auth_result, ensure_ascii=False)}")
            
            # 等待5秒，确保主账户创建和实名认证完成
            await asyncio.sleep(5)
            logger.info("[ProxyService] 等待5秒后开始创建代理子账户")
            
            # 2. 创建代理子账户
            proxy_user_params = {
                "appUsername": f"{params['username']}son1",
                "limitFlow": params["maxFlowLimit"],
                "appMainUsername": params["username"],  # 使用appMainUsername
                "status": 1,
                "remark": "Auto created proxy user"
            }
            proxy_user_result = await self._make_request("api/open/app/proxy/user/v2", proxy_user_params)
            if proxy_user_result.get("code") not in [0, 200]:
                raise Exception(f"创建代理子账户失败: {proxy_user_result.get('msg')}")
            logger.info(f"[ProxyService] 创建代理子账户成功: {json.dumps(proxy_user_result, ensure_ascii=False)}")
            
            # 3. 开通代理
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            app_order_no = f"TEST_{timestamp}_{random.randint(1000, 9999)}"
            
            open_proxy_params = {
                "appOrderNo": app_order_no,
                "params": [{
                    "productNo": "out_dynamic_1",  # 动态代理产品编号
                    "proxyType": 104,  # 动态国外代理
                    "appUsername": params["username"],
                    "flow": 300,  # 使用固定流量
                    "duration": 1,  # 使用固定时长
                    "unit": 1  # 默认单位
                }]
            }
            open_proxy_result = await self._make_request("api/open/app/instance/open/v2", open_proxy_params)
            if open_proxy_result.get("code") not in [0, 200]:
                raise Exception(f"开通代理失败: {open_proxy_result.get('msg')}")
            logger.info(f"[ProxyService] 开通代理成功: {json.dumps(open_proxy_result, ensure_ascii=False)}")
            
            # 4. 账密提取
            draw_params = {
                "appUsername": params["username"],  # 使用主账号进行提取
                "addressCode": params["addressCode"],
                "sessTime": "5",  # 默认5分钟，使用字符串类型
                "num": 1,
                "proxyType": 104,  # 动态国外代理
                "maxFlowLimit": params["maxFlowLimit"],
                "productNo": "out_dynamic_1"  # 添加必要的产品编号参数
            }
            draw_result = await self._make_request("api/open/app/proxy/draw/pwd/v2", draw_params)
            if draw_result.get("code") not in [0, 200]:
                raise Exception(f"账密提取失败: {draw_result.get('msg')}")
            logger.info(f"[ProxyService] 账密提取成功: {json.dumps(draw_result, ensure_ascii=False)}")
            
            return {
                "code": 0,
                "message": "success",
                "data": {
                    "mainAccount": user_response.get("data"),
                    "authInfo": auth_result.get("data"),
                    "proxyInstance": open_proxy_result.get("data"),
                    "proxyInfo": draw_result.get("data")
                }
            }
            
        except Exception as e:
            error_msg = f"创建代理用户失败: {str(e)}"
            logger.error(f"[ProxyService] {error_msg}")
            logger.error(traceback.format_exc())
            return {
                "code": 500,
                "msg": error_msg,
                "data": None
            }

    async def get_proxy_resources(self, username: str) -> Dict[str, Any]:
        """获取代理资源列表"""
        try:
            logger.info(f"[ProxyService] 开始获取代理资源列表: username={username}")
            
            # 从数据库获取用户信息和订单
            db = SessionLocal()
            try:
                user = db.query(User).filter(User.username == username).first()
                if not user:
                    logger.error(f"[ProxyService] 用户不存在: username={username}")
                    return {
                        "code": 404,
                        "message": "用户不存在",
                        "data": []
                    }
                logger.info(f"[ProxyService] 查询到用户信息: user_id={user.id}, is_agent={user.is_agent}")

                # 查询用户的动态订单
                orders = db.query(DynamicOrder).filter(
                    DynamicOrder.user_id == user.id,
                    DynamicOrder.status == "active"
                ).all()
                
                logger.info(f"[ProxyService] 查询到 {len(orders)} 个活跃订单")
                
                resources = []
                for order in orders:
                    try:
                        # 调用IPIPV API获取订单详情
                        response = await self._make_request(
                            "api/open/app/order/v2",
                            {
                                "orderNo": order.order_no,
                                "version": "v2"
                            }
                        )
                        
                        logger.info(f"[ProxyService] 订单 {order.order_no} API响应: {json.dumps(response, ensure_ascii=False)}")
                        
                        if response and response.get("code") in [0, 200]:
                            proxy_data = response.get("data", {})
                            if proxy_data:
                                resources.append({
                                    "orderNo": order.order_no,
                                    "appOrderNo": order.app_order_no,
                                    "username": user.username,
                                    "ipipvUsername": proxy_data.get("username"),
                                    "password": proxy_data.get("password"),
                                    "proxyIp": proxy_data.get("proxyIp"),
                                    "proxyPort": proxy_data.get("proxyPort"),
                                    "protocol": proxy_data.get("protocol", "1"),
                                    "expireTime": proxy_data.get("expireTime"),
                                    "totalFlow": order.traffic,
                                    "balanceFlow": proxy_data.get("balanceFlow", 0),
                                    "status": proxy_data.get("status", "1"),
                                    "createTime": order.created_at.isoformat() if order.created_at else None
                                })
                        else:
                            logger.error(f"[ProxyService] 获取订单 {order.order_no} 详情失败: {response.get('msg', '未知错误') if response else '空响应'}")
                    except Exception as e:
                        logger.error(f"[ProxyService] 处理订单 {order.order_no} 时发生错误: {str(e)}")
                        continue
                
                logger.info(f"[ProxyService] 成功获取代理资源列表: 数量={len(resources)}")
                
                return {
                    "code": 0,
                    "message": "success",
                    "data": resources
                }
                
            except Exception as e:
                logger.error(f"[ProxyService] 数据库查询失败: {str(e)}")
                raise
            finally:
                db.close()
            
        except Exception as e:
            logger.error(f"[ProxyService] 获取代理资源列表发生异常: {str(e)}")
            logger.error(traceback.format_exc())
            return {
                "code": 500,
                "message": f"获取代理资源列表失败: {str(e)}",
                "data": []
            }

    async def get_purchased_resources(self, order_no: str) -> Dict[str, Any]:
        """
        获取已购资源列表
        
        Args:
            order_no: IPIPV API的订单号
            
        Returns:
            Dict[str, Any]: 资源列表信息
        """
        try:
            logger.info(f"[ProxyService] 开始获取已购资源列表: order_no={order_no}")
            
            # 直接调用IPIPV API查询订单
            response = await self._make_request(
                "api/open/app/order/v2",
                {"orderNo": order_no, "version": "v2"}
            )
            
            logger.info(f"[ProxyService] API响应: {json.dumps(response)}")
            
            if not response or response.get("code") not in [0, 200]:
                error_msg = response.get("msg", "未知错误") if response else "API返回为空"
                logger.error(f"[ProxyService] 获取已购资源列表失败: {error_msg}")
                return {
                    "code": response.get("code", 500) if response else 500,
                    "msg": error_msg,
                    "data": None
                }
            
            return {
                "code": 0,
                "msg": "success",
                "data": response.get("data")
            }
            
        except Exception as e:
            logger.error(f"[ProxyService] 获取已购资源列表失败: {str(e)}")
            logger.error(traceback.format_exc())
            return {
                "code": 500,
                "msg": f"获取已购资源列表失败: {str(e)}",
                "data": None
            }

    async def extract_proxy_by_password(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        通过账密方式提取代理
        
        Args:
            params: 提取参数，包括：
                - appUsername: 渠道商子账号名
                - addressCode: 地址代码
                - sessTime: 会话有效时间（分钟）
                - num: 提取数量
                - proxyType: 代理类型
                - maxFlowLimit: 最大流量限制
                
        Returns:
            Dict[str, Any]: 提取结果
        """
        try:
            logger.info(f"[ProxyService] 开始账密提取代理: {json.dumps(params, ensure_ascii=False)}")
            result = await self._make_request("api/open/app/proxy/draw/pwd/v2", params)
            if result and result.get("code") == 0:
                return {
                    "code": 0,
                    "message": "success",
                    "data": {
                        "url": result.get("data", {}).get("url", "")
                    }
                }
            return {
                "code": result.get("code", 500),
                "message": result.get("msg", "提取失败"),
                "data": None
            }
        except Exception as e:
            error_msg = f"账密提取代理失败: {str(e)}"
            logger.error(f"[ProxyService] {error_msg}")
            logger.error(traceback.format_exc())
            return {
                "code": 500,
                "message": error_msg,
                "data": None
            }

    async def extract_proxy_by_api(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        通过API方式提取代理
        
        Args:
            params: 提取参数，包括：
                - appUsername: 渠道商主账号
                - proxyType: 代理类型
                - num: 提取数量
                - addressCode: 地址代码
                - protocol: 协议类型
                - returnType: 返回数据格式
                - delimiter: 分隔符
                - maxFlowLimit: 最大流量限制
                
        Returns:
            Dict[str, Any]: 提取结果
        """
        try:
            logger.info(f"[ProxyService] 开始API提取代理: {json.dumps(params, ensure_ascii=False)}")
            result = await self._make_request("api/open/app/proxy/draw/api/v2", params)
            if result and result.get("code") == 0:
                return {
                    "code": 0,
                    "message": "success",
                    "data": {
                        "url": result.get("data", {}).get("url", "")
                    }
                }
            return {
                "code": result.get("code", 500),
                "message": result.get("msg", "提取失败"),
                "data": None
            }
        except Exception as e:
            error_msg = f"API提取代理失败: {str(e)}"
            logger.error(f"[ProxyService] {error_msg}")
            logger.error(traceback.format_exc())
            return {
                "code": 500,
                "message": error_msg,
                "data": None
            }

    async def sync_inventory(self, db: Session) -> Dict[str, Any]:
        """
        同步产品库存信息
        
        Args:
            db: 数据库会话
            
        Returns:
            Dict[str, Any]: 同步结果
                - code: 状态码
                - msg: 结果消息
                - data: 同步数据统计
        """
        try:
            logger.info("[ProxyService] 开始同步产品库存")
            
            # 定义要查询的代理类型
            proxy_types = [101, 103, 104, 201]  # 静态云平台、静态国外家庭、动态国外代理、其他动态代理
            
            # 构造请求参数
            params = {
                "proxyType": proxy_types
            }
            
            logger.info(f"[ProxyService] 请求产品库存信息: params={params}")
            
            # 调用API获取库存信息
            response = await self._make_request(
                "api/open/app/product/query/v2",
                params
            )
            
            if not response or response.get("code") not in [0, 200]:
                error_msg = response.get("msg", "未知错误") if response else "API返回为空"
                logger.error(f"[ProxyService] 获取产品库存失败: {error_msg}")
                return {
                    "code": response.get("code", 500) if response else 500,
                    "msg": f"获取产品库存失败: {error_msg}",
                    "data": None
                }
            
            products = response.get("data", [])
            logger.info(f"[ProxyService] 获取到 {len(products)} 个产品信息")
            
            try:
                # 开始数据库事务
                logger.info("[ProxyService] 开始更新数据库中的产品库存信息")
                
                # 删除所有现有库存记录
                delete_count = db.query(ProductInventory).delete()
                logger.info(f"[ProxyService] 已删除 {delete_count} 条旧的库存记录")
                
                # 插入新的库存记录
                new_records = []
                for product in products:
                    inventory = ProductInventory(
                        product_no=product.get("productNo"),
                        product_name=product.get("productName"),
                        proxy_type=product.get("proxyType"),
                        use_type=product.get("useType"),
                        protocol=product.get("protocol"),
                        use_limit=product.get("useLimit"),
                        sell_limit=product.get("sellLimit"),
                        area_code=product.get("areaCode"),
                        country_code=product.get("countryCode"),
                        state_code=product.get("stateCode"),
                        city_code=product.get("cityCode"),
                        detail=product.get("detail"),
                        cost_price=Decimal(str(product.get("costPrice", 0))),
                        inventory=product.get("inventory", 0),
                        ip_type=product.get("ipType"),
                        isp_type=product.get("ispType"),
                        net_type=product.get("netType"),
                        duration=product.get("duration"),
                        unit=product.get("unit"),
                        band_width=product.get("bandWidth"),
                        band_width_price=Decimal(str(product.get("bandWidthPrice", 0))),
                        max_band_width=product.get("maxBandWidth"),
                        flow=product.get("flow"),
                        cpu=product.get("cpu"),
                        memory=product.get("memory"),
                        enable=product.get("enable", 1),
                        supplier_code=product.get("supplierCode"),
                        ip_count=product.get("ipCount"),
                        ip_duration=product.get("ipDuration"),
                        assign_ip=product.get("assignIp"),
                        cidr_status=product.get("cidrStatus"),
                        updated_at=datetime.now()
                    )
                    new_records.append(inventory)
                
                # 批量插入新记录
                db.bulk_save_objects(new_records)
                db.commit()
                
                logger.info(f"[ProxyService] 成功更新 {len(new_records)} 条产品库存记录")
                
                return {
                    "code": 0,
                    "msg": "产品库存同步成功",
                    "data": {
                        "total": len(new_records),
                        "deleted": delete_count,
                        "updated_at": datetime.now().isoformat()
                    }
                }
                
            except Exception as db_error:
                db.rollback()
                logger.error(f"[ProxyService] 更新数据库失败: {str(db_error)}")
                logger.error(f"[ProxyService] 错误详情: {traceback.format_exc()}")
                return {
                    "code": 500,
                    "msg": f"更新数据库失败: {str(db_error)}",
                    "data": None
                }
                
        except Exception as e:
            logger.error(f"[ProxyService] 同步产品库存失败: {str(e)}")
            logger.error(f"[ProxyService] 错误堆栈: {traceback.format_exc()}")
            return {
                "code": 500,
                "msg": f"同步产品库存失败: {str(e)}",
                "data": None
            }

    async def extract_proxy_complete(self, params: Dict[str, Any], db: Session) -> Dict[str, Any]:
        """
        完整的代理提取流程
        
        Args:
            params: 参数字典，包含：
                - username: 用户名
                - userId: 用户ID
                - agentId: 代理商ID
                - productNo: 产品编号
                - proxyType: 代理类型
                - flow: 流量大小
                - maxFlowLimit: 最大流量限制
                - extractMethod: 提取方式
                - addressCode: 地址代码
                - remark: 备注
                - unitPrice: 单价
                - totalAmount: 总价
        """
        try:
            logger.info(f"[ProxyService] 开始完整提取流程: {json.dumps(params, ensure_ascii=False, cls=DecimalEncoder)}")
            
            # 获取用户信息
            user = db.query(User).filter(User.id == params["userId"]).first()
            if not user:
                raise Exception("用户不存在")
                
            # 检查总价参数
            if "totalAmount" not in params:
                raise Exception("缺少订单总价参数")
                
            order_amount = Decimal(str(params["totalAmount"]))
            logger.info(f"[ProxyService] 订单总价: {order_amount}")
            
            # 检查用户余额是否足够
            if user.balance < order_amount:
                raise Exception(f"用户余额不足，需要 {order_amount}，当前余额 {user.balance}")
                
            # 1. 创建主账户
            main_account_params = {
                "appUsername": params["username"],
                "password": "12345678",  # 使用固定密码
                "version": "v2"
            }
            logger.info(f"[ProxyService] 创建主账户参数: {json.dumps(main_account_params, ensure_ascii=False)}")
            main_account_result = await self._make_request("api/open/app/user/v2", main_account_params)
            if main_account_result.get("code") not in [0, 200]:
                raise Exception(f"创建主账户失败: {main_account_result.get('msg')}")
            logger.info(f"[ProxyService] 创建主账户成功: {json.dumps(main_account_result, ensure_ascii=False)}")
            
            # 2. 验证用户状态
            verify_params = {
                "appUsername": params["username"],
                "version": "v2"
            }
            verify_result = await self._make_request("api/open/app/user/v2", verify_params)
            if verify_result.get("code") not in [0, 200]:
                raise Exception(f"验证用户状态失败: {verify_result.get('msg')}")
            
            user_data = verify_result.get("data", {})
            if isinstance(user_data, dict):
                status = user_data.get("status")
                auth_status = user_data.get("authStatus")
                logger.info(f"[ProxyService] 用户状态: status={status}, authStatus={auth_status}")
                if status != 1:
                    raise Exception("用户状态异常")
            
            # 3. 开通代理
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            order_no = f"DYN{timestamp}{uuid.uuid4().hex[:6]}"
            app_order_no = f"APP{timestamp}{uuid.uuid4().hex[:6]}"
            
            open_proxy_params = {
                "appOrderNo": app_order_no,
                "params": [{
                    "productNo": params["productNo"],
                    "proxyType": params["proxyType"],
                    "appUsername": params["username"],
                    "flow": params["flow"],
                    "duration": 1,
                    "unit": 1
                }]
            }
            logger.info(f"[ProxyService] 开通代理请求参数: {json.dumps(open_proxy_params, ensure_ascii=False)}")
            open_proxy_result = await self._make_request("api/open/app/instance/open/v2", open_proxy_params)
            if open_proxy_result.get("code") not in [0, 200]:
                raise Exception(f"开通代理失败: {open_proxy_result.get('msg')}")
            logger.info(f"[ProxyService] 开通代理成功: {json.dumps(open_proxy_result, ensure_ascii=False)}")
            
            # 扣除用户余额
            original_balance = user.balance
            user.balance -= order_amount
            # 更新用户消费总额
            user.total_consumption += order_amount
            
            logger.info(f"[ProxyService] 用户余额更新: 原余额={original_balance}, 扣除金额={order_amount}, 现余额={user.balance}")
            
            # 创建交易记录
            transaction = Transaction(
                transaction_no=f"DYN{datetime.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6]}",
                user_id=user.id,
                agent_id=params["agentId"],
                order_no=order_no,
                amount=order_amount,
                balance=user.balance,
                type="consumption",  # 消费类型
                status="success",
                remark=f"购买动态代理 {params['flow']}GB"
            )
            db.add(transaction)
            
            # 创建订单记录
            order = DynamicOrder(
                id=str(uuid.uuid4()),
                order_no=order_no,
                app_order_no=app_order_no,
                user_id=params["userId"],
                agent_id=params["agentId"],
                pool_type=params["productNo"],
                traffic=params["flow"],
                unit_price=params.get("unitPrice", 0),  # 记录单价
                total_amount=order_amount,  # 记录实际支付总价
                proxy_type="dynamic",
                status="pending",
                remark=params.get("remark", ""),
                proxy_info=open_proxy_result.get("data")
            )
            
            # 获取或创建资源使用记录
            usage_stats = db.query(ResourceUsageStatistics).filter(
                ResourceUsageStatistics.user_id == user.id,
                ResourceUsageStatistics.product_no == params["productNo"]
            ).first()
            
            if not usage_stats:
                usage_stats = ResourceUsageStatistics(
                    user_id=user.id,
                    product_no=params["productNo"],
                    resource_type="dynamic",
                    total_amount=params["flow"],
                    used_amount=0,
                    today_usage=0,
                    month_usage=0,
                    last_month_usage=0
                )
                db.add(usage_stats)
            else:
                usage_stats.total_amount += params["flow"]
            
            # 添加订单和更新用户信息
            db.add(order)
            db.commit()
            logger.info(f"[ProxyService] 订单创建成功: {order.id}")
            logger.info(f"[ProxyService] 用户余额更新成功: 当前余额={user.balance}")
            
            # 4. 检查订单状态
            order_no = open_proxy_result.get("data", {}).get("orderNo")
            if not order_no:
                raise Exception("未获取到订单号")
            
            # 5. 进行API提取
            draw_params = {
                "appUsername": params["username"],
                "proxyType": params["proxyType"],
                "maxFlowLimit": params["maxFlowLimit"],
                "productNo": params["productNo"],
                "protocol": "socks5",  # 默认使用socks5协议
                "returnType": "txt",   # 默认返回txt格式
                "delimiter": 1         # 默认分隔符
            }
            
            # 添加国家和城市代码
            if "countryCode" in params:
                draw_params["countryCode"] = params["countryCode"]
            if "cityCode" in params:
                draw_params["cityCode"] = params["cityCode"]
                
            logger.info(f"[ProxyService] 开始API提取，参数: {json.dumps(draw_params, ensure_ascii=False)}")
            draw_result = await self._make_request("api/open/app/proxy/draw/api/v2", draw_params)
            
            if draw_result.get("code") not in [0, 200]:
                logger.error(f"[ProxyService] API提取失败: {draw_result.get('msg')}")
                # 更新订单状态为失败
                order.status = "failed"
                db.commit()
                raise Exception(f"API提取失败: {draw_result.get('msg')}")
            
            logger.info(f"[ProxyService] API提取成功: {json.dumps(draw_result, ensure_ascii=False)}")
            
            # 更新订单状态为成功
            order.status = "active"
            # 获取API提取的代理URL
            proxy_url = draw_result.get("data", {}).get("list", [])[0].get("proxyUrl", "") if draw_result.get("data", {}).get("list") else ""
            logger.info(f"[ProxyService] 获取到的代理URL: {proxy_url}")
            
            # 更新订单的代理信息
            order.proxy_info = {
                **order.proxy_info,
                "proxyUrl": proxy_url,
                "drawResult": draw_result.get("data")
            }
            db.commit()
            
            # 构建返回数据
            order_dict = order.to_dict()
            logger.info(f"[ProxyService] 订单数据: {json.dumps(order_dict, ensure_ascii=False, cls=DecimalEncoder)}")
            
            response_data = {
                "code": 0,
                "message": "success",
                "data": {
                    "mainAccount": {
                        "username": params["username"],
                        "status": 1
                    },
                    "orderInfo": order_dict,
                    "proxyInfo": {
                        "list": [{
                            "proxyUrl": proxy_url,  # 直接使用API返回的代理URL
                            "username": params["username"],
                            "password": "agent123",
                            "status": "active"
                        }]
                    },
                    "balance": str(user.balance),  # 将 Decimal 转换为字符串
                    "noPopup": True  # 添加标志，告诉前端不要显示弹窗
                }
            }
            
            logger.info(f"[ProxyService] 返回数据: {json.dumps(response_data, ensure_ascii=False, cls=DecimalEncoder)}")
            return response_data
            
        except Exception as e:
            logger.error(f"[ProxyService] 提取代理失败: {str(e)}")
            if 'db' in locals():
                db.rollback()
            raise HTTPException(status_code=500, detail=str(e))

    async def extract_dynamic_proxy(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """提取动态代理"""
        try:
            logger.info(f"[ProxyService] 开始完整提取流程: {json.dumps(params, ensure_ascii=False)}")
            
            # 创建主账户
            main_account_params = {
                "appUsername": params["username"],
                "password": "12345678",  # 默认密码
                "version": "v2"
            }
            logger.info(f"[ProxyService] 创建主账户参数: {json.dumps(main_account_params, ensure_ascii=False)}")
            
            # 调用API创建主账户
            main_account_response = await self.api_client.create_user(main_account_params)
            logger.info(f"[ProxyService] 创建主账户成功: {json.dumps(main_account_response, ensure_ascii=False)}")
            
            # 检查用户状态
            user_response = await self.api_client.get_user({"appUsername": params["username"], "version": "v2"})
            user_data = user_response.get("data", {})
            status = user_data.get("status", 0)
            auth_status = user_data.get("authStatus", 0)
            logger.info(f"[ProxyService] 用户状态: status={status}, authStatus={auth_status}")
            
            if status != 1:
                error_msg = "用户状态异常"
                logger.error(f"[ProxyService] {error_msg}: status={status}")
                return {
                    "code": 400,
                    "msg": error_msg,
                    "data": None
                }
                
            # 构建开通参数
            open_params = {
                "appOrderNo": f"APP{datetime.now().strftime('%Y%m%d%H%M%S')}{generate_random_string(6)}",
                "params": [{
                    "productNo": params["productNo"],
                    "proxyType": params["proxyType"],
                    "appUsername": params["username"],
                    "flow": params["flow"],
                    "duration": 1,
                    "unit": 1
                }]
            }
            logger.info(f"[ProxyService] 开通代理请求参数: {json.dumps(open_params, ensure_ascii=False)}")
            
            # 调用API开通代理
            open_response = await self.api_client.open_proxy(open_params)
            logger.info(f"[ProxyService] 开通代理成功: {json.dumps(open_response, ensure_ascii=False)}")
            
            # 创建订单记录
            order_data = {
                "order_no": f"DYN{datetime.now().strftime('%Y%m%d%H%M%S')}{generate_random_string(6)}",
                "app_order_no": open_params["appOrderNo"],
                "user_id": params["userId"],
                "agent_id": params.get("agentId"),
                "pool_type": params["productNo"],
                "traffic": params["flow"],
                "unit_price": 0,
                "total_amount": 0,
                "proxy_type": "dynamic",
                "status": "active",
                "proxy_info": {
                    **open_response.get("data", {}),
                },
                "remark": params.get("remark", "")
            }
            
            order = await self.order_service.create_order(order_data)
            logger.info(f"[ProxyService] 订单创建成功: {order.id}")
            
            # 构建提取参数
            draw_params = {
                "appUsername": params["username"],
                "proxyType": params["proxyType"],
                "maxFlowLimit": params["maxFlowLimit"],
                "productNo": params["productNo"],
                "protocol": params.get("protocol", "socks5"),
                "returnType": params.get("returnType", "txt"),
                "delimiter": params.get("delimiter", 1)
            }
            
            # 添加国家和城市代码
            if "countryCode" in params:
                draw_params["countryCode"] = params["countryCode"]
            if "cityCode" in params:
                draw_params["cityCode"] = params["cityCode"]
                
            logger.info(f"[ProxyService] 开始API提取，参数: {json.dumps(draw_params, ensure_ascii=False)}")
            
            # 调用API提取代理
            draw_response = await self.api_client.draw_proxy_api(draw_params)
            logger.info(f"[ProxyService] API提取成功: {json.dumps(draw_response, ensure_ascii=False)}")
            
            # 获取代理URL
            proxy_url = draw_response.get("data", {}).get("list", [{}])[0].get("proxyUrl", "")
            logger.info(f"[ProxyService] 获取到的代理URL: {proxy_url}")
            
            # 更新订单的代理信息
            order.proxy_info = {
                **order.proxy_info,
                "proxyUrl": proxy_url,
                "drawResult": draw_response.get("data")
            }
            db.commit()
            
            # 构建返回数据
            order_dict = order.to_dict()
            logger.info(f"[ProxyService] 订单数据: {json.dumps(order_dict, ensure_ascii=False, cls=DecimalEncoder)}")
            
            response_data = {
                "code": 0,
                "message": "success",
                "data": {
                    "mainAccount": {
                        "username": params["username"],
                        "status": 1
                    },
                    "orderInfo": order_dict,
                    "proxyInfo": {
                        "list": [{
                            "proxyUrl": proxy_url,  # 直接使用API返回的代理URL
                            "username": params["username"],
                            "password": "agent123",
                            "status": "active"
                        }]
                    },
                    "noPopup": True  # 添加标志，告诉前端不要显示弹窗
                }
            }
            
            logger.info(f"[ProxyService] 返回数据: {json.dumps(response_data, ensure_ascii=False, cls=DecimalEncoder)}")
            return response_data
            
        except Exception as e:
            logger.error(f"[ProxyService] 提取代理失败: {str(e)}")
            if 'db' in locals():
                db.rollback()
            raise HTTPException(status_code=500, detail=str(e))

def get_proxy_service() -> ProxyService:
    """
    工厂函数，用于创建 ProxyService 实例
    
    Returns:
        ProxyService: 代理服务实例
    """
    return ProxyService() 
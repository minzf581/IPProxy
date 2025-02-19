"""
代理服务模块
==========

此模块提供所有与代理相关的功能，包括：
1. 代理管理（创建、更新、查询）
2. 代理统计
3. 代理监控
4. 代理配置

使用示例：
--------
```python
proxy_service = ProxyService()
proxy_info = await proxy_service.get_proxy_info(proxy_id)
```

注意事项：
--------
1. 所有方法都应该使用异步调用
2. 确保正确处理错误情况
3. 添加必要的日志记录
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
from .ipipv_base_api import IPIPVBaseAPI
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.dashboard import ProxyInfo
from app.core.security import get_password_hash
import json
import traceback
import time  # 添加 time 模块导入
from app.database import SessionLocal, get_db
from app.models.product_inventory import ProductInventory
from app.core.config import settings
from app.models.dynamic_order import DynamicOrder
import uuid

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

    async def create_dynamic_proxy(self, params: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        创建动态代理
        
        Args:
            params: 创建参数，包括：
                - poolId: 代理池ID
                - trafficAmount: 流量数量
                - username: 可选，用户名
                - password: 可选，密码
                - remark: 可选，备注
                
        Returns:
            dict: 创建成功的代理信息
            None: 创建失败
        """
        try:
            logger.info(f"开始创建动态代理: {params}")
            return await self._make_request("api/open/app/proxy/open/v2", params)
        except Exception as e:
            logger.error(f"创建动态代理失败: {str(e)}")
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

    async def query_product(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        查询产品信息
        
        Args:
            params: 请求参数
            
        Returns:
            Dict[str, Any]: 产品信息
        """
        try:
            logger.info("[ProxyService] 开始查询产品信息")
            logger.info(f"[ProxyService] 原始请求参数: {params}")
            
            # 验证并规范化参数
            required_params = ["regionCode", "countryCode", "cityCode", "proxyType"]
            for param in required_params:
                if param not in params:
                    error_msg = f"缺少必要参数: {param}"
                    logger.error(f"[ProxyService] {error_msg}")
                    return {"code": 400, "msg": error_msg, "data": []}
            
            # 确保 proxyType 是整数
            try:
                if isinstance(params["proxyType"], str):
                    params["proxyType"] = int(params["proxyType"])
            except ValueError:
                error_msg = f"proxyType 参数无法转换为整数: {params['proxyType']}"
                logger.error(f"[ProxyService] {error_msg}")
                return {"code": 400, "msg": error_msg, "data": []}
            
            # 构建请求参数
            request_params = {
                "regionCode": params["regionCode"],
                "countryCode": params["countryCode"],
                "cityCode": params["cityCode"],
                "proxyType": params["proxyType"],
                "appUsername": "test_user"
            }
            
            logger.info(f"[ProxyService] 处理后的请求参数: {request_params}")
            
            # 调用IPIPV API
            try:
                response = await self._make_request(
                    path="/api/open/app/product/query/v2",
                    params=request_params
                )
                logger.info(f"[ProxyService] API响应: {response}")
                
                return {
                    "code": 0,
                    "msg": "success",
                    "data": response
                }
                
            except Exception as e:
                logger.error(f"[ProxyService] API调用失败: {str(e)}")
                logger.error("[ProxyService] 错误堆栈:", exc_info=True)
                return {
                    "code": 500,
                    "msg": f"API调用失败: {str(e)}",
                    "data": []
                }
            
        except Exception as e:
            logger.error(f"[ProxyService] 查询产品信息失败: {str(e)}")
            logger.error("[ProxyService] 错误堆栈:", exc_info=True)
            return {
                "code": 500,
                "msg": f"查询失败: {str(e)}",
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
            
            # 2. 开通代理实例
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            app_order_no = f"APP{timestamp}"
            
            # 构建请求参数
            request_data = {
                "appOrderNo": app_order_no,
                "params": [{
                    "productNo": params.get("productNo", "out_dynamic_1"),
                    "proxyType": 104,
                    "appUsername": params["appUsername"],
                    "flow": params.get("limitFlow", 1000),  # 使用 limitFlow 参数
                    "duration": params.get("duration", 30),
                    "unit": params.get("unit", 1)
                }]
            }
            
            logger.info(f"[ProxyService] 开通代理请求参数: {json.dumps(request_data)}")
            
            # 调用IPIPV API创建代理
            response = await self._make_request(
                "api/open/app/instance/open/v2",
                request_data
            )
            
            logger.info(f"[ProxyService] API响应: {json.dumps(response)}")
            
            if not response or response.get("code") not in [0, 200]:
                error_msg = response.get("msg", "未知错误") if response else "API返回为空"
                logger.error(f"[ProxyService] 创建代理失败: {error_msg}")
                return {
                    "code": response.get("code", 500) if response else 500,
                    "msg": error_msg,
                    "data": None
                }
            
            # 获取IPIPV平台返回的orderNo
            ipipv_order_no = response.get("data", {}).get("orderNo")
            if not ipipv_order_no:
                logger.error("[ProxyService] API返回数据中没有orderNo")
                return {
                    "code": 500,
                    "msg": "API返回数据中没有orderNo",
                    "data": None
                }
            
            # 3. 创建本地订单记录
            db = None
            try:
                db = SessionLocal()
                
                # 准备用户和代理数据
                ipipv_user_data = {
                    "appUsername": params["appUsername"],
                    "ipipvUsername": ipipv_username,
                    "password": params["password"],
                    **ipipv_data
                }
                
                ipipv_proxy_data = response.get("data", {})
                
                # 创建订单记录
                order = DynamicOrder(
                    id=f"DO{int(time.time() * 1000)}",  # 生成唯一ID
                    order_no=ipipv_order_no,
                    app_order_no=app_order_no,
                    user_id=int(params.get("user_id")) if params.get("user_id") else None,
                    agent_id=int(params.get("agent_id")) if params.get("agent_id") else None,
                    pool_type="dynamic",
                    traffic=int(params.get("limitFlow", 1000)),
                    unit_price=0.0,
                    total_amount=0.0,
                    proxy_type="dynamic",
                    status="active",
                    remark=params.get("remark", ""),
                    proxy_info={
                        "user": ipipv_user_data,
                        "proxy": ipipv_proxy_data
                    }
                )
                
                db.add(order)
                db.commit()
                logger.info(f"[ProxyService] 成功创建动态订单: {ipipv_order_no}")
                
                return {
                    "code": 0,
                    "msg": "success",
                    "data": {
                        "orderNo": ipipv_order_no,
                        "appOrderNo": app_order_no,
                        "appUsername": params["appUsername"],  # 返回创建时输入的用户名
                        "ipipvUsername": ipipv_username,  # 同时返回IPIPV平台的用户名
                        "proxyInfo": response.get("data")
                    }
                }
                
            except Exception as e:
                if db:
                    db.rollback()
                logger.error(f"[ProxyService] 数据库操作失败: {str(e)}")
                return {
                    "code": 500,
                    "msg": f"数据库操作失败: {str(e)}",
                    "data": None
                }
            finally:
                if db:
                    db.close()
            
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
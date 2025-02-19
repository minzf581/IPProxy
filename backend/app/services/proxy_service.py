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

logger = logging.getLogger(__name__)

class ProxyService(IPIPVBaseAPI):
    """代理服务类，处理所有代理相关的操作"""
    
    async def get_proxy_info(self, proxy_id: str) -> Optional[Dict[str, Any]]:
        """获取代理信息"""
        try:
            logger.info(f"[ProxyService] 获取代理信息: proxy_id={proxy_id}")
            return await self._make_request(f"api/open/app/proxy/{proxy_id}/v2")
        except Exception as e:
            logger.error(f"[ProxyService] 获取代理信息失败: {str(e)}")
            return None
            
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
        创建代理用户（子账号）
        
        Args:
            params: 创建参数，包括：
                - appUsername: 代理商用户名
                - limitFlow: 流量限制（MB）
                - remark: 备注
                - platformAccount: 平台主账号
                - channelAccount: 渠道商主账号
                
        Returns:
            Dict[str, Any]: 创建结果
        """
        try:
            logger.info(f"[ProxyService] 开始创建代理用户: {json.dumps(params, ensure_ascii=False)}")
            
            # 验证必要参数
            required_fields = ["appUsername", "limitFlow", "remark", "platformAccount", "channelAccount"]
            missing_fields = [field for field in required_fields if field not in params]
            if missing_fields:
                error_msg = f"缺少必要参数: {', '.join(missing_fields)}"
                logger.error(f"[ProxyService] {error_msg}")
                return {
                    "code": 400,
                    "msg": error_msg,
                    "data": None
                }
            
            # 构建请求参数
            request_params = {
                "version": "v2",
                "encrypt": "AES",
                "appUsername": params["appUsername"],
                "limitFlow": params["limitFlow"],
                "remark": params["remark"],
                "mainUsername": params["mainUsername"],     # 使用传入的主账号
                "appMainUsername": params["mainUsername"],  # 使用传入的主账号
                "platformAccount": params["platformAccount"],       # 平台账号
                "channelAccount": params["channelAccount"],        # 渠道商账号
                "status": 1,                                       # 状态：1=正常
                "authType": settings.IPPROXY_MAIN_AUTH_TYPE,       # 认证类型
                "authName": settings.IPPROXY_MAIN_AUTH_NAME,       # 认证名称
                "no": settings.IPPROXY_MAIN_AUTH_NO,              # 证件号码
                "phone": settings.IPPROXY_MAIN_PHONE,             # 手机号码
                "email": settings.IPPROXY_MAIN_EMAIL              # 邮箱
            }
            
            logger.info(f"[ProxyService] 请求参数: {json.dumps(request_params, ensure_ascii=False)}")
            
            # 调用IPIPV API创建代理用户
            response = await self._make_request(
                "api/open/app/proxy/user/v2",
                request_params
            )
            
            logger.info(f"[ProxyService] IPIPV API响应: {json.dumps(response, ensure_ascii=False)}")
            
            if not response:
                error_msg = "创建代理用户失败: 无响应数据"
                logger.error(f"[ProxyService] {error_msg}")
                return {
                    "code": 500,
                    "msg": error_msg,
                    "data": None
                }
            
            # 检查响应状态
            if response.get("code") == 200:  # IPIPV API 返回200表示成功
                # 获取数据库会话
                db = SessionLocal()
                try:
                    # 获取代理商信息，使用 app_username 查找
                    agent = db.query(User).filter(
                        User.app_username == params["appUsername"],
                        User.is_agent == True,
                        User.status == 1
                    ).first()
                    
                    if agent:
                        # 更新代理商的 IPIPV 用户名和密码
                        ipipv_data = response.get("data", {})
                        agent.ipipv_username = ipipv_data.get("username")
                        agent.ipipv_password = ipipv_data.get("password")
                        db.commit()
                        logger.info(f"[ProxyService] 更新代理商信息成功: {agent.username}")
                    else:
                        logger.warning(f"[ProxyService] 未找到代理商: app_username={params['appUsername']}")
                except Exception as db_error:
                    logger.error(f"[ProxyService] 更新数据库失败: {str(db_error)}")
                    db.rollback()
                finally:
                    db.close()

                return {
                    "code": 0,  # 统一使用 0 表示成功
                    "msg": "success",
                    "data": response.get("data")
                }
            else:
                error_msg = f"创建代理用户失败: {response.get('msg', '未知错误')}"
                logger.error(f"[ProxyService] {error_msg}")
                return {
                    "code": response.get("code", 500),
                    "msg": error_msg,
                    "data": None
                }
            
        except Exception as e:
            error_msg = f"创建代理用户失败: {str(e)}"
            logger.error(f"[ProxyService] {error_msg}")
            logger.error(traceback.format_exc())
            return {
                "code": 500,
                "msg": error_msg,
                "data": None,
                "error_details": {
                    "error_type": type(e).__name__,
                    "error_message": str(e),
                    "timestamp": datetime.now().isoformat()
                }
            }

    async def get_proxy_resources(self, username: str) -> Dict[str, Any]:
        """
        获取代理商的资源列表
        
        Args:
            username: 代理商用户名
            
        Returns:
            Dict[str, Any]: 资源列表信息
        """
        try:
            logger.info(f"[ProxyService] 开始获取代理商资源列表: username={username}")
            
            # 从数据库获取所有可用的动态代理产品
            db = SessionLocal()
            products = db.query(ProductInventory).filter(
                ProductInventory.enable == 1,
                ProductInventory.proxy_type == 104  # 动态代理类型
            ).all()
            
            if not products:
                logger.info("[ProxyService] 未找到可用的动态代理产品")
                return {
                    "code": 200,
                    "msg": "success",
                    "data": []
                }
            
            # 获取代理商信息，包括 IPIPV 平台的用户名
            agent = db.query(User).filter(
                User.username == username,
                User.is_agent == True,
                User.status == 1
            ).first()
            
            if not agent:
                logger.error(f"[ProxyService] 未找到代理商信息: {username}")
                return {
                    "code": 404,
                    "msg": "代理商不存在",
                    "data": None
                }
            
            if not agent.ipipv_username:
                logger.error(f"[ProxyService] 代理商未绑定 IPIPV 账号: {username}")
                return {
                    "code": 400,
                    "msg": "代理商未绑定 IPIPV 账号",
                    "data": None
                }
            
            logger.info(f"[ProxyService] 找到代理商 IPIPV 账号: {agent.ipipv_username}")
            
            resources = []
            for product in products:
                logger.info(f"[ProxyService] 处理产品: {product.product_no}")
                
                # 构造请求参数，使用代理商的 username 和主账号的 app_username
                params = {
                    "username": agent.ipipv_username,  # 使用代理商的 IPIPV 用户名
                    "appUsername": main_user.app_username,  # 使用主账号的 app_username
                    "proxyType": 104,  # 动态代理类型
                    "productNo": product.product_no  # 使用数据库中的产品编号
                }
                
                logger.info(f"[ProxyService] 请求参数: {params}")
                
                # 调用API获取代理信息
                response = await self._make_request(
                    "api/open/app/proxy/info/v2",
                    params
                )
                
                if response and response.get("code") in [0, 200]:
                    proxy_info = response.get("data", {})
                    if isinstance(proxy_info, str):
                        try:
                            proxy_info = json.loads(proxy_info)
                        except json.JSONDecodeError:
                            logger.error(f"[ProxyService] 解析代理信息失败: {proxy_info}")
                            continue
                    
                    # 处理可能的空值或无效值
                    total = proxy_info.get("total")
                    used = proxy_info.get("used")
                    balance = proxy_info.get("balance")
                    ip_whitelist = proxy_info.get("ipWhiteList", [])
                    ip_used = proxy_info.get("ipUsed")
                    ip_total = proxy_info.get("ipTotal")
                    
                    try:
                        total = float(total if total is not None else 0)
                        used = float(used if used is not None else 0)
                        balance = float(balance if balance is not None else 0)
                        ip_used = int(ip_used if ip_used is not None else 0)
                        ip_total = int(ip_total if ip_total is not None else 0)
                        
                        # 确保 ipWhiteList 是列表类型
                        if ip_whitelist is None:
                            ip_whitelist = []
                        elif isinstance(ip_whitelist, str):
                            try:
                                ip_whitelist = json.loads(ip_whitelist)
                            except json.JSONDecodeError:
                                ip_whitelist = []
                        
                        resources.append({
                            "productNo": product.product_no,
                            "productName": product.product_name,
                            "total": total,
                            "used": used,
                            "balance": balance,
                            "ipWhiteList": ip_whitelist,
                            "ipUsed": ip_used,
                            "ipTotal": ip_total
                        })
                        logger.info(f"[ProxyService] 成功添加资源: {product.product_no}")
                    except (ValueError, TypeError) as e:
                        logger.error(f"[ProxyService] 转换数据类型失败: {str(e)}")
                        continue
                else:
                    logger.warning(f"[ProxyService] 获取代理信息失败: {response}")
            
            logger.info(f"[ProxyService] 成功获取资源列表，共 {len(resources)} 个资源")
            return {
                "code": 200,
                "msg": "success",
                "data": resources
            }
            
        except Exception as e:
            logger.error(f"[ProxyService] 获取代理资源列表失败: {str(e)}")
            logger.error(traceback.format_exc())
            return {
                "code": 500,
                "msg": f"获取代理资源列表失败: {str(e)}",
                "data": None
            }
        finally:
            db.close() 
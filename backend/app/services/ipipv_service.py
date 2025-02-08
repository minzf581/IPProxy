from typing import Dict, Optional
import logging
from fastapi import HTTPException
from app.services.ipipv_base_api import IPIPVBaseAPI
from app.core.config import settings
import json
import traceback
from datetime import datetime
import asyncio
from sqlalchemy.orm import Session
from app.models.dynamic_order import DynamicOrder
from decimal import Decimal
import httpx

logger = logging.getLogger(__name__)

class IPIPVService(IPIPVBaseAPI):
    """
    IPIPV代理激活服务
    专注于处理代理激活相关的功能
    """
    
    def __init__(self, db: Session = None):
        super().__init__()
        self.callback_url = settings.API_V1_STR
        self.channel_id = settings.IPPROXY_CHANNEL_ID
        self.app_key = settings.IPPROXY_APP_KEY
        self.db = db
    
    async def get_product_inventory(self, proxy_type: int = 105) -> Dict:
        """
        查询产品库存
        
        Args:
            proxy_type: 代理类型，默认105表示动态代理
            支持的类型：
            - 104: 动态国外代理
            - 105: 动态混合代理
            - 201: 动态住宅代理
            
        Returns:
            Dict: 产品库存信息
        """
        try:
            logger.info(f"[IPIPVService] 开始查询产品库存: proxy_type={proxy_type}")
            
            request_params = {
                "appOrderNo": f"INV{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "proxyType": [proxy_type]  # 使用数组格式
            }
            
            response = await self._make_request(
                "api/open/app/product/query/v2",
                request_params
            )
            
            if not response:
                logger.error("[IPIPVService] 查询产品库存失败: 无响应数据")
                raise HTTPException(500, "查询产品库存失败: 无响应数据")
            
            # 处理API响应数据
            if isinstance(response, dict):
                # 检查是否有解密后的数据
                if 'decrypted_data' in response:
                    product_list = response['decrypted_data']
                    if isinstance(product_list, list):
                        return {"list": product_list}
                    else:
                        logger.error("[IPIPVService] 解密后的数据不是列表格式")
                        raise HTTPException(500, "产品数据格式错误")
                # 如果没有解密数据，检查data字段
                elif 'data' in response:
                    product_list = response['data']
                    if isinstance(product_list, str):
                        try:
                            product_list = json.loads(product_list)
                        except json.JSONDecodeError:
                            logger.error("[IPIPVService] 无法解析产品数据")
                            raise HTTPException(500, "无法解析产品数据")
                    if isinstance(product_list, list):
                        return {"list": product_list}
                    else:
                        logger.error("[IPIPVService] 产品数据不是列表格式")
                        raise HTTPException(500, "产品数据格式错误")
            
            logger.error(f"[IPIPVService] 无效的响应格式: {response}")
            raise HTTPException(500, "无效的响应格式")
            
        except Exception as e:
            logger.error(f"[IPIPVService] 查询产品库存失败: {str(e)}")
            raise HTTPException(500, f"查询产品库存失败: {str(e)}")

    async def activate_dynamic_proxy(
        self,
        order_id: str,
        pool_id: str,
        traffic_amount: int,
        duration: int = 30,  # 默认30天
        unit: int = 3,  # 默认按月计算
        user_id: Optional[int] = None,  # 添加用户ID参数
        agent_id: Optional[int] = None  # 添加代理商ID参数
    ) -> Dict:
        """
        激活动态代理
        
        Args:
            order_id: 订单ID
            pool_id: 代理池ID
            traffic_amount: 流量数量
            duration: 时长，默认30天
            unit: 计费单位，1=天，3=月，默认按月
            user_id: 用户ID
            agent_id: 代理商ID
            
        Returns:
            Dict: 激活结果
            
        Raises:
            HTTPException: 激活失败时抛出
        """
        try:
            # 参数验证
            if not order_id or not order_id.strip():
                raise ValueError("订单ID不能为空")
            if not pool_id or not pool_id.strip():
                raise ValueError("代理池ID不能为空")
            if traffic_amount <= 0:
                raise ValueError("流量数量必须大于0")
            if duration <= 0:
                raise ValueError("时长必须大于0")
            if unit not in [1, 3]:  # 1=天，3=月
                raise ValueError("计费单位必须是1(天)或3(月)")

            logger.info(f"[IPIPVService] 开始激活动态代理: order_id={order_id}, pool_id={pool_id}")
            
            # 生成订单号
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            padded_order_id = str(order_id).zfill(6)
            app_order_no = f"APP{timestamp}{padded_order_id}"
            
            # 构建回调URL
            callback_url = f"http://localhost:8000/api/order/callback/{order_id}"
            
            # 构建请求参数
            request_params = {
                "appOrderNo": app_order_no,
                "params": [{
                    "productNo": pool_id,  # 直接使用传入的pool_id作为productNo
                    "flow": traffic_amount,  # 流量大小（MB）
                    "appUsername": settings.IPPROXY_APP_USERNAME,
                    "count": 1,  # 默认购买1个
                    "duration": duration,  # 使用传入的时长
                    "unit": unit,  # 使用传入的计费单位
                    "cycleTimes": 1,  # 默认周期1
                    "orderType": "formal",  # 指定为正式订单，而不是测试订单
                    "callbackUrl": callback_url  # 使用实际的回调URL
                }]
            }
            
            logger.info(f"[IPIPVService] 请求参数: {json.dumps(request_params, ensure_ascii=False)}")
            
            response = await self._make_request(
                "api/open/app/instance/open/v2",
                request_params
            )
            
            if not response:
                logger.error("[IPIPVService] 动态代理激活失败: 无响应数据")
                raise HTTPException(500, "代理激活失败")
            
            # 检查响应中的错误信息
            if isinstance(response, dict):
                code = response.get('code')
                msg = response.get('msg', '未知错误')
                decrypted_data = response.get('decrypted_data')

                if not decrypted_data:
                    error_msg = f"代理激活失败: {msg}"
                    logger.error(f"[IPIPVService] {error_msg}")
                    raise HTTPException(500, error_msg)

                if code in [0, 200]:  # 成功响应
                    # 创建动态订单记录
                    order = DynamicOrder(
                        id=order_id,
                        order_no=decrypted_data.get("orderNo"),  # 使用API返回的订单号
                        app_order_no=app_order_no,
                        user_id=user_id,
                        agent_id=agent_id or user_id,  # 如果没有代理商ID，使用用户ID
                        pool_type=pool_id,
                        traffic=traffic_amount,
                        unit_price=float(decrypted_data.get("amount", "0")),  # 使用API返回的金额
                        total_amount=float(decrypted_data.get("amount", "0")),  # 使用API返回的金额
                        proxy_type="dynamic",
                        status="pending",
                        proxy_info=None,  # 初始为空，等待回调更新
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow()
                    )

                    self.db.add(order)
                    self.db.commit()
                    logger.info(f"[IPIPVService] 成功创建动态订单: {order_id}, 订单号: {order.order_no}")

                    # 在测试环境中，模拟回调
                    if settings.TESTING:
                        logger.info("[IPIPVService] 测试环境，模拟回调")
                        
                        async def simulate_callback():
                            try:
                                await asyncio.sleep(1)  # 减少等待时间到1秒
                                callback_data = {
                                    "status": "success",
                                    "proxyInfo": {
                                        "username": f"proxy_user_{order_id}",
                                        "password": "test_pass",
                                        "server": "proxy.example.com",
                                        "port": 8080
                                    }
                                }
                                
                                # 直接更新数据库而不是发送HTTP请求
                                order.status = "active"
                                order.proxy_info = callback_data["proxyInfo"]
                                order.updated_at = datetime.utcnow()
                                self.db.commit()
                                logger.info(f"[IPIPVService] 模拟回调成功: order_id={order_id}")
                                
                            except Exception as e:
                                logger.error(f"[IPIPVService] 模拟回调失败: {str(e)}")
                                raise

                        # 创建异步任务执行回调
                        asyncio.create_task(simulate_callback())
                        logger.info("[IPIPVService] 已创建模拟回调任务")

                    return {
                        "order_no": order.order_no,
                        "app_order_no": order.app_order_no,
                        "status": "pending",
                        "message": "订单创建成功，等待回调",
                        "amount": decrypted_data.get("amount")
                    }
                else:
                    error_msg = f"代理激活失败: {msg}"
                    logger.error(f"[IPIPVService] {error_msg}")
                    raise HTTPException(500, error_msg)
            
            logger.error("[IPIPVService] 动态代理激活失败: 响应格式错误")
            raise HTTPException(500, "代理激活失败: 响应格式错误")
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"[IPIPVService] 激活动态代理时发生错误: {str(e)}")
            raise HTTPException(500, f"代理激活失败: {str(e)}")

    async def activate_static_proxy(
        self,
        order_id: str,
        pool_id: str,
        ip_count: int,
        duration: int,
        unit: str
    ) -> Dict:
        """
        激活静态代理
        
        Args:
            order_id: 订单ID
            pool_id: 代理池ID
            ip_count: IP数量
            duration: 有效期（天）
            unit: 时间单位
            
        Returns:
            Dict: 激活结果
            
        Raises:
            HTTPException: 激活失败时抛出
        """
        try:
            logger.info(f"[IPIPVService] 开始激活静态代理: order_id={order_id}, pool_id={pool_id}")
            
            # 生成订单号前缀
            order_prefix = "IPP"
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            # 确保order_id至少6位，不足的在前面补0
            padded_order_id = str(order_id).zfill(6)
            channel_order_no = f"{order_prefix}{timestamp}{padded_order_id}"
            
            logger.info(f"[IPIPVService] 生成的订单号: {channel_order_no}")
            
            request_params = {
                "channelOrderNo": channel_order_no,  # 直接使用channelOrderNo
                "channelId": self.channel_id,  # 使用驼峰命名
                "appKey": self.app_key,
                "poolId": pool_id,  # 使用驼峰命名
                "ipCount": ip_count,  # 使用驼峰命名
                "duration": duration,  # 使用传入的时长
                "unit": unit,  # 使用传入的计费单位
                "cycleTimes": 1,  # 默认周期1
                "orderType": "formal",  # 指定为正式订单，而不是测试订单
                "callbackUrl": f"https://{settings.SERVER_HOST}{self.callback_url}/api/order/callback/{order_id}",  # 使用驼峰命名
                "version": settings.IPPROXY_API_VERSION,
                "appUsername": settings.IPPROXY_APP_USERNAME,  # 使用驼峰命名
                "proxyType": "static",  # 使用驼峰命名
                "orderType": "new"  # 使用驼峰命名
            }
            
            response = await self._make_request(
                "api/open/app/instance/open/v2",
                request_params
            )
            
            if not response:
                logger.error("[IPIPVService] 静态代理激活失败: 无响应数据")
                raise HTTPException(500, "代理激活失败: 无响应数据")
                
            # 检查响应中的错误信息
            if isinstance(response, dict):
                code = response.get('code')
                msg = response.get('msg', '未知错误')
                
                if code not in [0, 200]:
                    error_msg = f"代理激活失败: {msg}"
                    logger.error(f"[IPIPVService] {error_msg}")
                    raise HTTPException(500, error_msg)
                
                # 如果响应成功但没有数据
                if not response.get('data'):
                    logger.error("[IPIPVService] 静态代理激活失败: 响应中无数据")
                    raise HTTPException(500, "代理激活失败: 响应中无数据")
            
            logger.info(f"[IPIPVService] 静态代理激活成功: {response}")
            return response
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"[IPIPVService] 激活静态代理失败: {str(e)}")
            raise HTTPException(500, f"代理激活失败: {str(e)}")

# 创建服务实例
ipipv_service = IPIPVService() 
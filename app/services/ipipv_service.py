from typing import Dict, List, Optional
import logging
from fastapi import HTTPException
from .ipipv_base_api import IPIPVBaseAPI
from app.core.config import settings
import json
import traceback
from datetime import datetime
from app.models.dynamic_order import DynamicOrder

logger = logging.getLogger(__name__)

class IPIPVService(IPIPVBaseAPI):
    """
    IPIPV代理激活服务
    专注于处理代理激活相关的功能
    """
    
    def __init__(self):
        super().__init__()
        self.callback_url = settings.API_V1_STR
        self.channel_id = settings.IPPROXY_CHANNEL_ID
        self.app_key = settings.IPPROXY_APP_KEY
    
    async def get_product_inventory(self, proxy_type: int = 105) -> List[Dict]:
        """
        查询产品库存
        
        Args:
            proxy_type: 代理类型，默认105（动态混合代理）
                - 104: 动态国外代理
                - 105: 动态混合代理
                - 201: 动态住宅代理
        
        Returns:
            List[Dict]: 产品库存列表
        """
        try:
            logger.info(f"[IPIPVService] 开始查询产品库存: proxy_type={proxy_type}")
            
            # 构造请求参数
            params = {
                "appOrderNo": f"INV{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "proxyType": [proxy_type]
            }
            
            # 发送请求
            response = await self._make_request(
                "api/open/app/product/query/v2",
                params
            )
            
            logger.info(f"[IPIPVService] 查询到的产品信息: {response}")
            
            # 检查响应
            if not response:
                logger.error("[IPIPVService] 产品库存查询失败: 响应为空")
                return []
                
            if "data" not in response:
                logger.error("[IPIPVService] 产品库存查询失败: 响应格式错误")
                return []
                
            # 解析响应数据
            data = response.get("data")
            if not data or data == "null":
                logger.warning("[IPIPVService] 未找到任何产品库存")
                return []
                
            if not isinstance(data, list):
                logger.error("[IPIPVService] 产品库存数据格式错误")
                return []
                
            return data
            
        except Exception as e:
            logger.error(f"[IPIPVService] 产品库存查询异常: {str(e)}")
            return []
            
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
            logger.info(f"[IPIPVService] 开始激活动态代理: order_id={order_id}, pool_id={pool_id}")
            
            # 生成订单号
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            padded_order_id = str(order_id).zfill(6)
            app_order_no = f"APP{timestamp}{padded_order_id}"
            
            # 构建回调URL
            callback_url = f"https://{settings.SERVER_HOST}/api/order/callback/{order_id}"
            
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
                    "callbackUrl": callback_url  # 添加回调URL
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
                encrypted_data = response.get('data')

                if code in [0, 200]:  # 成功响应
                    try:
                        # 解密响应数据
                        decrypted_data = await self._decrypt_response(encrypted_data)
                        if not decrypted_data:
                            raise ValueError("解密后数据为空")
                        
                        logger.info(f"[IPIPVService] 解密后的数据: {decrypted_data}")
                        
                        # 创建动态订单记录
                        dynamic_order = DynamicOrder(
                            order_no=decrypted_data.get("orderNo"),
                            app_order_no=decrypted_data.get("appOrderNo"),
                            user_id=user_id,
                            agent_id=agent_id,
                            pool_type=pool_id,
                            traffic=traffic_amount,
                            unit_price=0.0,  # 默认单价为0
                            total_amount=float(decrypted_data.get("amount", 0)),
                            proxy_type="dynamic",
                            status="pending",  # 初始状态为pending，等待回调更新
                            remark="订单已创建，等待回调更新状态",
                            proxy_info=None  # 代理信息将在回调时更新
                        )
                        
                        self.db.add(dynamic_order)
                        try:
                            self.db.commit()
                            logger.info(f"[IPIPVService] 成功创建动态订单: {dynamic_order.order_no}")
                        except Exception as e:
                            self.db.rollback()
                            logger.error(f"[IPIPVService] 保存订单失败: {str(e)}")
                            raise HTTPException(500, "订单创建失败")
                        
                        return {
                            "order_no": dynamic_order.order_no,
                            "app_order_no": dynamic_order.app_order_no,
                            "amount": dynamic_order.total_amount,
                            "status": dynamic_order.status,
                            "message": "订单已创建，等待回调更新状态"
                        }
                        
                    except Exception as e:
                        logger.error(f"[IPIPVService] 处理响应数据失败: {str(e)}")
                        raise HTTPException(500, f"处理响应数据失败: {str(e)}")
                else:
                    error_msg = f"代理激活失败: {msg}"
                    logger.error(f"[IPIPVService] {error_msg}")
                    raise HTTPException(500, error_msg)

            raise HTTPException(500, "响应格式错误")
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"[IPIPVService] 激活动态代理时发生错误: {str(e)}")
            raise HTTPException(500, f"代理激活失败: {str(e)}") 
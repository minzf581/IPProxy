from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from datetime import datetime
import logging
from app.models.static_order import StaticOrder
from app.models.instance import Instance
from app.models.user import User
from app.services.ipipv_base_api import IPIPVBaseAPI
from app.services.payment_service import PaymentService
from app.config import settings
from fastapi import HTTPException
import uuid
from sqlalchemy.exc import SQLAlchemyError
import json
from app.models.product_inventory import ProductInventory
from app.models.dynamic_order import DynamicOrder

logger = logging.getLogger(__name__)

class StaticOrderService:
    def __init__(self, db: Session, ipipv_api: IPIPVBaseAPI):
        self.db = db
        self.ipipv_api = ipipv_api
        self.payment_service = PaymentService(db)
        
    def generate_order_no(self) -> str:
        """生成订单号"""
        return f"SO{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
        
    async def create_order(
        self,
        user_id: int,
        username: str,
        agent_id: int,
        agent_username: str,
        order_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """创建代理订单"""
        logger = logging.getLogger(__name__)
        logger.info(f"[OrderService] 开始创建代理订单: user_id={user_id}, agent_id={agent_id}")
        logger.debug(f"[OrderService] 订单数据: {order_data}")
        
        try:
            # 生成订单号
            order_no = self.generate_order_no()
            logger.info(f"[OrderService] 生成订单号: {order_no}")
            
            # 检查用户余额
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                logger.error(f"[OrderService] 用户不存在: {user_id}")
                raise HTTPException(status_code=404, detail="用户不存在")
                
            logger.info(f"[OrderService] 用户当前余额: {user.balance}")
            amount = order_data.get('total_cost', 0)
            if user.balance < amount:
                logger.error(f"[OrderService] 用户余额不足: balance={user.balance}, amount={amount}")
                raise HTTPException(status_code=400, detail="余额不足")
            
            # 调用支付服务处理支付
            logger.info(f"[OrderService] 开始处理支付，金额: {amount}")
            payment_service = PaymentService(self.db)
            payment_result = await payment_service.process_order_payment(
                user_id=user_id,
                agent_id=agent_id,
                order_no=order_no,
                amount=amount
            )
            logger.info(f"[OrderService] 支付处理结果: {payment_result}")
            
            if payment_result.get('code') != 0:
                logger.error(f"[OrderService] 支付失败: {payment_result}")
                raise HTTPException(status_code=500, detail=payment_result.get('msg', '支付失败'))
            
            try:
                if order_data.get('proxyType') == 'dynamic':
                    # 处理动态代理订单
                    logger.info("[OrderService] 处理动态代理订单")
                    if not order_data.get('poolType') or not order_data.get('traffic'):
                        logger.error("[OrderService] 动态代理缺少必要参数")
                        raise HTTPException(status_code=400, detail="动态代理需要填写IP池和流量信息")
                        
                    # 创建动态代理订单记录
                    dynamic_order = DynamicOrder(
                        order_no=order_no,
                        app_order_no=order_data.get('app_order_no', order_no),
                        user_id=user_id,
                        agent_id=agent_id,
                        pool_type=order_data.get('poolType'),
                        traffic=order_data.get('traffic'),
                        amount=amount,
                        status='processing'
                    )
                    
                    self.db.add(dynamic_order)
                    self.db.commit()
                    logger.info(f"[OrderService] 动态代理订单创建成功: {order_no}")
                    
                    return {
                        "code": 0,
                        "msg": "success",
                        "data": dynamic_order.to_dict()
                    }
                    
                else:
                    # 处理静态代理订单
                    logger.info("[OrderService] 处理静态代理订单")
                    # 验证必要参数
                    required_fields = ['product_no', 'region', 'country', 'city', 'staticType', 'duration', 'quantity']
                    missing_fields = [field for field in required_fields if not order_data.get(field)]
                    if missing_fields:
                        logger.error(f"[OrderService] 静态代理缺少必要参数: {missing_fields}")
                        raise HTTPException(status_code=400, detail=f"缺少必要参数: {', '.join(missing_fields)}")
                    
                    # 先查询产品信息
                    logger.info("[OrderService] 开始查询产品信息")
                    product_result = await self.ipipv_api._make_request(
                        "api/open/app/product/query/v2",
                        {
                            "proxyType": [103],
                            "appOrderNo": order_data.get('app_order_no', order_no)
                        }
                    )
                    logger.info(f"[OrderService] 产品信息查询结果: {product_result}")

                    if not product_result or product_result == "null":
                        logger.error(f"[OrderService] 产品信息查询失败")
                        raise HTTPException(status_code=500, detail="产品信息查询失败")

                    # 创建静态代理订单记录
                    static_order = StaticOrder(
                        order_no=order_no,
                        app_order_no=order_data.get('app_order_no', order_no),
                        user_id=user_id,
                        agent_id=agent_id,
                        product_no=order_data.get('product_no'),
                        proxy_type=103,  # 静态国外家庭代理
                        region_code=order_data.get('region'),
                        country_code=order_data.get('country'),
                        city_code=order_data.get('city'),
                        static_type=order_data.get('staticType'),
                        ip_count=int(order_data.get('quantity', 0)),
                        duration=int(order_data.get('duration', 0)),
                        unit=1,  # 默认单位为天
                        amount=amount,
                        status='processing'
                    )
                    
                    self.db.add(static_order)
                    self.db.commit()
                    logger.info(f"[OrderService] 静态代理订单创建成功: {order_no}")
                    
                    return {
                        "code": 0,
                        "msg": "success",
                        "data": static_order.to_dict()
                    }
                    
            except Exception as e:
                logger.error(f"[OrderService] 创建订单失败: {str(e)}")
                logger.exception(e)
                # 发起退款
                await payment_service.refund_order(
                    user_id=user_id,
                    agent_id=agent_id,
                    order_no=order_no,
                    amount=amount,
                    remark=f"订单创建失败: {str(e)}"
                )
                raise HTTPException(status_code=500, detail=f"订单创建失败: {str(e)}")
            
        except HTTPException as e:
            raise e
        except Exception as e:
            logger.error(f"[OrderService] 处理订单时发生错误: {str(e)}")
            logger.exception(e)
            raise HTTPException(status_code=500, detail=str(e))
            
    async def get_order_info(self, order_no: str) -> Dict[str, Any]:
        """获取订单信息"""
        try:
            logger.info(f"获取订单信息: order_no={order_no}")
            
            order = self.db.query(StaticOrder).filter_by(order_no=order_no).first()
            if not order:
                logger.error(f"订单不存在: {order_no}")
                raise HTTPException(status_code=404, detail="订单不存在")
                
            # 获取实例信息
            instances = self.db.query(Instance).filter_by(order_no=order_no).all()
            
            result = order.to_dict()
            result['instances'] = [instance.to_dict() for instance in instances]
            
            logger.info(f"获取订单信息成功: {result}")
            return {
                'code': 0,
                'msg': 'success',
                'data': result
            }
            
        except HTTPException as e:
            raise e
        except Exception as e:
            logger.error(f"获取订单信息失败: {str(e)}")
            logger.exception(e)
            raise HTTPException(status_code=500, detail="获取订单信息失败")
            
    async def update_order_status(
        self,
        order_no: str,
        status: str,
        remark: Optional[str] = None
    ) -> Dict[str, Any]:
        """更新订单状态"""
        try:
            logger.info(f"更新订单状态: order_no={order_no}, status={status}, remark={remark}")
            
            order = self.db.query(StaticOrder).filter_by(order_no=order_no).first()
            if not order:
                logger.error(f"订单不存在: {order_no}")
                raise HTTPException(status_code=404, detail="订单不存在")
                
            order.status = status
            if remark:
                order.remark = remark
            
            try:
                self.db.commit()
                logger.info(f"订单状态更新成功: {order.to_dict()}")
                
                return {
                    'code': 0,
                    'msg': 'success',
                    'data': order.to_dict()
                }
                
            except SQLAlchemyError as e:
                self.db.rollback()
                logger.error(f"更新订单状态失败: {str(e)}")
                raise HTTPException(status_code=500, detail="更新订单状态失败")

        except HTTPException as e:
            raise e
        except Exception as e:
            logger.error(f"更新订单状态时发生未知错误: {str(e)}")
            logger.exception(e)
            raise HTTPException(status_code=500, detail="系统错误")
            
    async def handle_callback(
        self,
        type: str,
        no: str,
        op: str
    ) -> Dict[str, Any]:
        """处理回调请求
        
        Args:
            type: 回调类型(order=订单,instance=实例)
            no: 订单号或实例号
            op: 操作类型(1=创建,2=续费,3=释放)
            
        Returns:
            Dict: 处理结果
        """
        logger = logging.getLogger(__name__)
        logger.info(f"[StaticOrderService] 收到回调请求: type={type}, no={no}, op={op}")
        
        try:
            if type == 'order':
                # 查询订单信息
                order = self.db.query(StaticOrder).filter_by(order_no=no).first()
                if not order:
                    logger.error(f"[StaticOrderService] 订单不存在: {no}")
                    return {'code': 'failed', 'msg': '订单不存在'}
                    
                logger.info(f"[StaticOrderService] 找到订单: {order.order_no}, 当前状态: {order.status}")
                
                # 查询IPIPV平台订单信息
                order_info = await self.ipipv_api._make_request(
                    "api/open/app/instance/query/v2",
                    {"orderNo": no}
                )
                logger.info(f"[StaticOrderService] IPIPV平台订单信息: {order_info}")
                
                if not order_info:
                    logger.error(f"[StaticOrderService] 获取IPIPV平台订单信息失败: {no}")
                    return {'code': 'failed', 'msg': '获取订单信息失败'}

                # 更新订单状态
                old_status = order.status
                if op == '1':  # 创建
                    order.status = 'success' if order_info.get('status') == 'success' else 'failed'
                elif op == '2':  # 续费
                    order.status = 'renewed'
                elif op == '3':  # 释放
                    order.status = 'released'
                
                logger.info(f"[StaticOrderService] 更新订单状态: {old_status} -> {order.status}")
                order.callback_count += 1
                order.last_callback_time = datetime.now()

                # 创建实例记录
                if order.status == 'success' and order_info.get('instances'):
                    logger.info(f"[StaticOrderService] 开始处理实例信息: {len(order_info['instances'])} 个实例")
                    for inst_info in order_info['instances']:
                        # 检查实例是否已存在
                        existing_instance = self.db.query(Instance).filter_by(
                            instance_no=inst_info['instanceNo']
                        ).first()
                        
                        if existing_instance:
                            # 更新现有实例
                            logger.info(f"[StaticOrderService] 更新实例: {inst_info['instanceNo']}")
                            existing_instance.proxy_ip = inst_info['proxyIp']
                            existing_instance.proxy_port = inst_info['proxyPort']
                            existing_instance.username = inst_info['username']
                            existing_instance.password = inst_info['password']
                            existing_instance.expire_time = datetime.fromisoformat(
                                inst_info['expireTime'].replace('Z', '+00:00')
                            )
                            existing_instance.status = 1
                        else:
                            # 创建新实例
                            logger.info(f"[StaticOrderService] 创建新实例: {inst_info['instanceNo']}")
                            instance = Instance(
                                instance_no=inst_info['instanceNo'],
                                order_no=order.order_no,
                                user_id=order.user_id,
                                proxy_ip=inst_info['proxyIp'],
                                proxy_port=inst_info['proxyPort'],
                                username=inst_info['username'],
                                password=inst_info['password'],
                                expire_time=datetime.fromisoformat(
                                    inst_info['expireTime'].replace('Z', '+00:00')
                                ),
                                status=1
                            )
                            self.db.add(instance)

                try:
                    self.db.commit()
                    logger.info(f"[StaticOrderService] 回调处理成功: order_no={order.order_no}, status={order.status}")
                except SQLAlchemyError as e:
                    self.db.rollback()
                    logger.error(f"[StaticOrderService] 数据库操作失败: {str(e)}")
                    return {'code': 'failed', 'msg': '数据库操作失败'}

            elif type == 'instance':
                instance = self.db.query(Instance).filter_by(instance_no=no).first()
                if not instance:
                    logger.error(f"[StaticOrderService] 实例不存在: {no}")
                    return {'code': 'failed', 'msg': '实例不存在'}

                logger.info(f"[StaticOrderService] 找到实例: {instance.instance_no}, 当前状态: {instance.status}")

                # 更新实例状态
                old_status = instance.status
                if op == '1':  # 创建
                    instance.status = 1
                elif op == '2':  # 续费
                    instance.status = 1
                elif op == '3':  # 释放
                    instance.status = 0

                logger.info(f"[StaticOrderService] 更新实例状态: {old_status} -> {instance.status}")

                try:
                    self.db.commit()
                    logger.info(f"[StaticOrderService] 实例状态更新成功: instance_no={no}, status={instance.status}")
                except SQLAlchemyError as e:
                    self.db.rollback()
                    logger.error(f"[StaticOrderService] 更新实例状态失败: {str(e)}")
                    return {'code': 'failed', 'msg': '更新实例状态失败'}

            return {'code': 'success', 'msg': 'ok'}

        except Exception as e:
            logger.error(f"[StaticOrderService] 处理回调请求时发生未知错误: {str(e)}")
            logger.exception(e)
            return {'code': 'failed', 'msg': str(e)}

    async def query_products(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """查询产品信息"""
        try:
            logger.info("[StaticOrderService] 开始查询产品信息")
            logger.debug(f"[StaticOrderService] 查询参数: {params}")
            
            # 调用 IPIPV API 查询产品信息
            result = await self.ipipv_api._make_request(
                "/api/open/app/product/query/v2",
                params
            )
            
            logger.info(f"[StaticOrderService] 产品查询结果: {result}")
            
            if not result:
                logger.error("[StaticOrderService] 产品查询失败: 未收到响应数据")
                raise HTTPException(status_code=500, detail="产品查询失败")
                
            return {
                "code": 0,
                "msg": "success",
                "data": result
            }
            
        except Exception as e:
            logger.error(f"[StaticOrderService] 查询产品信息失败: {str(e)}")
            logger.exception(e)
            raise HTTPException(status_code=500, detail=f"查询产品信息失败: {str(e)}")

    async def sync_product_inventory(self) -> bool:
        """同步产品库存"""
        try:
            logger.info("[StaticOrderService] 开始同步产品库存")
            
            # 调用IPIPV API获取产品列表
            api_response = await self.ipipv_api._make_request(
                "/api/open/app/product/query/v2",
                {
                    "proxyType": [103]  # 静态国外家庭代理
                }
            )
            
            if not api_response:
                logger.error("[StaticOrderService] 获取产品列表失败")
                return False
            
            # 处理API响应数据
            try:
                if isinstance(api_response, str):
                    result = json.loads(api_response)
                else:
                    result = api_response
                
                # 检查响应格式并提取数据
                if isinstance(result, dict):
                    if 'data' in result:
                        product_list = result['data']
                        if isinstance(product_list, str):
                            product_list = json.loads(product_list)
                    else:
                        logger.error("[StaticOrderService] API响应缺少data字段")
                        return False
                else:
                    product_list = result
                
                if not isinstance(product_list, list):
                    logger.error(f"[StaticOrderService] 产品数据类型错误: {type(product_list)}")
                    return False
                    
            except json.JSONDecodeError as e:
                logger.error(f"[StaticOrderService] 解析产品数据失败: {str(e)}")
                return False
                
            # 更新本地数据库
            for product in product_list:
                if not isinstance(product, dict):
                    logger.warning(f"[StaticOrderService] 跳过无效的产品数据: {product}")
                    continue
                    
                try:
                    product_no = str(product.get('productNo', ''))
                    if not product_no:
                        logger.warning("[StaticOrderService] 产品编号为空，跳过")
                        continue
                        
                    existing = self.db.query(ProductInventory).filter_by(
                        product_no=product_no
                    ).first()
                    
                    product_data = {
                        'product_no': product_no,
                        'product_name': str(product.get('productName', '')),
                        'proxy_type': product.get('proxyType'),
                        'use_type': product.get('useType'),
                        'protocol': product.get('protocol'),
                        'use_limit': product.get('useLimit'),
                        'sell_limit': product.get('sellLimit'),
                        'area_code': str(product.get('areaCode', '')),
                        'country_code': str(product.get('countryCode', '')),
                        'state_code': str(product.get('stateCode', '')),
                        'city_code': str(product.get('cityCode', '')),
                        'detail': str(product.get('detail', '')),
                        'cost_price': float(product.get('costPrice', 0)),
                        'inventory': int(product.get('inventory', 0)),
                        'ip_type': product.get('ipType'),
                        'isp_type': product.get('ispType'),
                        'net_type': product.get('netType'),
                        'duration': product.get('duration'),
                        'unit': product.get('unit'),
                        'band_width': product.get('bandWidth'),
                        'band_width_price': product.get('bandWidthPrice'),
                        'max_band_width': product.get('maxBandWidth'),
                        'flow': product.get('flow'),
                        'cpu': product.get('cpu'),
                        'memory': product.get('memory'),
                        'enable': product.get('enable', 1),
                        'supplier_code': product.get('supplierCode'),
                        'ip_count': product.get('ipCount'),
                        'ip_duration': product.get('ipDuration'),
                        'assign_ip': product.get('assignIp', -1),
                        'cidr_status': product.get('cidrStatus', -1),
                        'static_type': product.get('staticType'),
                        'last_sync_time': datetime.now(),
                        'ip_start': product.get('ipStart'),
                        'ip_end': product.get('ipEnd')
                    }
                    
                    if existing:
                        # 更新现有记录
                        for key, value in product_data.items():
                            setattr(existing, key, value)
                    else:
                        # 创建新记录
                        new_product = ProductInventory(**product_data)
                        self.db.add(new_product)
                    
                except Exception as e:
                    logger.error(f"[StaticOrderService] 处理产品数据失败: {str(e)}")
                    logger.exception(e)
                    continue
            
            try:
                self.db.commit()
                logger.info("[StaticOrderService] 产品库存同步成功")
                return True
            except SQLAlchemyError as e:
                self.db.rollback()
                logger.error(f"[StaticOrderService] 数据库操作失败: {str(e)}")
                return False
                
        except Exception as e:
            logger.error(f"[StaticOrderService] 同步产品库存失败: {str(e)}")
            logger.exception(e)
            return False

    async def list_orders(
        self,
        user_id: int,
        page: int = 1,
        page_size: int = 10
    ) -> Dict[str, Any]:
        """获取订单列表"""
        try:
            # 计算分页
            offset = (page - 1) * page_size

            # 查询总数
            total = self.db.query(StaticOrder).filter(
                StaticOrder.user_id == user_id
            ).count()

            # 查询订单列表
            orders = self.db.query(StaticOrder).filter(
                StaticOrder.user_id == user_id
            ).order_by(
                StaticOrder.created_at.desc()
            ).offset(offset).limit(page_size).all()

            # 转换为字典格式
            order_list = [order.to_dict() for order in orders]

            return {
                'code': 0,
                'msg': 'success',
                'data': {
                    'total': total,
                    'list': order_list,
                    'page': page,
                    'page_size': page_size
                }
            }

        except Exception as e:
            logger.error(f"获取订单列表失败: {str(e)}")
            logger.exception(e)
            raise HTTPException(status_code=500, detail="获取订单列表失败") 
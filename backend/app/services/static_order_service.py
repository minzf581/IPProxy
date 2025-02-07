from typing import Dict, Any, Optional, List
from sqlalchemy.orm import Session
from datetime import datetime
import logging
from app.models.static_order import StaticOrder
from app.models.instance import Instance
from app.models.user import User
from app.services.ipipv_base_api import IPIPVBaseAPI
from app.services.payment_service import PaymentService
from app.core.config import settings
from fastapi import HTTPException
import uuid
from sqlalchemy.exc import SQLAlchemyError
import json

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
        """创建静态代理订单"""
        logger = logging.getLogger(__name__)
        logger.info(f"[StaticOrderService] 开始创建静态代理订单: user_id={user_id}, agent_id={agent_id}")
        logger.debug(f"[StaticOrderService] 订单数据: {order_data}")
        
        try:
            # 生成订单号
            order_no = self.generate_order_no()
            logger.info(f"[StaticOrderService] 生成订单号: {order_no}")
            
            # 检查用户余额
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                logger.error(f"[StaticOrderService] 用户不存在: {user_id}")
                raise HTTPException(status_code=404, detail="用户不存在")
                
            logger.info(f"[StaticOrderService] 用户当前余额: {user.balance}")
            amount = order_data.get('total_cost', 0)
            if user.balance < amount:
                logger.error(f"[StaticOrderService] 用户余额不足: balance={user.balance}, amount={amount}")
                raise HTTPException(status_code=400, detail="余额不足")
            
            # 调用支付服务处理支付
            logger.info(f"[StaticOrderService] 开始处理支付，金额: {amount}")
            payment_service = PaymentService(self.db)
            payment_result = await payment_service.process_order_payment(
                user_id=user_id,
                agent_id=agent_id,
                order_no=order_no,
                amount=amount
            )
            logger.info(f"[StaticOrderService] 支付处理结果: {payment_result}")
            
            if payment_result.get('code') != 0:
                logger.error(f"[StaticOrderService] 支付失败: {payment_result}")
                raise HTTPException(status_code=500, detail=payment_result.get('msg', '支付失败'))
            
            try:
                # 先查询产品信息
                logger.info("[StaticOrderService] 开始查询产品信息")
                product_result = await self.ipipv_api._make_request(
                    "/api/open/app/product/query/v2",
                    {
                        "proxyType": [103]
                    }
                )
                logger.info(f"[StaticOrderService] 产品信息查询结果: {product_result}")

                if not product_result or product_result == "null":
                    logger.error(f"[StaticOrderService] 产品信息查询失败，产品编号: {order_data.get('product_no')}")
                    # 发起退款
                    await payment_service.refund_order(
                        user_id=user_id,
                        agent_id=agent_id,
                        order_no=order_no,
                        amount=amount,
                        remark=f"产品信息查询失败，产品编号 {order_data.get('product_no')} 不存在"
                    )
                    raise HTTPException(status_code=500, detail=f"产品信息查询失败，产品编号 {order_data.get('product_no')} 不存在")

                # 解析产品信息
                try:
                    if isinstance(product_result, str):
                        product_result = json.loads(product_result)
                except json.JSONDecodeError:
                    logger.error(f"[StaticOrderService] 解析产品信息失败: {product_result}")
                    await payment_service.refund_order(
                        user_id=user_id,
                        agent_id=agent_id,
                        order_no=order_no,
                        amount=amount,
                        remark="解析产品信息失败"
                    )
                    raise HTTPException(status_code=500, detail="解析产品信息失败")

                # 检查产品是否存在
                product_no = order_data.get('product_no')
                product_found = False
                if isinstance(product_result, list):
                    for product in product_result:
                        if product.get('productNo') == product_no:
                            product_found = True
                            break

                if not product_found:
                    logger.error(f"[StaticOrderService] 产品不存在: {product_no}")
                    await payment_service.refund_order(
                        user_id=user_id,
                        agent_id=agent_id,
                        order_no=order_no,
                        amount=amount,
                        remark=f"产品不存在: {product_no}"
                    )
                    raise HTTPException(status_code=500, detail=f"产品不存在: {product_no}")

                # 调用 IPIPV API 创建订单
                logger.info("[StaticOrderService] 开始调用 IPIPV API 创建订单")
                api_params = {
                    "appOrderNo": order_data.get('app_order_no', order_no),
                    "params": [{
                        "orderNo": order_no,
                        "productNo": order_data.get('product_no'),
                        "quantity": order_data.get('ip_count'),
                        "duration": order_data.get('duration'),
                        "username": username,
                        "regionCode": order_data.get('region_code'),
                        "countryCode": order_data.get('country_code'),
                        "cityCode": order_data.get('city_code'),
                        "staticType": order_data.get('static_type')
                    }]
                }
                logger.info(f"[StaticOrderService] IPIPV API 请求参数: {api_params}")
                api_result = await self.ipipv_api._make_request(
                    "/api/open/app/instance/open/v2",
                    api_params
                )
                logger.info(f"[StaticOrderService] IPIPV API 响应: {api_result}")
                
                if not api_result:
                    logger.error("[StaticOrderService] IPIPV API 调用失败")
                    # 发起退款
                    await payment_service.refund_order(
                        user_id=user_id,
                        agent_id=agent_id,
                        order_no=order_no,
                        amount=amount,
                        remark="API调用失败，自动退款"
                    )
                    raise HTTPException(status_code=500, detail="订单创建失败")
                    
                # 创建订单记录
                static_order = StaticOrder(
                    order_no=order_no,
                    app_order_no=order_data.get('app_order_no', order_no),
                    user_id=user_id,
                    agent_id=agent_id,
                    product_no=order_data.get('product_no'),
                    proxy_type=order_data.get('proxy_type'),
                    region_code=order_data.get('region_code'),
                    country_code=order_data.get('country_code'),
                    city_code=order_data.get('city_code'),
                    static_type=order_data.get('static_type'),
                    ip_count=order_data.get('ip_count'),
                    duration=order_data.get('duration'),
                    unit=order_data.get('unit', 1),
                    amount=amount,
                    status='processing'
                )
                
                self.db.add(static_order)
                self.db.commit()
                logger.info(f"[StaticOrderService] 订单创建成功: {order_no}")
                
                return {
                    "code": 0,
                    "msg": "success",
                    "data": static_order.to_dict()
                }
                
            except Exception as e:
                logger.error(f"[StaticOrderService] 创建订单失败: {str(e)}")
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
            logger.error(f"[StaticOrderService] 处理订单时发生错误: {str(e)}")
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
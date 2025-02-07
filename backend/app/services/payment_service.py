from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
from decimal import Decimal
import logging

from app.models.user import User
from app.models.transaction import Transaction
from app.models.static_order import StaticOrder
from fastapi import HTTPException

class PaymentService:
    def __init__(self, db: Session):
        self.db = db
        
    def generate_transaction_no(self) -> str:
        """生成交易编号"""
        return f"T{datetime.now().strftime('%Y%m%d%H%M%S')}{str(uuid.uuid4().int)[:6]}"
        
    async def process_order_payment(
        self,
        user_id: int,
        agent_id: int,
        order_no: str,
        amount: float,
        order_type: str = "static"
    ) -> Dict[str, Any]:
        """
        处理订单支付
        
        Args:
            user_id: 用户ID
            agent_id: 代理商ID
            order_no: 订单编号
            amount: 支付金额
            order_type: 订单类型(static=静态代理,dynamic=动态代理)
            
        Returns:
            Dict: 支付结果
        """
        logger = logging.getLogger(__name__)
        logger.info(f"[PaymentService] 开始处理订单支付: order_no={order_no}, amount={amount}")
        
        try:
            # 获取用户信息
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                logger.error(f"[PaymentService] 用户不存在: user_id={user_id}")
                raise HTTPException(status_code=404, detail="用户不存在")
                
            # 检查余额
            logger.info(f"[PaymentService] 用户当前余额: {user.balance}, 需支付金额: {amount}")
            if user.balance < amount:
                logger.error(f"[PaymentService] 用户余额不足: balance={user.balance}, amount={amount}")
                raise HTTPException(status_code=400, detail="余额不足")
                
            # 扣减余额
            original_balance = user.balance
            user.balance -= amount
            self.db.add(user)
            logger.info(f"[PaymentService] 扣减余额: {original_balance} -> {user.balance}")
            
            # 创建交易记录
            transaction = Transaction(
                transaction_no=self.generate_transaction_no(),
                user_id=user_id,
                agent_id=agent_id,
                order_no=order_no,
                amount=Decimal(str(amount)),
                balance=Decimal(str(user.balance)),
                type="consume",
                status="success",
                remark=f"购买{'静态' if order_type == 'static' else '动态'}代理"
            )
            self.db.add(transaction)
            logger.info(f"[PaymentService] 创建交易记录: transaction_no={transaction.transaction_no}")
            
            # 如果是静态代理订单，更新订单状态
            if order_type == "static":
                order = self.db.query(StaticOrder).filter(
                    StaticOrder.order_no == order_no
                ).first()
                if order:
                    order.status = "paid"
                    self.db.add(order)
                    logger.info(f"[PaymentService] 更新订单状态为已支付: order_no={order_no}")
                else:
                    logger.warning(f"[PaymentService] 未找到静态代理订单: order_no={order_no}")
            
            try:
                # 提交事务
                self.db.commit()
                logger.info("[PaymentService] 数据库事务提交成功")
                
                return {
                    "code": 0,
                    "msg": "支付成功",
                    "data": {
                        "transaction_no": transaction.transaction_no,
                        "amount": float(transaction.amount),
                        "balance": float(transaction.balance)
                    }
                }
            except Exception as e:
                logger.error(f"[PaymentService] 数据库事务提交失败: {str(e)}")
                self.db.rollback()
                raise
            
        except HTTPException as e:
            logger.error(f"[PaymentService] 支付处理失败(HTTP异常): {str(e)}")
            self.db.rollback()
            raise e
        except Exception as e:
            logger.error(f"[PaymentService] 支付处理失败(未知异常): {str(e)}")
            logger.exception(e)
            self.db.rollback()
            raise HTTPException(status_code=500, detail=f"支付失败: {str(e)}")
            
    async def refund_order(
        self,
        user_id: int,
        agent_id: int,
        order_no: str,
        amount: float,
        remark: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        订单退款
        
        Args:
            user_id: 用户ID
            agent_id: 代理商ID
            order_no: 订单编号
            amount: 退款金额
            remark: 退款备注
            
        Returns:
            Dict: 退款结果
        """
        try:
            # 获取用户信息
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                raise HTTPException(status_code=404, detail="用户不存在")
                
            # 增加余额
            user.balance += amount
            self.db.add(user)
            
            # 创建退款交易记录
            transaction = Transaction(
                transaction_no=self.generate_transaction_no(),
                user_id=user_id,
                agent_id=agent_id,
                order_no=order_no,
                amount=Decimal(str(amount)),
                balance=Decimal(str(user.balance)),
                type="refund",
                status="success",
                remark=remark or "订单退款"
            )
            self.db.add(transaction)
            
            # 提交事务
            self.db.commit()
            
            return {
                "code": 0,
                "msg": "退款成功",
                "data": {
                    "transaction_no": transaction.transaction_no,
                    "amount": float(transaction.amount),
                    "balance": float(transaction.balance)
                }
            }
            
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=f"退款失败: {str(e)}")
            
    def get_transaction_history(
        self,
        user_id: Optional[int] = None,
        agent_id: Optional[int] = None,
        type: Optional[str] = None,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Dict[str, Any]:
        """
        获取交易历史
        
        Args:
            user_id: 用户ID
            agent_id: 代理商ID
            type: 交易类型
            start_time: 开始时间
            end_time: 结束时间
            page: 页码
            page_size: 每页数量
            
        Returns:
            Dict: 交易历史列表
        """
        try:
            # 构建查询
            query = self.db.query(Transaction)
            
            # 添加过滤条件
            if user_id:
                query = query.filter(Transaction.user_id == user_id)
            if agent_id:
                query = query.filter(Transaction.agent_id == agent_id)
            if type:
                query = query.filter(Transaction.type == type)
            if start_time:
                query = query.filter(Transaction.created_at >= start_time)
            if end_time:
                query = query.filter(Transaction.created_at <= end_time)
                
            # 计算总数
            total = query.count()
            
            # 分页
            transactions = query.order_by(Transaction.created_at.desc()) \
                .offset((page - 1) * page_size) \
                .limit(page_size) \
                .all()
                
            return {
                "code": 0,
                "msg": "success",
                "data": {
                    "list": [t.to_dict() for t in transactions],
                    "total": total,
                    "page": page,
                    "page_size": page_size
                }
            }
            
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"获取交易历史失败: {str(e)}") 
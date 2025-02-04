from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from app.database import get_db
from app.models.transaction import Transaction
from app.models.user import User
from app.services.auth import get_current_user
from sqlalchemy import and_

router = APIRouter(prefix="/open/app")

@router.get("/agent/transactions")
async def get_agent_transactions(
    order_no: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    page: int = Query(1, gt=0),
    page_size: int = Query(10, gt=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    获取代理商额度记录
    :param order_no: 订单号
    :param start_date: 开始日期
    :param end_date: 结束日期
    :param page: 页码
    :param page_size: 每页数量
    :return: 额度记录列表
    """
    try:
        # 验证用户是否为代理商
        if current_user.agent_id is not None:
            raise HTTPException(status_code=403, detail="只有代理商可以访问此接口")

        # 构建查询条件
        query = db.query(Transaction).filter(Transaction.user_id == current_user.id)

        if order_no:
            query = query.filter(Transaction.order_no.like(f"%{order_no}%"))

        if start_date:
            start_datetime = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(Transaction.created_at >= start_datetime)

        if end_date:
            end_datetime = datetime.strptime(end_date, "%Y-%m-%d")
            query = query.filter(Transaction.created_at <= end_datetime)

        # 计算总数
        total = query.count()

        # 分页
        transactions = query.order_by(Transaction.created_at.desc()) \
            .offset((page - 1) * page_size) \
            .limit(page_size) \
            .all()

        return {
            "code": 0,
            "message": "success",
            "data": {
                "total": total,
                "items": [transaction.to_dict() for transaction in transactions],
                "page": page,
                "page_size": page_size
            }
        }

    except Exception as e:
        return {
            "code": 500,
            "message": str(e)
        } 
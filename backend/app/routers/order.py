# 订单管理路由模块
# ==============
#
# 此模块处理所有与订单相关的路由请求，包括：
# - 动态订单管理（创建、查询、更新）
# - 订单状态追踪
# - 订单统计分析
# - 权限控制
#
# 重要提示：
# ---------
# 1. 订单是系统的核心业务数据，需要确保数据的准确性和完整性
# 2. 所有订单操作都需要进行权限验证
# 3. 关键操作需要记录详细的日志
#
# 依赖关系：
# ---------
# - 数据模型：
#   - User (app/models/user.py)
#   - DynamicOrder (app/models/dynamic_order.py)
# - 服务：
#   - AuthService (app/services/auth.py)
#
# 前端对应：
# ---------
# - 服务层：src/services/orderService.ts
# - 页面组件：src/pages/order/index.tsx
# - 类型定义：src/types/order.ts
#
# 数据流：
# -------
# 1. 订单查询流程：
#    - 验证用户权限
#    - 构建查询条件
#    - 应用过滤和分页
#    - 返回订单列表
#
# 2. 订单详情流程：
#    - 验证用户权限
#    - 获取订单信息
#    - 检查访问权限
#    - 返回订单详情
#
# 修改注意事项：
# ------------
# 1. 权限控制：
#    - 代理商只能查看自己的订单
#    - 普通用户只能查看自己的订单
#    - 管理员可以查看所有订单
#
# 2. 数据过滤：
#    - 支持多种过滤条件
#    - 注意日期格式处理
#    - 合理的分页大小
#
# 3. 错误处理：
#    - 详细的错误日志
#    - 友好的错误提示
#    - 统一的错误响应格式
#
# 4. 性能优化：
#    - 合理使用数据库索引
#    - 避免大量数据查询
#    - 优化查询条件

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.dynamic_order import DynamicOrder
from app.services.auth import get_current_user
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy import or_
import logging

# 设置日志记录器
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/orders")

@router.get("/dynamic")
async def get_dynamic_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    user_id: Optional[int] = None,
    order_no: Optional[str] = None,
    pool_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """获取动态订单列表"""
    try:
        logger.debug(f"开始获取动态订单列表: user_id={current_user.id}, is_agent={current_user.is_agent}")
        logger.debug(f"查询参数: page={page}, page_size={page_size}, user_id={user_id}, order_no={order_no}, pool_type={pool_type}")
        
        # 构建查询条件
        query = db.query(DynamicOrder)
        
        # 代理商只能查看自己的订单
        if current_user.is_agent:
            logger.debug(f"代理商查询自己的订单: agent_id={current_user.id}")
            query = query.filter(DynamicOrder.agent_id == current_user.id)
        
        # 应用过滤条件
        if user_id:
            query = query.filter(DynamicOrder.user_id == user_id)
        if order_no:
            query = query.filter(DynamicOrder.order_no.like(f"%{order_no}%"))
        if pool_type:
            query = query.filter(DynamicOrder.pool_type == pool_type)
            
        # 日期范围过滤
        if start_date:
            query = query.filter(DynamicOrder.created_at >= datetime.strptime(start_date, "%Y-%m-%d"))
        if end_date:
            query = query.filter(DynamicOrder.created_at <= datetime.strptime(end_date, "%Y-%m-%d 23:59:59"))
        
        # 计算总数
        total = query.count()
        logger.debug(f"查询到订单总数: {total}")
        
        # 分页并按创建时间倒序排序
        orders = query.order_by(DynamicOrder.created_at.desc())\
                     .offset((page - 1) * page_size)\
                     .limit(page_size)\
                     .all()
        
        # 转换订单数据
        order_list = [order.to_dict() for order in orders]
        logger.debug(f"订单列表数据: {order_list}")
        
        result = {
            "code": 0,
            "message": "获取成功",
            "data": {
                "list": order_list,
                "total": total,
                "page": page,
                "page_size": page_size
            }
        }
        logger.debug(f"返回数据: {result}")
        return result
    except Exception as e:
        logger.error(f"获取动态订单列表失败: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail={"code": 500, "message": str(e)})

@router.get("/dynamic/{order_id}")
async def get_dynamic_order_detail(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """获取动态订单详情"""
    try:
        order = db.query(DynamicOrder).filter(DynamicOrder.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail={"code": 404, "message": "订单不存在"})
        
        # 检查权限
        if not current_user.is_admin:
            if current_user.is_agent and order.agent_id != current_user.id:
                raise HTTPException(status_code=403, detail={"code": 403, "message": "无权访问此订单"})
            if not current_user.is_agent and order.user_id != current_user.id:
                raise HTTPException(status_code=403, detail={"code": 403, "message": "无权访问此订单"})
        
        return {
            "code": 0,
            "message": "获取成功",
            "data": order.to_dict()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail={"code": 500, "message": str(e)}) 
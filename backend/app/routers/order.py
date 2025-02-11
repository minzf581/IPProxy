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

from fastapi import APIRouter, Depends, HTTPException, Query, status, Request, Body
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.dynamic_order import DynamicOrder
from app.models.static_order import StaticOrder
from app.models.instance import Instance
from app.services.auth import get_current_user
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy import or_
import logging
import traceback
from pydantic import BaseModel
import json
import uuid
import time
import random
from app.schemas.order import CreateOrderRequest, OrderListResponse, OrderDetailResponse

# 设置日志记录器
logger = logging.getLogger(__name__)

# 定义响应模型
class OrderData(BaseModel):
    id: int
    orderNo: str
    appOrderNo: str
    userId: int
    agentId: int
    productNo: str
    proxyType: int
    regionCode: Optional[str] = None
    countryCode: Optional[str] = None
    cityCode: Optional[str] = None
    staticType: Optional[str] = None
    ipCount: int
    duration: int
    unit: int
    amount: float
    status: str
    callbackCount: int
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None
    orderType: str

class OrderListResponse(BaseModel):
    code: int
    msg: str
    data: Dict[str, Any]

class CreateOrderRequest(BaseModel):
    orderType: str  # 'dynamic_proxy' or 'static_proxy'
    poolId: str
    trafficAmount: Optional[int] = None
    unitPrice: float
    totalAmount: float
    remark: Optional[str] = None
    userId: int  # 添加用户ID字段
    regionCode: Optional[str] = None
    countryCode: Optional[str] = None
    cityCode: Optional[str] = None
    staticType: Optional[str] = None
    ipCount: int
    duration: int

# 修改路由前缀
router = APIRouter()

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
        
        # 构建基础查询
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
        
        # 分页并按创建时间倒序排序，同时获取用户信息
        orders = query.order_by(DynamicOrder.created_at.desc())\
                     .offset((page - 1) * page_size)\
                     .limit(page_size)\
                     .all()
        
        # 获取所有相关的用户ID
        user_ids = [order.user_id for order in orders]
        agent_ids = [order.agent_id for order in orders]
        logger.debug(f"订单用户ID列表: {user_ids}")
        logger.debug(f"订单代理商ID列表: {agent_ids}")
        
        # 批量查询用户信息
        users = db.query(User).filter(User.id.in_(user_ids)).all()
        user_map = {user.id: user.username for user in users}
        logger.debug(f"用户ID-用户名映射: {user_map}")
        
        # 转换订单数据，只包含用户信息
        order_list = []
        for order in orders:
            order_dict = order.to_dict()
            user_name = user_map.get(order.user_id)
            logger.debug(f"处理订单: order_id={order.id}, user_id={order.user_id}")
            logger.debug(f"用户名映射: user_name={user_name}")
            
            # 只添加用户名
            order_dict['username'] = user_name or f'用户{order.user_id}'
            order_list.append(order_dict)
            
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

@router.post("/open/app/order/v2", response_model=OrderListResponse)
async def get_orders(
    request: Request,
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取订单列表"""
    try:
        logger.info(f"[Order Service] 开始获取订单列表, 当前用户: {current_user.username}, is_admin={current_user.is_admin}, is_agent={current_user.is_agent}")
        logger.info(f"[Order Service] 分页参数: page={page}, size={size}")
        
        # 构建查询条件
        static_conditions = []
        dynamic_conditions = []
        
        # 权限处理
        if not current_user.is_admin:
            if current_user.is_agent:
                logger.info(f"[Order Service] 代理商查询自己的订单: agent_id={current_user.id}")
                static_conditions.append(StaticOrder.agent_id == current_user.id)
                dynamic_conditions.append(DynamicOrder.agent_id == current_user.id)
            else:
                logger.info(f"[Order Service] 普通用户查询自己的订单: user_id={current_user.id}")
                static_conditions.append(StaticOrder.user_id == current_user.id)
                dynamic_conditions.append(DynamicOrder.user_id == current_user.id)
        
        # 查询静态订单
        static_query = db.query(StaticOrder)
        if static_conditions:
            static_query = static_query.filter(*static_conditions)
        static_orders = static_query.all()
        logger.info(f"[Order Service] 查询到静态订单数量: {len(static_orders)}")
        
        # 查询动态订单
        dynamic_query = db.query(DynamicOrder)
        if dynamic_conditions:
            dynamic_query = dynamic_query.filter(*dynamic_conditions)
        dynamic_orders = dynamic_query.all()
        logger.info(f"[Order Service] 查询到动态订单数量: {len(dynamic_orders)}")
        
        # 合并订单列表
        order_list = []
        
        # 添加静态订单
        for order in static_orders:
            try:
                order_dict = order.to_dict()
                order_dict["orderType"] = "static"
                order_list.append(order_dict)
            except Exception as e:
                logger.error(f"[Order Service] 转换静态订单失败: {str(e)}")
                continue
            
        # 添加动态订单
        for order in dynamic_orders:
            try:
                order_dict = order.to_dict()
                order_dict["orderType"] = "dynamic"
                order_list.append(order_dict)
            except Exception as e:
                logger.error(f"[Order Service] 转换动态订单失败: {str(e)}")
                continue
            
        # 按创建时间倒序排序
        order_list.sort(key=lambda x: x.get("createdAt", "") or "", reverse=True)
        
        # 计算总数
        total = len(order_list)
        logger.info(f"[Order Service] 返回订单总数: {total}")
        
        # 分页处理
        start_idx = (page - 1) * size
        end_idx = start_idx + size
        paginated_list = order_list[start_idx:end_idx]
        
        logger.info(f"[Order Service] 分页后返回订单数量: {len(paginated_list)}")
        
        return {
            "code": 0,
            "msg": "success",
            "data": {
                "total": total,
                "list": paginated_list,
                "page": page,
                "size": size
            }
        }
    except Exception as e:
        logger.error(f"[Order Service] 获取订单列表失败: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail={"code": 500, "message": f"获取订单列表失败: {str(e)}"}
        )

@router.get("/open/app/location/options/v2")
async def get_location_options(
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """获取位置选项"""
    try:
        # 返回预设的位置选项
        options = {
            "regions": [
                {"code": "NA", "name": "北美"},
                {"code": "EU", "name": "欧洲"},
                {"code": "AS", "name": "亚洲"},
                {"code": "SA", "name": "南美"},
                {"code": "AF", "name": "非洲"},
                {"code": "OC", "name": "大洋洲"}
            ],
            "countries": [
                {"code": "US", "name": "美国", "region": "NA"},
                {"code": "CA", "name": "加拿大", "region": "NA"},
                {"code": "GB", "name": "英国", "region": "EU"},
                {"code": "DE", "name": "德国", "region": "EU"},
                {"code": "FR", "name": "法国", "region": "EU"},
                {"code": "JP", "name": "日本", "region": "AS"},
                {"code": "KR", "name": "韩国", "region": "AS"},
                {"code": "SG", "name": "新加坡", "region": "AS"}
            ],
            "cities": [
                {"code": "NYC", "name": "纽约", "country": "US"},
                {"code": "LAX", "name": "洛杉矶", "country": "US"},
                {"code": "TOR", "name": "多伦多", "country": "CA"},
                {"code": "LON", "name": "伦敦", "country": "GB"}
            ]
        }
        
        return {
            "code": 0,
            "msg": "success",
            "data": options
        }
        
    except Exception as e:
        logger.error(f"获取位置选项失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/open/app/order/create/v2", response_model=OrderListResponse)
async def create_order(
    request: CreateOrderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """创建订单"""
    try:
        logger.info(f"[Order Service] 开始创建订单, 当前用户: {current_user.username}, is_admin={current_user.is_admin}, is_agent={current_user.is_agent}")
        logger.info(f"[Order Service] 订单数据: {request}")
        
        # 检查用户余额
        if current_user.balance < request.totalAmount:
            raise HTTPException(
                status_code=400,
                detail={"code": 400, "message": "余额不足"}
            )
            
        # 验证目标用户是否存在
        target_user = db.query(User).filter(User.id == request.userId).first()
        if not target_user:
            raise HTTPException(
                status_code=400,
                detail={"code": 400, "message": "目标用户不存在"}
            )
            
        # 如果是代理商，验证目标用户是否是其下属用户
        if current_user.is_agent and target_user.agent_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail={"code": 403, "message": "无权为此用户创建订单"}
            )
            
        # 创建订单
        if request.orderType == "dynamic_proxy":
            # 生成订单号
            order_no = f"DYN{datetime.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6]}"
            app_order_no = f"APP{datetime.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6]}"
            
            order = DynamicOrder(
                id=str(uuid.uuid4()),  # 使用UUID作为主键
                order_no=order_no,
                app_order_no=app_order_no,
                user_id=request.userId,  # 使用传入的用户ID
                agent_id=target_user.agent_id,  # 使用目标用户的代理商ID
                pool_type=request.poolId,
                traffic=request.trafficAmount,
                unit_price=request.unitPrice,
                total_amount=request.totalAmount,
                proxy_type="dynamic",
                status="active",
                remark=request.remark
            )
        else:
            # 生成订单号
            order_no = f"STA{datetime.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6]}"
            app_order_no = f"APP{datetime.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6]}"
            
            order = StaticOrder(
                order_no=order_no,
                app_order_no=app_order_no,
                user_id=request.userId,  # 使用传入的用户ID
                agent_id=target_user.agent_id,  # 使用目标用户的代理商ID
                product_no=request.poolId,  # 使用poolId作为product_no
                proxy_type=103,  # 静态国外家庭代理
                region_code=request.regionCode,  # 区域代码
                country_code=request.countryCode,  # 国家代码
                city_code=request.cityCode,  # 城市代码
                static_type=request.staticType,  # 静态类型
                ip_count=request.ipCount,  # IP数量
                duration=request.duration,  # 时长
                unit=1,  # 单位：天
                amount=request.totalAmount,  # 总金额
                status="active",  # 订单状态
                remark=request.remark  # 备注
            )
            
        # 扣除用户余额
        current_user.balance -= request.totalAmount
        
        # 保存到数据库
        db.add(order)
        db.commit()
        db.refresh(order)
        
        logger.info(f"[Order Service] 订单创建成功: {order.id}")
        
        return {
            "code": 0,
            "msg": "订单创建成功",
            "data": order.to_dict()
        }
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"[Order Service] 订单创建失败: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail={"code": 500, "message": f"订单创建失败: {str(e)}"}
        )

@router.post("/open/app/static/order/create/v2", response_model=OrderListResponse)
async def create_static_order(
    request: CreateOrderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """创建静态订单"""
    try:
        logger.info(f"创建静态订单，参数: {request}")
        
        # 检查用户余额
        if current_user.balance < request.totalAmount:
            raise HTTPException(
                status_code=400,
                detail="余额不足"
            )
            
        # 检查用户是否存在
        target_user = db.query(User).filter(User.id == request.userId).first()
        if not target_user:
            raise HTTPException(
                status_code=404,
                detail="用户不存在"
            )
            
        # 如果是代理商，只能为自己的下级用户创建订单
        if current_user.is_agent and target_user.agent_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="只能为下级用户创建订单"
            )
            
        # 生成订单号
        order_no = f"ST{int(time.time())}{random.randint(1000, 9999)}"
        
        # 创建静态订单
        order = StaticOrder(
            order_no=order_no,
            user_id=request.userId,
            agent_id=current_user.id if current_user.is_agent else None,
            product_no=request.poolId,
            proxy_type=103,  # 静态代理类型
            region_code=request.regionCode,
            country_code=request.countryCode,
            city_code=request.cityCode,
            static_type=request.staticType,
            ip_count=request.ipCount,
            duration=request.duration,
            unit=1,  # 单位：天
            amount=request.totalAmount,
            status="active",
            remark=request.remark
        )
        
        db.add(order)
        db.commit()
        
        return {
            "code": 0,
            "msg": "success",
            "data": order.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"创建静态订单失败: {str(e)}")
        logger.exception(e)
        raise HTTPException(
            status_code=500,
            detail="创建订单失败"
        )

@router.get("/open/app/static/order/list/v2", response_model=OrderListResponse)
async def get_static_orders(
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100),
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取静态订单列表"""
    try:
        query = db.query(StaticOrder)
        
        # 如果是代理商，只能查看自己的订单
        if current_user.is_agent:
            query = query.filter(StaticOrder.agent_id == current_user.id)
            
        # 状态过滤
        if status:
            query = query.filter(StaticOrder.status == status)
            
        # 计算总数
        total = query.count()
        
        # 分页
        orders = query.order_by(StaticOrder.created_at.desc()).offset((page - 1) * pageSize).limit(pageSize).all()
        
        return {
            "code": 0,
            "msg": "success",
            "data": {
                "list": [order.to_dict() for order in orders],
                "total": total
            }
        }
        
    except Exception as e:
        logger.error(f"获取静态订单列表失败: {str(e)}")
        logger.exception(e)
        raise HTTPException(
            status_code=500,
            detail="获取订单列表失败"
        )

@router.get("/open/app/static/order/detail/v2/{order_no}", response_model=OrderDetailResponse)
async def get_static_order_detail(
    order_no: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取静态订单详情"""
    try:
        # 查询订单
        order = db.query(StaticOrder).filter(StaticOrder.order_no == order_no).first()
        
        if not order:
            raise HTTPException(
                status_code=404,
                detail="订单不存在"
            )
            
        # 如果是代理商，只能查看自己的订单
        if current_user.is_agent and order.agent_id != current_user.id:
            raise HTTPException(
                status_code=403,
                detail="无权查看该订单"
            )
            
        return {
            "code": 0,
            "msg": "success",
            "data": order.to_dict()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取静态订单详情失败: {str(e)}")
        logger.exception(e)
        raise HTTPException(
            status_code=500,
            detail="获取订单详情失败"
        ) 
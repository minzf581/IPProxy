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
from sqlalchemy import or_
from app.database import get_db
from app.models.user import User
from app.models.dynamic_order import DynamicOrder
from app.models.static_order import StaticOrder
from app.models.instance import Instance
from app.services.auth import get_current_user
from app.services.ipipv_service import IPIPVService
from typing import Dict, Any, List, Optional
from datetime import datetime
import logging
import traceback
from pydantic import BaseModel, Field, validator
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

class AddTrafficRequest(BaseModel):
    appOrderNo: str = Field(..., description="订单号")
    productNo: str = Field(..., description="产品编号")
    proxyType: int = Field(..., description="代理类型")
    appUsername: str = Field(..., description="用户名")
    traffic: int = Field(..., gt=0, description="流量大小(MB)")

    @validator('appOrderNo')
    def validate_app_order_no(cls, v):
        if not v:
            raise ValueError("订单号不能为空")
        return v

    @validator('productNo')
    def validate_product_no(cls, v):
        if not v:
            raise ValueError("产品编号不能为空")
        return v

    @validator('appUsername')
    def validate_app_username(cls, v):
        if not v:
            raise ValueError("用户名不能为空")
        return v

    @validator('traffic')
    def validate_traffic(cls, v):
        if v <= 0:
            raise ValueError("流量必须大于0")
        return v

class DeductTrafficRequest(BaseModel):
    appOrderNo: str = Field(..., description="订单号")
    productNo: str = Field(..., description="产品编号")
    proxyType: int = Field(..., description="代理类型")
    appUsername: str = Field(..., description="用户名")
    flowNum: int = Field(..., gt=0, description="扣减流量大小(MB)")
    remark: str = Field(..., description="备注")

    @validator('appOrderNo')
    def validate_app_order_no(cls, v):
        if not v:
            raise ValueError("订单号不能为空")
        return v

    @validator('productNo')
    def validate_product_no(cls, v):
        if not v:
            raise ValueError("产品编号不能为空")
        return v

    @validator('appUsername')
    def validate_app_username(cls, v):
        if not v:
            raise ValueError("用户名不能为空")
        return v

    @validator('flowNum')
    def validate_flow_num(cls, v):
        if v <= 0:
            raise ValueError("流量必须大于0")
        return v

    @validator('remark')
    def validate_remark(cls, v):
        if len(v) > 250:
            raise ValueError("备注不能超过250个字符")
        return v

# 修改路由前缀
router = APIRouter()

@router.get("/dynamic")
async def get_dynamic_orders(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    user_id: Optional[int] = None,
    order_no: Optional[str] = None,
    pool_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """获取动态订单列表"""
    try:
        logger.info(f"[Order Service] 开始获取动态订单列表, 参数: page={page}, page_size={page_size}, user_id={user_id}, order_no={order_no}, pool_type={pool_type}")
        logger.info(f"[Order Service] 当前用户: {current_user.username}, is_admin={current_user.is_admin}, is_agent={current_user.is_agent}")
        
        # 构建查询条件
        conditions = []
        
        # 如果不是管理员，限制查询范围
        if not current_user.is_admin:
            if current_user.is_agent:
                # 代理商可以查看自己和下级用户的订单
                sub_users = db.query(User.id).filter(User.agent_id == current_user.id).all()
                sub_user_ids = [user.id for user in sub_users]
                sub_user_ids.append(current_user.id)
                conditions.append(DynamicOrder.user_id.in_(sub_user_ids))
            else:
                # 普通用户只能查看自己的订单
                conditions.append(DynamicOrder.user_id == current_user.id)
        
        # 添加其他过滤条件
        if user_id:
            conditions.append(DynamicOrder.user_id == user_id)
        if order_no:
            # 同时查询order_no和app_order_no
            conditions.append(or_(
                DynamicOrder.order_no.ilike(f"%{order_no}%"),
                DynamicOrder.app_order_no.ilike(f"%{order_no}%")
            ))
        if pool_type:
            conditions.append(DynamicOrder.pool_type == pool_type)
            
        # 查询订单
        query = db.query(DynamicOrder)
        if conditions:
            query = query.filter(*conditions)
            
        # 计算总数
        total = query.count()
        logger.info(f"[Order Service] 符合条件的订单总数: {total}")
        
        # 分页查询
        orders = query.order_by(DynamicOrder.created_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
        logger.info(f"[Order Service] 获取到订单数量: {len(orders)}")
        
        # 处理订单数据
        order_list = []
        for order in orders:
            try:
                order_dict = order.to_dict()
                
                # 添加用户名信息
                user = db.query(User).filter(User.id == order.user_id).first()
                if user:
                    order_dict["username"] = user.username
                else:
                    order_dict["username"] = f"用户{order.user_id}"
                
                # 添加代理商用户名
                if order.agent_id:
                    agent = db.query(User).filter(User.id == order.agent_id).first()
                    if agent:
                        order_dict["agent_username"] = agent.username
                    else:
                        order_dict["agent_username"] = f"代理商{order.agent_id}"
                else:
                    order_dict["agent_username"] = ""
                
                order_list.append(order_dict)
                
            except Exception as e:
                logger.error(f"[Order Service] 处理订单 {order.id} 时发生错误: {str(e)}")
                logger.error(traceback.format_exc())
                continue
        
        logger.info(f"[Order Service] 成功处理订单数量: {len(order_list)}")
        
        return {
            "code": 0,
            "msg": "success",
            "data": {
                "list": order_list,
                "total": total,
                "page": page,
                "page_size": page_size
            }
        }
        
    except Exception as e:
        logger.error(f"[Order Service] 获取动态订单列表失败: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail={"code": 500, "message": f"获取订单列表失败: {str(e)}"}
        )

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
            app_order_no = f"C{datetime.now().strftime('%Y%m%d%H%M%S')}{random.randint(100000, 999999)}"  # 修改app_order_no的格式
            
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
            app_order_no = f"C{datetime.now().strftime('%Y%m%d%H%M%S')}{random.randint(100000, 999999)}"  # 修改app_order_no的格式
            
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

@router.post("/callback/{order_id}")
async def handle_order_callback(
    order_id: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    处理代理订单回调
    
    Args:
        order_id: 订单ID
        request: 请求对象
        db: 数据库会话
    """
    try:
        # 获取回调数据
        callback_data = await request.json()
        logger.info(f"[OrderCallback] 收到订单回调: order_id={order_id}, data={json.dumps(callback_data, ensure_ascii=False)}")
        
        # 刷新数据库会话
        db.expire_all()
        
        # 查找动态订单
        logger.info(f"[OrderCallback] 开始查询动态订单: order_id={order_id}")
        order = db.query(DynamicOrder).filter(DynamicOrder.id == order_id).first()
        logger.info(f"[OrderCallback] 动态订单查询结果: {order}")
        
        if not order:
            # 如果不是动态订单，尝试查找静态订单
            logger.info(f"[OrderCallback] 开始查询静态订单: order_id={order_id}")
            order = db.query(StaticOrder).filter(StaticOrder.id == order_id).first()
            logger.info(f"[OrderCallback] 静态订单查询结果: {order}")
            
        if not order:
            logger.error(f"[OrderCallback] 未找到订单: {order_id}")
            # 检查数据库中是否存在任何订单
            all_orders = db.query(DynamicOrder).all()
            logger.info(f"[OrderCallback] 当前数据库中的所有动态订单: {[o.id for o in all_orders]}")
            raise HTTPException(status_code=404, detail="订单不存在")
            
        # 解析回调数据
        status = callback_data.get("status")
        proxy_info = callback_data.get("proxyInfo")
        
        if not status:
            logger.error(f"[OrderCallback] 回调数据缺少状态信息: {callback_data}")
            raise HTTPException(status_code=400, detail="回调数据格式错误")
            
        # 更新订单状态
        if status == "success":
            # 更新订单状态为成功
            order.status = "active"
            if hasattr(order, 'proxy_info'):  # 如果是动态订单
                order.proxy_info = proxy_info
            order.updated_at = datetime.now()
            db.commit()  # 添加事务提交
            logger.info(f"[OrderCallback] 订单激活成功: {order_id}")
            return {"code": 200, "message": "订单激活成功"}
        else:
            logger.error(f"[OrderCallback] 订单激活失败: {status}")
            raise HTTPException(status_code=400, detail=f"订单激活失败: {status}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[OrderCallback] 处理回调时发生错误: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/dynamic/add-traffic")
async def add_traffic(
    request: AddTrafficRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """增加动态订单流量"""
    try:
        logger.info(f"[Order Service] 收到增加流量请求参数: {request.dict()}")
        logger.info(f"[Order Service] 当前用户: {current_user.username}, ID: {current_user.id}, is_admin: {current_user.is_admin}, is_agent: {current_user.is_agent}")
        
        # 查找订单 - 使用order_no字段
        order = db.query(DynamicOrder).filter(DynamicOrder.order_no == request.appOrderNo).first()
        logger.info(f"[Order Service] 通过order_no查询结果: {order}")
        
        if not order:
            # 如果找不到，尝试使用app_order_no字段
            order = db.query(DynamicOrder).filter(DynamicOrder.app_order_no == request.appOrderNo).first()
            logger.info(f"[Order Service] 通过app_order_no查询结果: {order}")
            
        if not order:
            logger.error(f"[Order Service] 订单不存在: {request.appOrderNo}")
            raise HTTPException(
                status_code=404,
                detail={"code": 404, "message": "订单不存在"}
            )
            
        logger.info(f"[Order Service] 找到订单: id={order.id}, user_id={order.user_id}, agent_id={order.agent_id}")
            
        # 检查权限
        if not current_user.is_admin:
            logger.info(f"[Order Service] 非管理员用户，进行权限检查")
            if current_user.is_agent:
                logger.info(f"[Order Service] 代理商用户，检查权限: current_user_id={current_user.id}, order_user_id={order.user_id}")
                # 如果是代理商，检查订单是否属于其自己或其下级用户
                if order.user_id != current_user.id:
                    # 检查订单用户是否是该代理商的下级
                    order_user = db.query(User).filter(User.id == order.user_id).first()
                    if not order_user or order_user.agent_id != current_user.id:
                        logger.error(f"[Order Service] 代理商权限验证失败: 订单user_id={order.user_id}, 当前代理商id={current_user.id}")
                        raise HTTPException(
                            status_code=403,
                            detail={"code": 403, "message": "无权操作此订单"}
                        )
            else:
                logger.info(f"[Order Service] 普通用户，检查user_id: current={current_user.id}, order={order.user_id}")
                if order.user_id != current_user.id:
                    logger.error(f"[Order Service] 普通用户权限验证失败: 订单user_id={order.user_id}, 当前用户id={current_user.id}")
                    raise HTTPException(
                        status_code=403,
                        detail={"code": 403, "message": "无权操作此订单"}
                    )
        else:
            logger.info("[Order Service] 管理员用户，跳过权限检查")

        # 调用IPIPV API
        ipipv_service = IPIPVService(db)
        response = await ipipv_service.open_proxy({
            "appOrderNo": request.appOrderNo,
            "params": [{
                "productNo": request.productNo,
                "proxyType": request.proxyType,
                "appUsername": request.appUsername,
                "flow": request.traffic,
                "count": 1,
                "duration": 1,
                "unit": 1,
                "renew": True
            }]
        })
        
        logger.info(f"[Order Service] IPIPV API响应: {response}")
        
        if response.get("code") in [0, 200]:
            # 更新订单流量
            order.traffic += request.traffic
            order.updated_at = datetime.utcnow()
            db.commit()
            
            logger.info(f"[Order Service] 成功增加流量: {request.traffic}MB, 订单号: {request.appOrderNo}")
            
            return {
                "code": 0,
                "message": "增加流量成功",
                "data": order.to_dict()
            }
        else:
            raise HTTPException(
                status_code=400,
                detail={"code": 400, "message": response.get("message", "增加流量失败")}
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Order Service] 增加流量失败: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail={"code": 500, "message": f"增加流量失败: {str(e)}"}
        )

@router.get("/dynamic/order-info/{order_no}")
async def get_dynamic_order_info(
    order_no: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """获取动态订单的流量和状态信息"""
    try:
        logger.info(f"[Order Service] 开始获取订单信息: order_no={order_no}")
        logger.info(f"[Order Service] 当前用户信息: id={current_user.id}, username={current_user.username}, is_admin={current_user.is_admin}, is_agent={current_user.is_agent}")
        
        # 查找订单 - 使用order_no字段
        order = db.query(DynamicOrder).filter(
            or_(
                DynamicOrder.order_no == order_no,
                DynamicOrder.app_order_no == order_no
            )
        ).first()
        
        if not order:
            logger.error(f"[Order Service] 订单不存在: {order_no}")
            raise HTTPException(
                status_code=404,
                detail={"code": 404, "message": "订单不存在"}
            )
            
        logger.info(f"[Order Service] 找到订单: id={order.id}, user_id={order.user_id}, agent_id={order.agent_id}")
        
        # 从proxy_info中获取IPIPV的订单号
        ipipv_order_no = None
        if order.proxy_info and isinstance(order.proxy_info, dict):
            ipipv_order_no = order.proxy_info.get("orderNo")
            logger.info(f"[Order Service] 从proxy_info获取到IPIPV订单号: {ipipv_order_no}")
        else:
            logger.warning(f"[Order Service] 订单proxy_info为空或格式不正确: {order.proxy_info}")
        
        if not ipipv_order_no:
            logger.info("[Order Service] 未找到IPIPV订单号，返回默认值")
            return {
                "code": 0,
                "message": "success",
                "data": {
                    "status": 1,  # 待处理状态
                    "flowTotal": 0,
                    "flowBalance": 0
                }
            }
            
        # 调用IPIPV API获取订单状态和剩余流量
        logger.info(f"[Order Service] 开始调用IPIPV API获取订单信息: {ipipv_order_no}")
        ipipv_service = IPIPVService(db)
        ipipv_response = await ipipv_service.get_order_info({
            "orderNo": ipipv_order_no,
            "page": 1,
            "pageSize": 10
        })
        
        logger.info(f"[Order Service] IPIPV API响应: {ipipv_response}")
        
        if ipipv_response and ipipv_response.get("code") in [0, 200]:
            ipipv_data = ipipv_response.get("data", {})
            status = ipipv_data.get("status", 1)
            
            # 获取实例信息
            instances = ipipv_data.get("instances", [])
            total_flow = 0
            balance_flow = 0
            
            if instances:
                total_flow = sum(instance.get("flowTotal", 0) for instance in instances)
                balance_flow = sum(instance.get("flowBalance", 0) for instance in instances)
                logger.info(f"[Order Service] 计算得到流量信息: total_flow={total_flow}, balance_flow={balance_flow}")
            else:
                logger.warning("[Order Service] 未找到实例信息")
            
            return {
                "code": 0,
                "message": "success",
                "data": {
                    "status": status,
                    "flowTotal": total_flow,
                    "flowBalance": balance_flow
                }
            }
        else:
            logger.error(f"[Order Service] IPIPV API调用失败: {ipipv_response}")
            raise HTTPException(
                status_code=500,
                detail={"code": 500, "message": "获取订单信息失败"}
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Order Service] 获取订单信息失败: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail={"code": 500, "message": f"获取订单信息失败: {str(e)}"}
        )

@router.post("/dynamic/deduct-traffic")
async def deduct_traffic(
    request: DeductTrafficRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """扣减动态订单流量"""
    try:
        logger.info(f"[Order Service] 收到扣减流量请求参数: {request.dict()}")
        logger.info(f"[Order Service] 当前用户: {current_user.username}, ID: {current_user.id}, is_admin: {current_user.is_admin}, is_agent: {current_user.is_agent}")
        
        # 查找订单 - 使用order_no字段
        order = db.query(DynamicOrder).filter(DynamicOrder.order_no == request.appOrderNo).first()
        logger.info(f"[Order Service] 通过order_no查询结果: {order}")
        
        if not order:
            # 如果找不到，尝试使用app_order_no字段
            order = db.query(DynamicOrder).filter(DynamicOrder.app_order_no == request.appOrderNo).first()
            logger.info(f"[Order Service] 通过app_order_no查询结果: {order}")
            
        if not order:
            logger.error(f"[Order Service] 订单不存在: {request.appOrderNo}")
            raise HTTPException(
                status_code=404,
                detail={"code": 404, "message": "订单不存在"}
            )
            
        logger.info(f"[Order Service] 找到订单: id={order.id}, user_id={order.user_id}, agent_id={order.agent_id}")
            
        # 检查权限
        if not current_user.is_admin:
            logger.info(f"[Order Service] 非管理员用户，进行权限检查")
            if current_user.is_agent:
                logger.info(f"[Order Service] 代理商用户，检查权限: current_user_id={current_user.id}, order_user_id={order.user_id}")
                # 如果是代理商，检查订单是否属于其自己或其下级用户
                if order.user_id != current_user.id:
                    # 检查订单用户是否是该代理商的下级
                    order_user = db.query(User).filter(User.id == order.user_id).first()
                    if not order_user or order_user.agent_id != current_user.id:
                        logger.error(f"[Order Service] 代理商权限验证失败: 订单user_id={order.user_id}, 当前代理商id={current_user.id}")
                        raise HTTPException(
                            status_code=403,
                            detail={"code": 403, "message": "无权操作此订单"}
                        )
            else:
                logger.info(f"[Order Service] 普通用户，检查user_id: current={current_user.id}, order={order.user_id}")
                if order.user_id != current_user.id:
                    logger.error(f"[Order Service] 普通用户权限验证失败: 订单user_id={order.user_id}, 当前用户id={current_user.id}")
                    raise HTTPException(
                        status_code=403,
                        detail={"code": 403, "message": "无权操作此订单"}
                    )
        else:
            logger.info("[Order Service] 管理员用户，跳过权限检查")

        # 调用IPIPV API
        ipipv_service = IPIPVService(db)
        response = await ipipv_service.return_proxy({
            "appUsername": request.appUsername,
            "proxyType": request.proxyType,
            "productNo": request.productNo,
            "flowNum": request.flowNum,
            "remark": request.remark
        })
        
        logger.info(f"[Order Service] IPIPV API响应: {response}")
        
        if response.get("code") in [0, 200]:
            # 更新订单流量
            order.traffic -= request.flowNum
            order.updated_at = datetime.utcnow()
            db.commit()
            
            logger.info(f"[Order Service] 成功扣减流量: {request.flowNum}MB, 订单号: {request.appOrderNo}")
            
            return {
                "code": 0,
                "message": "扣减流量成功",
                "data": order.to_dict()
            }
        else:
            raise HTTPException(
                status_code=400,
                detail={"code": 400, "message": response.get("message", "扣减流量失败")}
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Order Service] 扣减流量失败: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail={"code": 500, "message": f"扣减流量失败: {str(e)}"}
        ) 
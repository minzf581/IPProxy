# 用户管理路由模块
# ==============
#
# 此模块处理所有与用户相关的路由请求，包括：
# - 用户账户管理（注册、登录、更新）
# - 用户权限控制
# - 用户资金管理
# - 用户统计信息
#
# 用户类型和创建流程：
# -----------------
# 1. 普通用户：
#    - 由代理商或管理员创建
#    - 只在本地数据库创建记录
#    - 不需要调用外部API
#    - 必须关联到代理商
#
# 2. 代理商用户：
#    - 只能由管理员创建
#    - 需要同时在本地数据库和IPIPV平台创建
#    - 创建流程：
#      a. 验证管理员权限
#      b. 验证必填信息（手机号、邮箱、认证类型等）
#      c. 调用IPIPV API创建代理商账号
#      d. 在本地数据库创建用户记录
#      e. 保存IPIPV平台返回的用户名和密码
#
# 数据模型关系：
# ------------
# - User (app/models/user.py)
#   - username: 用户名
#   - password: 加密密码
#   - email: 邮箱
#   - phone: 手机号
#   - is_agent: 是否是代理商
#   - agent_id: 关联的代理商ID
#   - ipipv_username: IPIPV平台用户名（代理商专用）
#   - ipipv_password: IPIPV平台密码（代理商专用）
#
# IPIPV API集成：
# -------------
# 1. 代理商创建API：/api/open/app/user/v2
#    - 请求参数：
#      - phone: 手机号
#      - email: 邮箱
#      - authType: 认证类型（1=未实名，2=个人实名，3=企业实名）
#      - authName: 认证名称（可选）
#      - no: 证件号码（可选）
#      - status: 状态（1=正常）
#    - 响应数据：
#      - username: IPIPV平台用户名
#      - password: IPIPV平台密码
#      - status: 用户状态
#      - authStatus: 认证状态
#
# 重要提示：
# ---------
# 1. 用户是系统的基础模块，需要特别注意安全性
# 2. 所有涉及敏感信息的操作都需要加密处理
# 3. 用户权限需要严格控制
#
# 依赖关系：
# ---------
# - 数据模型：
#   - User (app/models/user.py)
#   - Transaction (app/models/transaction.py)
#   - MainUser (app/models/main_user.py)
# - 服务：
#   - AuthService (app/services/auth.py)
#   - IPProxyService (app/services/ipproxy_service.py)
#
# 前端对应：
# ---------
# - 服务层：src/services/userService.ts
# - 页面组件：src/pages/user/index.tsx
# - 类型定义：src/types/user.ts
#
# 修改注意事项：
# ------------
# 1. 安全性：
#    - 密码必须加密存储
#    - 敏感信息脱敏处理
#    - 防止SQL注入
#    - 防止XSS攻击
#
# 2. 权限控制：
#    - 基于角色的访问控制
#    - 操作权限验证
#    - 数据访问权限
#    - 敏感操作审计
#
# 3. 数据验证：
#    - 输入数据格式验证
#    - 业务规则验证
#    - 数据一致性检查
#    - 重复数据检查
#
# 4. 性能优化：
#    - 合理使用缓存
#    - 优化查询性能
#    - 控制并发访问
#    - 异步处理耗时操作
#
# 错误处理：
# --------
# 1. 本地数据库错误：
#    - 用户名重复
#    - 数据库连接失败
#    - 事务回滚
#
# 2. IPIPV API错误：
#    - API调用超时
#    - 认证失败
#    - 参数验证失败
#    - 业务逻辑错误
#
# 3. 权限错误：
#    - 未授权操作
#    - 越权访问
#    - 角色限制

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.transaction import Transaction
from app.models.dynamic_order import DynamicOrder
from app.models.static_order import StaticOrder
from app.models.prices import AgentPrice, UserPrice
from app.models.agent_statistics import AgentStatistics
from typing import Dict, Any, List, Optional
from sqlalchemy import or_
from datetime import datetime, timedelta
from app.services.auth import get_current_user
import uuid
from pydantic import BaseModel
import logging
from passlib.hash import bcrypt
from app.services.ipipv_base_api import IPIPVBaseAPI
from app.schemas.user import UserCreate, UserResponse, UserLogin, UserBase, UserInDB
import json
import traceback
from app.services.static_order_service import StaticOrderService

# 设置日志记录器
logger = logging.getLogger(__name__)

def calculate_business_cost(data: dict) -> float:
    """计算业务费用"""
    if data["proxyType"] == "dynamic":
        # 动态代理费用计算
        traffic = int(data["traffic"])
        return data.get("total_cost", traffic * 0.1)  # 默认每单位流量0.1元
    else:
        # 静态代理费用计算
        quantity = int(data["quantity"])
        duration = int(data["duration"])
        return data.get("total_cost", quantity * duration * 0.2)  # 默认每IP每天0.2元

def generate_order_no() -> str:
    """生成订单号"""
    return f"ORD{datetime.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6]}"

async def call_proxy_service_api(data: dict) -> dict:
    """调用代理服务API"""
    # TODO: 实现实际的API调用
    return {
        "success": True,
        "message": "success",
        "data": {
            "proxy_info": data
        }
    }

class CreateUserRequest(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    phone: Optional[str] = None
    remark: Optional[str] = None
    agent_id: Optional[int] = None
    is_agent: bool = False  # 是否是代理商
    auth_type: Optional[int] = None  # 认证类型：1=未实名 2=个人实名 3=企业实名
    auth_name: Optional[str] = None  # 认证名称
    no: Optional[str] = None  # 证件号码

router = APIRouter()

@router.get("/user/list")
async def get_user_list(
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100),
    username: Optional[str] = None,
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """获取用户列表"""
    try:
        logger.info(f"Getting user list. Page: {page}, PageSize: {pageSize}, Username: {username}, Status: {status}")
        logger.info(f"Current user: {current_user.username}, Is admin: {current_user.is_admin}")
        
        # 如果是代理商，只能查看自己创建的用户
        if current_user.is_agent:
            query = db.query(User).filter(User.agent_id == current_user.id)
        else:
            # 管理员可以看到所有用户
            query = db.query(User)
        
        # 添加搜索条件
        if username:
            query = query.filter(User.username.like(f"%{username}%"))
        if status:
            query = query.filter(User.status == status)
            
        # 计算总数
        total = query.count()
        
        # 分页
        users = query.offset((page - 1) * pageSize).limit(pageSize).all()
        
        # 转换为字典列表
        user_list = []
        for user in users:
            user_dict = {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "status": "active" if user.status == 1 else "disabled",  # 将整数状态转换为字符串
                "agent_id": user.agent_id,
                "balance": user.balance,
                "remark": user.remark,
                "created_at": user.created_at.strftime("%Y-%m-%d %H:%M:%S") if user.created_at else None,
                "updated_at": user.updated_at.strftime("%Y-%m-%d %H:%M:%S") if user.updated_at else None
            }
            user_list.append(user_dict)
            
        return {
            "code": 0,
            "msg": "success",
            "data": {
                "total": total,
                "list": user_list
            }
        }
        
    except Exception as e:
        logger.error(f"获取用户列表失败: {str(e)}")
        logger.exception("详细错误信息:")
        raise HTTPException(
            status_code=500,
            detail=f"获取用户列表失败: {str(e)}"
        )

@router.post("/open/app/user/create/v2", response_model=UserResponse)
async def create_user(
    request: Request,
    user_data: UserCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    创建新用户
    - 管理员可以创建代理商和普通用户
    - 代理商只能创建普通用户
    - 普通用户不能创建用户
    """
    logger.info(f"[用户创建] 收到请求: {user_data}")

    try:
        # 权限检查
        if not (current_user.is_admin or current_user.is_agent):
            raise HTTPException(
                status_code=403,
                detail="没有创建用户的权限"
            )

        # 检查用户名是否已存在
        if db.query(User).filter(User.username == user_data.username).first():
            raise HTTPException(
                status_code=400,
                detail="用户名已存在"
            )

        # 确定 agent_id
        agent_id = None
        if current_user.is_agent:
            agent_id = current_user.id
        elif user_data.agent_id:
            agent_id = user_data.agent_id

        # 创建用户基本信息
        user_dict = {
            "username": user_data.username,
            "password": bcrypt.hash(user_data.password),
            "email": user_data.email,
            "phone": user_data.phone,
            "remark": user_data.remark,
            "is_agent": user_data.is_agent,
            "agent_id": agent_id,
            "status": 1
        }

        # 如果是管理员创建代理用户，需要调用 IPIPV API
        if current_user.is_admin and user_data.is_agent:
            if not all([user_data.phone, user_data.email, user_data.auth_type]):
                raise HTTPException(
                    status_code=400,
                    detail="创建代理用户需要提供手机号、邮箱和认证类型"
                )
            
            try:
                ipipv_api = IPIPVBaseAPI()
                ipipv_user = await ipipv_api.create_user(
                    username=user_data.username,
                    password=user_data.password,
                    email=user_data.email,
                    phone=user_data.phone,
                    auth_type=user_data.auth_type,
                    auth_name=user_data.auth_name,
                    no=user_data.no
                )
                user_dict["ipipv_username"] = ipipv_user.get("username")
                user_dict["ipipv_password"] = ipipv_user.get("password")
            except Exception as e:
                logger.error(f"[用户创建] 调用 IPIPV API 失败: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail=f"创建 IPIPV 用户失败: {str(e)}"
                )

        # 创建用户
        new_user = User(**user_dict)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        logger.info(f"[用户创建] 成功创建用户: {new_user.username}")
        return new_user

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"[用户创建] 发生错误: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

@router.put("/open/app/user/{user_id}")
async def update_user(
    user_id: int,
    user_data: dict,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """更新用户信息"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    for key, value in user_data.items():
        setattr(user, key, value)
    
    db.commit()
    db.refresh(user)
    return {
        "code": 0,
        "message": "success",
        "data": user.to_dict()
    }

@router.delete("/open/app/user/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """删除用户"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    return {
        "code": 0,
        "message": "success"
    }

@router.put("/open/app/user/{user_id}/status")
async def update_user_status(
    user_id: int,
    status: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """更新用户状态"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {
                "code": 404,
                "msg": "用户不存在",
                "data": None
            }
        
        # 更新状态
        user.status = status
        db.commit()
        db.refresh(user)
        
        return {
            "code": 0,
            "msg": "success",
            "data": user.to_dict()
        }
    except Exception as e:
        db.rollback()
        return {
            "code": 500,
            "msg": f"更新用户状态失败: {str(e)}",
            "data": None
        }

@router.put("/open/app/user/{user_id}/password")
async def update_user_password(
    user_id: int,
    password: str,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """更新用户密码"""
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {
                "code": 404,
                "msg": "用户不存在",
                "data": None
            }
        
        # 更新密码
        user.password = bcrypt.hash(password)
        user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(user)
        
        return {
            "code": 0,
            "msg": "success",
            "data": user.to_dict()
        }
    except Exception as e:
        db.rollback()
        return {
            "code": 500,
            "msg": f"更新用户密码失败: {str(e)}",
            "data": None
        }

@router.post("/user/{user_id}/change-password")
async def change_password(
    user_id: int,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """修改用户密码"""
    try:
        # 检查用户是否存在
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail={"code": 404, "message": "用户不存在"})
        
        # 检查权限：管理员可以修改任何用户的密码，代理商可以修改其下属用户的密码，用户可以修改自己的密码
        if not current_user.is_admin and current_user.id != user.agent_id and current_user.id != user_id:
            raise HTTPException(status_code=403, detail={"code": 403, "message": "没有权限执行此操作"})
        
        # 更新密码
        user.password = bcrypt.hash(data["password"])
        user.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(user)
        
        return {
            "code": 200,
            "message": "密码修改成功",
            "data": user.to_dict()
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"修改密码失败: {str(e)}")
        raise HTTPException(status_code=500, detail={"code": 500, "message": str(e)})

@router.post("/user/{user_id}/activate-business")
async def activate_business(
    user_id: int,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """激活用户业务"""
    try:
        logger.info(f"[Business Activation] 开始处理业务激活请求: user_id={user_id}")
        logger.info(f"[Business Activation] 请求数据: {json.dumps(data, ensure_ascii=False)}")
        logger.info(f"[Business Activation] 当前用户信息: id={current_user.id}, username={current_user.username}, is_admin={current_user.is_admin}, is_agent={current_user.is_agent}")
        
        # 验证用户存在
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            logger.error(f"[Business Activation] 用户不存在: user_id={user_id}")
            raise HTTPException(
                status_code=404,
                detail={"code": 404, "message": "用户不存在"}
            )
            
        logger.info(f"[Business Activation] 目标用户信息: id={user.id}, username={user.username}, agent_id={user.agent_id}")
            
        # 验证权限
        has_permission = (
            current_user.is_admin or  # 管理员可以操作任何用户
            current_user.id == user_id or  # 用户可以操作自己
            (current_user.is_agent and current_user.id == user.agent_id)  # 代理商可以操作其下属用户
        )
        
        if not has_permission:
            logger.error(
                f"[Business Activation] 权限不足: "
                f"current_user_id={current_user.id}, "
                f"target_user_id={user_id}, "
                f"is_admin={current_user.is_admin}, "
                f"is_agent={current_user.is_agent}, "
                f"user_agent_id={user.agent_id}"
            )
            raise HTTPException(
                status_code=403,
                detail={"code": 403, "message": "无权操作此用户"}
            )
            
        # 获取代理商信息
        agent_id = data.get("agentId")
        if not agent_id:
            logger.error(f"[Business Activation] 未提供代理商ID")
            raise HTTPException(
                status_code=400,
                detail={"code": 400, "message": "未提供代理商信息"}
            )
            
        agent = db.query(User).filter(User.id == agent_id).first()
        if not agent or not agent.is_agent:
            logger.error(f"[Business Activation] 代理商不存在或无效: agent_id={agent_id}")
            raise HTTPException(
                status_code=400,
                detail={"code": 400, "message": "无效的代理商"}
            )
            
        logger.info(f"[Business Activation] 代理商信息: id={agent.id}, username={agent.username}")
            
        # 调用产品库存服务
        ipipv_api = IPIPVBaseAPI()  # 创建 API 实例

        # 根据代理类型选择对应的服务
        proxy_type = data.get("proxyType")
        if proxy_type == "dynamic":
            from app.services.ipipv_service import IPIPVService
            product_service = IPIPVService(db)
        elif proxy_type == "static":
            from app.services.static_order_service import StaticOrderService
            product_service = StaticOrderService(db, ipipv_api)
        else:
            logger.error(f"[Business Activation] 无效的代理类型: {proxy_type}")
            raise HTTPException(
                status_code=400,
                detail={"code": 400, "message": f"无效的代理类型: {proxy_type}"}
            )

        activation_result = await product_service.activate_dynamic_proxy(
            order_id=str(user_id),
            pool_id=data.get("poolType"),
            traffic_amount=int(data.get("traffic", 0)),
            duration=int(data.get("duration", 30)),
            user_id=user_id,
            agent_id=agent.id
        ) if proxy_type == "dynamic" else await product_service.activate_business(
            user_id=user_id,
            username=user.username,
            agent_id=agent.id,
            agent_username=agent.username,
            proxy_type=data.get("proxyType"),
            pool_type=data.get("poolType"),
            traffic=data.get("traffic"),
            region=data.get("region"),
            country=data.get("country"),
            city=data.get("city"),
            static_type=data.get("staticType"),
            ip_range=data.get("ipRange"),
            duration=data.get("duration"),
            quantity=data.get("quantity"),
            remark=data.get("remark"),
            total_cost=float(data.get("total_cost", 0))
        )
        
        if not activation_result or activation_result.get("code") != 0:
            error_msg = activation_result.get("msg") if activation_result else "业务激活失败"
            logger.error(f"[Business Activation] 激活失败: {error_msg}")
            raise HTTPException(
                status_code=400,
                detail={"code": 400, "message": error_msg}
            )
            
        # 更新代理商统计信息
        agent_stats = db.query(AgentStatistics).filter(
            AgentStatistics.agent_id == agent.id
        ).first()
        
        if agent_stats:
            agent_stats.total_users += 1
            agent_stats.active_users += 1
            db.add(agent_stats)
            
        try:
            db.commit()
            logger.info("[Business Activation] 数据库更新成功")
        except Exception as e:
            db.rollback()
            logger.error(f"[Business Activation] 数据库更新失败: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail={"code": 500, "message": "数据库更新失败"}
            )
            
        return {
            "code": 0,
            "msg": "success",
            "data": {
                "order": activation_result.get("data", {}),
                "agent": {
                    "id": agent.id,
                    "username": agent.username,
                    "balance": float(agent.balance)
                },
                "statistics": agent_stats.to_dict() if agent_stats else {}
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[Business Activation] 处理失败: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail={"code": 500, "message": f"业务激活失败: {str(e)}"}
        )

@router.post("/user/{user_id}/renew")
async def renew_business(
    user_id: int,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """续费业务"""
    try:
        # 检查用户是否存在
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail={"code": 404, "message": "用户不存在"})
        
        # 检查权限：管理员可以为任何用户续费，代理商只能为其下属用户续费
        if not current_user.is_admin and current_user.id != user.agent_id:
            raise HTTPException(status_code=403, detail={"code": 403, "message": "没有权限执行此操作"})
        
        # 检查用户余额是否充足
        total_cost = calculate_business_cost(data)  # 计算业务费用
        if user.balance < total_cost:
            raise HTTPException(status_code=400, detail={"code": 400, "message": "用户余额不足"})
        
        # 生成订单号
        order_no = generate_order_no()
        
        # 调用代理服务API
        api_response = await call_proxy_service_api(data)
        if not api_response.get("success"):
            raise HTTPException(
                status_code=500,
                detail={"code": 500, "message": api_response.get("message", "续费失败")}
            )
        
        # 创建交易记录
        transaction = Transaction(
            order_no=order_no,
            user_id=user.id,
            amount=total_cost,
            type="consumption",
            status="completed",
            remark=data.get("remark"),
            operator_id=current_user.id
        )
        db.add(transaction)
        
        # 更新用户余额
        user.balance -= total_cost
        
        # 创建续费订单
        if data["proxyType"] == "dynamic":
            order = DynamicOrder(
                order_no=order_no,
                user_id=user.id,
                pool_type=data["poolType"],
                traffic=int(data["traffic"]),
                status="active",
                remark=data.get("remark"),
                proxy_info=api_response.get("data", {})
            )
        else:
            order = StaticOrder(
                order_no=order_no,
                app_order_no=order_no,  # 使用相同的订单号作为 app_order_no
                user_id=user.id,
                agent_id=user.agent_id,  # 添加 agent_id
                region_code=data["region"],
                country_code=data["country"],
                city_code=data["city"],
                static_type=data["staticType"],
                ip_count=int(data["quantity"]),
                duration=int(data["duration"]),
                unit=1,  # 默认单位为天
                amount=total_cost,
                status="active",
                remark=data.get("remark"),
                proxy_type=103,  # 静态代理类型
                product_no=data.get("product_no", "")
            )
        
        db.add(order)
        db.commit()
        db.refresh(user)
        db.refresh(order)
        
        return {
            "code": 200,
            "message": "续费成功",
            "data": {
                "order": order.to_dict(),
                "user": user.to_dict()
            }
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"续费失败: {str(e)}")
        raise HTTPException(status_code=500, detail={"code": 500, "message": str(e)})

@router.post("/user/{user_id}/deactivate-business")
async def deactivate_business(
    user_id: int,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """释放业务资源"""
    try:
        # 检查用户是否存在
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail={"code": 404, "message": "用户不存在"})
        
        # 检查权限：管理员可以为任何用户释放资源，代理商只能为其下属用户释放资源
        if not current_user.is_admin and current_user.id != user.agent_id:
            raise HTTPException(status_code=403, detail={"code": 403, "message": "没有权限执行此操作"})
        
        # 获取代理商
        agent = db.query(User).filter(User.id == user.agent_id).first()
        if not agent:
            raise HTTPException(status_code=404, detail={"code": 404, "message": "代理商不存在"})
        
        # 获取订单信息
        if data["proxyType"] == "dynamic":
            order = db.query(DynamicOrder).filter(
                DynamicOrder.order_no == data["orderNo"],
                DynamicOrder.user_id == user_id,
                DynamicOrder.status == "active"
            ).first()
        else:
            order = db.query(StaticOrder).filter(
                StaticOrder.order_no == data["orderNo"],
                StaticOrder.user_id == user_id,
                StaticOrder.status == "active"
            ).first()
            
        if not order:
            raise HTTPException(status_code=404, detail={"code": 404, "message": "订单不存在或已失效"})
        
        # 调用代理服务API释放资源
        api_response = await call_proxy_service_api({
            "action": "release",
            "orderNo": order.order_no,
            "proxyType": data["proxyType"]
        })
        
        if not api_response.get("success"):
            raise HTTPException(
                status_code=500,
                detail={"code": 500, "message": api_response.get("message", "释放资源失败")}
            )
        
        # 更新订单状态
        order.status = "expired"
        order.updated_at = datetime.now()
        
        # 获取代理商统计信息
        stats = db.query(AgentStatistics).filter(AgentStatistics.agent_id == agent.id).first()
        if not stats:
            stats = AgentStatistics(agent_id=agent.id)
            db.add(stats)
        
        # 更新统计信息
        if data["proxyType"] == "dynamic":
            stats.update_resource_count(is_dynamic=True, count=-int(order.traffic))
        else:
            stats.update_resource_count(is_dynamic=False, count=-int(order.quantity))
        
        db.commit()
        db.refresh(order)
        db.refresh(stats)
        
        return {
            "code": 200,
            "message": "资源释放成功",
            "data": {
                "order": order.to_dict(),
                "statistics": stats.to_dict()
            }
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"释放资源失败: {str(e)}")
        raise HTTPException(status_code=500, detail={"code": 500, "message": str(e)})

@router.post("/open/app/user/{user_id}/balance")
async def adjust_user_balance(
    user_id: int,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """调整用户余额"""
    logger.info(f"[adjust_user_balance] user_id={user_id}, data={data}, current_user={current_user.id}")
    
    # 权限检查
    if not current_user.is_admin and not current_user.is_agent:
        raise HTTPException(status_code=403, detail="没有权限执行此操作")
    
    # 获取目标用户
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="用户不存在")
    
    # 代理商只能调整自己下级用户的余额
    if current_user.is_agent and target_user.agent_id != current_user.id:
        raise HTTPException(status_code=403, detail="没有权限调整此用户的余额")
    
    amount = data.get("amount")
    remark = data.get("remark", "")
    
    if not amount:
        raise HTTPException(status_code=400, detail="调整金额不能为空")
    
    try:
        amount = float(amount)
    except ValueError:
        raise HTTPException(status_code=400, detail="调整金额格式不正确")
    
    try:
        # 如果是代理商，检查余额是否足够
        if current_user.is_agent and amount > 0:
            if current_user.balance < amount:
                raise HTTPException(status_code=400, detail="代理商余额不足")
            
            # 扣除代理商余额
            current_user.balance -= amount
            
            # 记录代理商余额变更
            agent_transaction = Transaction(
                transaction_no=str(uuid.uuid4()).replace("-", ""),
                user_id=current_user.id,
                agent_id=current_user.id,
                order_no=str(uuid.uuid4()).replace("-", ""),
                amount=-amount,
                balance=current_user.balance,
                type="consume",
                status="success",
                remark=f"调整用户 {target_user.username} 余额: {amount}"
            )
            db.add(agent_transaction)
        
        # 调整用户余额
        old_balance = target_user.balance
        target_user.balance += amount
        
        # 记录用户余额变更
        transaction = Transaction(
            transaction_no=str(uuid.uuid4()).replace("-", ""),
            user_id=target_user.id,
            agent_id=current_user.id,
            order_no=str(uuid.uuid4()).replace("-", ""),
            amount=amount,
            balance=target_user.balance,
            type="recharge" if amount > 0 else "consume",
            status="success",
            remark=remark or f"管理员调整余额: {amount}"
        )
        db.add(transaction)
        
        # 提交事务
        db.commit()
        logger.info(f"[adjust_user_balance] 调整成功: user_id={user_id}, old_balance={old_balance}, new_balance={target_user.balance}")
        
        # 返回标准响应格式
        return {
            "code": 0,
            "msg": "调整成功",
            "data": {
                "transaction_no": transaction.transaction_no,
                "amount": amount,
                "old_balance": old_balance,
                "new_balance": target_user.balance
            }
        }
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"[adjust_user_balance] 调整失败: {str(e)}")
        raise HTTPException(status_code=500, detail=f"调整失败: {str(e)}") 
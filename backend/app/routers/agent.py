# 代理商管理路由模块
# ==============
#
# 此模块处理所有与代理商相关的路由请求，包括：
# - 代理商账户管理（创建、更新、查询）
# - 代理商资金管理（余额更新、交易记录）
# - 代理商统计信息（订单统计、收入统计）
#
# 重要提示：
# ---------
# 1. 代理商是系统的核心角色之一，所有操作需要严格的权限控制
# 2. 涉及资金操作时需要保证事务的原子性和数据一致性
# 3. 所有关键操作都需要记录详细的日志
#
# 依赖关系：
# ---------
# - 数据模型：
#   - User (app/models/user.py)
#   - Transaction (app/models/transaction.py)
# - 服务：
#   - UserService (app/services/user_service.py)
#   - ProxyService (app/services/proxy_service.py)
#   - AreaService (app/services/area_service.py)
#   - AuthService (app/services/auth.py)
#
# 前端对应：
# ---------
# - 服务层：src/services/agentService.ts
# - 页面组件：src/pages/agent/index.tsx
# - 类型定义：src/types/agent.ts
#
# 修改注意事项：
# ------------
# 1. 权限控制：
#    - 所有接口都需要进行权限验证
#    - 防止越权访问和操作
#    - 记录敏感操作日志
#
# 2. 资金操作：
#    - 使用事务确保操作原子性
#    - 记录详细的资金变动日志
#    - 定期对账和数据校验
#
# 3. 数据验证：
#    - 所有输入参数必须经过验证
#    - 特别注意金额等敏感字段
#    - 确保数据一致性
#
# 4. 错误处理：
#    - 统一的错误响应格式
#    - 详细的错误日志记录
#    - 友好的错误提示信息
#
# 5. 性能优化：
#    - 合理使用数据库索引
#    - 避免重复查询
#    - 优化大数据量查询

from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.transaction import Transaction
from typing import Dict, Any, List
from pydantic import BaseModel, Field, validator
from typing import Optional
from app.services import UserService, ProxyService, AreaService
from app.services.auth import get_current_user
from datetime import datetime, timedelta
import logging
from sqlalchemy import func
import uuid
from app.schemas.agent import AgentList, AgentCreate, AgentUpdate
import json
import traceback
from app.core.deps import get_user_service, get_proxy_service, get_area_service
from app.models.dynamic_order import DynamicOrder
from app.models.static_order import StaticOrder
from sqlalchemy import or_
import re
from app.core.security import get_password_hash
from decimal import Decimal
from app.services.ipipv_base_api import IPIPVBaseAPI

# 设置日志记录器
logger = logging.getLogger(__name__)

router = APIRouter()

class CreateAgentRequest(BaseModel):
    """创建代理商请求"""
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=50)
    email: Optional[str] = Field(None, max_length=255)
    phone: Optional[str] = Field(None, max_length=20)  # 添加联系方式字段
    remark: Optional[str] = Field(None, max_length=255)
    status: Optional[int] = Field(1, description="状态：1=正常，0=禁用")
    balance: Optional[float] = Field(0.0, ge=0)

    @validator('username')
    def validate_username(cls, v):
        """验证用户名"""
        if not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError('用户名只能包含字母、数字、下划线和连字符')
        return v

    @validator('email')
    def validate_email(cls, v):
        """验证邮箱"""
        if v is not None and not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', v):
            raise ValueError('邮箱格式不正确')
        return v

    @validator('phone')
    def validate_phone(cls, v):
        """验证联系方式"""
        if v is not None and not re.match(r'^[\d\-+() ]{5,20}$', v):
            raise ValueError('联系方式格式不正确')
        return v

    @validator('status')
    def validate_status(cls, v):
        """验证状态"""
        if v not in [0, 1]:
            raise ValueError('状态只能是 0 或 1')
        return v

class UpdateAgentRequest(BaseModel):
    """更新代理商请求"""
    status: Optional[str] = None
    remark: Optional[str] = None
    balance: Optional[float] = None

class AgentBalanceAdjustRequest(BaseModel):
    """代理商额度调整请求"""
    amount: float = Field(..., description="调整金额，正数为增加，负数为减少")
    remark: Optional[str] = Field(None, max_length=255, description="调整备注")

def generate_transaction_no() -> str:
    """生成交易号"""
    return f"TRX{datetime.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6]}"

@router.post("/open/app/proxy/user/v2")
async def create_agent(
    request: CreateAgentRequest,
    db: Session = Depends(get_db),
    user_service: UserService = Depends(get_user_service)
) -> Dict[str, Any]:
    """创建代理商"""
    try:
        logger.info(f"[AgentRouter] 开始创建代理商: {request.username}")
        
        # 检查用户名是否已存在
        if db.query(User).filter(User.username == request.username).first():
            logger.warning(f"[AgentRouter] 用户名已存在: {request.username}")
            raise HTTPException(
                status_code=400,
                detail={
                    "code": 400,
                    "message": "用户名已存在"
                }
            )

        # 调用IPIPV API创建代理商
        new_user = await user_service.create_ipipv_user(
            username=request.username,
            password=request.password,
            email=request.email,
            phone=request.phone,
            remark=request.remark,
            db=db
        )
        
        if not new_user:
            raise HTTPException(
                status_code=500,
                detail={
                    "code": 500,
                    "message": "创建IPIPV用户失败"
                }
            )

        # 更新用户的余额和状态
        new_user.balance = request.balance or 0.0
        new_user.status = request.status
        db.flush()
        
        # 如果有初始余额，创建交易记录
        if request.balance and request.balance > 0:
            transaction = Transaction(
                transaction_no=generate_transaction_no(),
                user_id=new_user.id,
                agent_id=new_user.id,
                order_no=f"INIT{datetime.now().strftime('%Y%m%d%H%M%S')}",
                amount=Decimal(str(request.balance)),
                balance=Decimal(str(request.balance)),
                type="recharge",
                status="success",
                remark="代理商初始充值"
            )
            db.add(transaction)

        # 提交事务
        db.commit()
        db.refresh(new_user)
        
        logger.info(f"[AgentRouter] 代理商创建成功: {new_user.username}")
        
        return {
            "code": 0,
            "message": "success",
            "data": {
                "id": new_user.id,
                "username": new_user.username,
                "email": new_user.email,
                "status": new_user.status,
                "is_agent": new_user.is_agent,
                "balance": float(new_user.balance),
                "app_username": new_user.app_username,
                "platform_account": new_user.platform_account,
                "created_at": new_user.created_at.strftime("%Y-%m-%d %H:%M:%S") if new_user.created_at else None
            }
        }
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"[AgentRouter] 创建代理商失败: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail={
                "code": 500,
                "message": f"创建代理商失败: {str(e)}"
            }
        )

@router.get("/open/app/agent/list")
async def get_agent_list(
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100),
    user_service: UserService = Depends(get_user_service),
    db: Session = Depends(get_db)
):
    """获取代理商列表"""
    try:
        logger.info(f"[AgentRouter] 开始获取代理商列表")
        logger.info(f"[AgentRouter] 请求参数: page={page}, pageSize={pageSize}")
        
        # 构建查询条件
        query = db.query(User).filter(User.is_agent == True)
        logger.info(f"[AgentRouter] 构建查询条件: {query.statement}")
        
        # 计算总数
        total = query.count()
        logger.info(f"[AgentRouter] 总记录数: {total}")
        
        # 分页查询
        agents = query.order_by(User.created_at.desc()) \
            .offset((page - 1) * pageSize) \
            .limit(pageSize) \
            .all()
        logger.info(f"[AgentRouter] 查询到 {len(agents)} 条记录")
            
        # 转换为响应格式
        agent_list = []
        for agent in agents:
            agent_data = {
                "id": str(agent.id),
                "username": agent.username,
                "app_username": agent.app_username or agent.username,
                "platform_account": agent.platform_account or agent.ipipv_username or agent.username,
                "email": agent.email,
                "phone": agent.phone,
                "balance": float(agent.balance) if agent.balance is not None else 0.0,
                "status": "active" if agent.status == 1 else "disabled",
                "remark": agent.remark,
                "created_at": agent.created_at.isoformat() if agent.created_at else None,
                "updated_at": agent.updated_at.isoformat() if agent.updated_at else None
            }
            agent_list.append(agent_data)
            logger.info(f"[AgentRouter] 处理代理商数据: {agent_data}")
            
        response_data = {
            "code": 0,
            "message": "获取代理商列表成功",
            "data": {
                "list": agent_list,
                "total": total
            }
        }
        logger.info(f"[AgentRouter] 返回响应: {response_data}")
        return response_data
        
    except Exception as e:
        logger.error(f"[AgentRouter] 获取代理商列表失败: {str(e)}")
        logger.error(f"[AgentRouter] 错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/open/app/agent/{agent_id}")
async def get_agent_detail(
    agent_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """获取代理商详情"""
    agent = db.query(User).filter(User.id == agent_id, User.is_agent == True).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    return {
        "code": 0,
        "message": "success",
        "data": agent.to_dict()
    }

@router.get("/open/app/agent/{agent_id}/statistics")
async def get_agent_statistics(
    agent_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """获取代理商统计信息"""
    agent = db.query(User).filter(User.id == agent_id, User.is_agent == True).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
        
    # 获取统计数据
    total_orders = db.query(func.count(Transaction.id)).filter(
        Transaction.agent_id == agent_id
    ).scalar()
    
    total_amount = db.query(func.sum(Transaction.amount)).filter(
        Transaction.agent_id == agent_id
    ).scalar() or 0.0
    
    return {
        "code": 0,
        "message": "success",
        "data": {
            "total_orders": total_orders,
            "total_amount": float(total_amount),
            "balance": agent.balance
        }
    }

@router.put("/open/app/agent/{agent_id}/status")
async def update_agent_status(
    agent_id: int,
    status: str = Query(..., description="Agent status to update to"),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """更新代理商状态"""
    try:
        agent = db.query(User).filter(User.id == agent_id, User.is_agent == True).first()
        if not agent:
            return {
                "code": 404,
                "msg": "代理商不存在",
                "data": None
            }
            
        agent.status = status
        db.commit()
        db.refresh(agent)
        
        return {
            "code": 0,
            "msg": "success",
            "data": agent.to_dict()
        }
    except Exception as e:
        db.rollback()
        return {
            "code": 500,
            "msg": f"更新代理商状态失败: {str(e)}",
            "data": None
        }

@router.put("/open/app/agent/{agent_id}")
async def update_agent(
    agent_id: int,
    request: UpdateAgentRequest,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """更新代理商信息"""
    try:
        agent = db.query(User).filter(User.id == agent_id, User.is_agent == True).first()
        if not agent:
            return {
                "code": 404,
                "msg": "代理商不存在",
                "data": None
            }
        
        if request.status is not None:
            agent.status = request.status
        if request.remark is not None:
            agent.remark = request.remark
        if request.balance is not None:
            agent.balance = request.balance
            
        db.commit()
        db.refresh(agent)
        
        return {
            "code": 0,
            "msg": "success",
            "data": agent.to_dict()
        }
    except Exception as e:
        db.rollback()
        return {
            "code": 500,
            "msg": f"更新代理商信息失败: {str(e)}",
            "data": None
        }

@router.get("/agent/{agent_id}/detail")
async def get_agent_detail(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """获取代理商详情"""
    try:
        # 检查代理商是否存在
        agent = db.query(User).filter(User.id == agent_id, User.is_agent == True).first()
        if not agent:
            raise HTTPException(status_code=404, detail={"code": 404, "message": "代理商不存在"})
        
        # 检查权限：管理员可以查看所有代理商，代理商只能查看自己的信息
        if not current_user.is_admin and current_user.id != agent_id:
            raise HTTPException(status_code=403, detail={"code": 403, "message": "没有权限执行此操作"})
        
        return {
            "code": 200,
            "message": "success",
            "data": {
                "agent": agent.to_dict()
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取代理商详情失败: {str(e)}")
        raise HTTPException(status_code=500, detail={"code": 500, "message": str(e)})

@router.get("/agent/{agent_id}/statistics")
async def get_agent_statistics(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """获取代理商统计数据"""
    try:
        # 检查代理商是否存在
        agent = db.query(User).filter(User.id == agent_id, User.is_agent == True).first()
        if not agent:
            raise HTTPException(status_code=404, detail={"code": 404, "message": "代理商不存在"})
        
        # 检查权限：管理员可以查看所有代理商，代理商只能查看自己的信息
        if not current_user.is_admin and current_user.id != agent_id:
            raise HTTPException(status_code=403, detail={"code": 403, "message": "没有权限执行此操作"})
        
        # 获取统计数据
        statistics = {
            "total_users": db.query(User).filter(User.agent_id == agent_id).count(),
            "total_balance": agent.balance,
            "total_transactions": db.query(Transaction).filter(Transaction.user_id == agent_id).count()
        }
        
        return {
            "code": 200,
            "message": "success",
            "data": {
                "statistics": statistics
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取代理商统计数据失败: {str(e)}")
        raise HTTPException(status_code=500, detail={"code": 500, "message": str(e)})

@router.post("/agent/{agent_id}/balance/adjust")
async def adjust_agent_balance(
    agent_id: int,
    request: AgentBalanceAdjustRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """调整代理商额度"""
    try:
        logger.info(f"[AgentRouter] 开始调整代理商额度: agent_id={agent_id}, amount={request.amount}")
        
        # 权限检查
        if not current_user.is_admin:
            raise HTTPException(
                status_code=403,
                detail={
                    "code": 403,
                    "message": "只有管理员可以调整代理商额度"
                }
            )
            
        # 查找代理商
        agent = db.query(User).filter(
            User.id == agent_id,
            User.is_agent == True
        ).first()
        
        if not agent:
            raise HTTPException(
                status_code=404,
                detail={
                    "code": 404,
                    "message": "代理商不存在"
                }
            )
            
        # 更新代理商余额
        old_balance = agent.balance
        new_balance = float(old_balance) + request.amount
        
        if new_balance < 0:
            raise HTTPException(
                status_code=400,
                detail={
                    "code": 400,
                    "message": "调整后余额不能小于0"
                }
            )
            
        agent.balance = new_balance
        
        # 创建交易记录
        transaction = Transaction(
            transaction_no=f"ADJ{datetime.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6]}",
            user_id=agent_id,
            agent_id=current_user.id,  # 操作人ID作为代理商ID
            order_no=f"ADJ{datetime.now().strftime('%Y%m%d%H%M%S')}",
            amount=Decimal(str(abs(request.amount))),
            balance=Decimal(str(new_balance)),
            type="adjust",  # 调整类型
            status="success",
            remark=request.remark or f"{'增加' if request.amount > 0 else '减少'}额度 {abs(request.amount)}"
        )
        
        try:
            db.add(transaction)
            db.commit()
            
            logger.info(f"[AgentRouter] 代理商额度调整成功: agent_id={agent_id}, old_balance={old_balance}, new_balance={new_balance}")
            
            return {
                "code": 0,
                "message": "额度调整成功",
                "data": {
                    "old_balance": float(old_balance),
                    "new_balance": float(new_balance),
                    "amount": request.amount
                }
            }
            
        except Exception as e:
            db.rollback()
            logger.error(f"[AgentRouter] 保存额度调整记录失败: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail={
                    "code": 500,
                    "message": "保存额度调整记录失败"
                }
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[AgentRouter] 调整代理商额度失败: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail={
                "code": 500,
                "message": str(e)
            }
        )

@router.get("/agent/{agent_id}/balance/orders")
async def get_agent_balance_orders(
    agent_id: int,
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100),
    startDate: Optional[str] = None,
    endDate: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """获取代理商额度调整订单列表"""
    try:
        logger.info(f"[AgentRouter] 获取代理商额度订单: agent_id={agent_id}")
        
        # 权限检查
        if not current_user.is_admin and current_user.id != agent_id:
            raise HTTPException(status_code=403, detail="没有权限查看此代理商的额度订单")
            
        # 构建查询
        query = db.query(AgentOrder).filter(AgentOrder.agent_id == agent_id)
        
        # 添加日期过滤
        if startDate:
            query = query.filter(AgentOrder.created_at >= startDate)
        if endDate:
            query = query.filter(AgentOrder.created_at <= endDate)
            
        # 计算总数
        total = query.count()
        
        # 获取分页数据
        orders = query.order_by(AgentOrder.created_at.desc()) \
            .offset((page - 1) * pageSize) \
            .limit(pageSize) \
            .all()
            
        # 转换为响应格式
        order_list = []
        for order in orders:
            order_list.append({
                "id": order.id,
                "order_no": order.order_no,
                "amount": float(order.amount),
                "type": order.type,
                "status": order.status,
                "remark": order.remark,
                "created_at": order.created_at.isoformat() if order.created_at else None
            })
            
        return {
            "code": 0,
            "message": "获取额度订单列表成功",
            "data": {
                "list": order_list,
                "total": total
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[AgentRouter] 获取代理商额度订单失败: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/open/app/agent/{id}/users")
async def get_agent_users(
    id: int,
    page: int = Query(1, ge=1),
    pageSize: int = Query(10, ge=1, le=100),
    status: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """获取代理商名下的用户列表"""
    try:
        logger.info(f"[AgentRouter] 开始获取代理商用户列表: agent_id={id}, page={page}, pageSize={pageSize}, status={status}")
        
        # 检查代理商是否存在
        agent = db.query(User).filter(User.id == id, User.is_agent == True).first()
        logger.info(f"[AgentRouter] 查询代理商结果: {agent.to_dict() if agent else None}")
        
        if not agent:
            logger.error(f"[AgentRouter] 代理商不存在: id={id}")
            return {"code": 404, "message": "代理商不存在", "data": None}
        
        # 检查权限
        if not current_user.is_admin and current_user.id != id:
            logger.error(f"[AgentRouter] 权限不足: current_user_id={current_user.id}, agent_id={id}")
            return {"code": 403, "message": "没有权限查看此代理商的用户", "data": None}
        
        # 构建查询
        query = db.query(User).filter(User.agent_id == id)
        logger.info(f"[AgentRouter] 基础查询SQL: {str(query)}")
        
        # 添加状态过滤
        if status:
            if status == 'active':
                query = query.filter(User.status == 1)
            elif status == 'disabled':
                query = query.filter(User.status == 0)
            logger.info(f"[AgentRouter] 添加状态过滤后的SQL: {str(query)}")
        
        # 计算总数
        total = query.count()
        logger.info(f"[AgentRouter] 查询到的总记录数: {total}")
        
        # 分页查询
        users = query.order_by(User.created_at.desc()) \
            .offset((page - 1) * pageSize) \
            .limit(pageSize) \
            .all()
        
        logger.info(f"[AgentRouter] 查询到的用户数量: {len(users)}")
        
        # 转换为响应格式
        user_list = []
        for user in users:
            user_dict = {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "status": "active" if user.status == 1 else "disabled",
                "balance": float(user.balance) if user.balance is not None else 0.0,
                "remark": user.remark,
                "created_at": user.created_at.isoformat() if user.created_at else None,
                "updated_at": user.updated_at.isoformat() if user.updated_at else None,
                "app_username": user.app_username,
                "phone": user.phone
            }
            user_list.append(user_dict)
            logger.info(f"[AgentRouter] 处理用户数据: {user_dict}")
        
        logger.info(f"[AgentRouter] 返回用户列表成功: total={total}, current_page={page}, page_size={pageSize}")
        
        return {
            "code": 0,
            "message": "获取用户列表成功",
            "data": {
                "list": user_list,
                "total": total,
                "page": page,
                "pageSize": pageSize
            }
        }
        
    except Exception as e:
        logger.error(f"[AgentRouter] 获取代理商用户列表失败: {str(e)}")
        logger.error(f"[AgentRouter] 错误详情: {traceback.format_exc()}")
        return {"code": 500, "message": f"获取用户列表失败: {str(e)}", "data": None}

class DynamicProxyParam(BaseModel):
    productNo: str
    proxyType: int
    appUsername: str
    flow: int
    duration: int
    unit: int

class OpenDynamicProxyRequest(BaseModel):
    appOrderNo: str
    params: List[DynamicProxyParam]

@router.post("/open/app/instance/open/v2")
async def open_dynamic_proxy(
    request: OpenDynamicProxyRequest,
    proxy_service: ProxyService = Depends(get_proxy_service),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """开通动态代理实例"""
    try:
        logger.info("[AgentRouter] 开始开通动态代理实例")
        logger.info(f"[AgentRouter] 请求参数: {request.dict()}")

        # 调用IPIPV API开通实例
        response = await proxy_service._make_request(
            "api/open/app/instance/open/v2",
            request.dict()
        )

        if not response or response.get("code") not in [0, 200]:
            error_msg = response.get("msg", "未知错误") if response else "API返回为空"
            logger.error(f"[AgentRouter] 开通动态代理实例失败: {error_msg}")
            return {
                "code": response.get("code", 500) if response else 500,
                "msg": error_msg,
                "data": None
            }

        logger.info(f"[AgentRouter] 开通实例成功: {response}")
        return {
            "code": 0,
            "msg": "success",
            "data": response.get("data")
        }

    except Exception as e:
        logger.error(f"[AgentRouter] 开通动态代理实例失败: {str(e)}")
        logger.error(traceback.format_exc())
        return {
            "code": 500,
            "msg": f"开通动态代理实例失败: {str(e)}",
            "data": None
        }
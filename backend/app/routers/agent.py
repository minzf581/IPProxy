from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.transaction import Transaction
from typing import Dict, Any, List
from pydantic import BaseModel
from typing import Optional
from app.services.ipproxy_service import IPProxyService
from app.models.main_user import MainUser
from app.services.auth import get_current_user
from datetime import datetime
import logging
from sqlalchemy import func
import uuid

# 设置日志记录器
logger = logging.getLogger(__name__)

router = APIRouter()
ipproxy_service = IPProxyService()

class CreateAgentRequest(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    email: Optional[str] = None
    remark: Optional[str] = None
    status: str = "active"  # 默认状态为启用
    balance: float = 1000.0  # 默认额度1000元

class UpdateAgentRequest(BaseModel):
    """更新代理商请求"""
    status: Optional[str] = None
    remark: Optional[str] = None
    balance: Optional[float] = None

def generate_transaction_no() -> str:
    """生成交易号"""
    return f"TRX{datetime.now().strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:6]}"

@router.post("/open/app/proxy/user/v2")
async def create_agent(
    request: CreateAgentRequest,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """创建代理商"""
    try:
        # 创建代理商用户
        agent = User(
            username=request.username,
            password=request.password,
            email=request.email,
            is_agent=True,
            status=request.status,
            balance=request.balance,
            remark=request.remark
        )
        db.add(agent)
        db.flush()  # 获取agent.id

        # 记录初始额度充值交易
        transaction = Transaction(
            user_id=agent.id,
            amount=request.balance,
            type="recharge",
            status="completed",
            remark="初始额度充值"
        )
        db.add(transaction)
        
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
            "msg": str(e),
            "data": None
        }

@router.get("/open/app/agent/list")
async def get_agent_list(
    page: int = 1,
    pageSize: int = 10,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """获取代理商列表"""
    skip = (page - 1) * pageSize
    total = db.query(User).filter(User.is_agent == True).count()
    
    agents = db.query(User).filter(User.is_agent == True).offset(skip).limit(pageSize).all()
    agent_list = [agent.to_dict() for agent in agents]
    
    return {
        "code": 0,
        "msg": "success",
        "data": {
            "list": agent_list,
            "total": total
        }
    }

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
    
    # 获取代理商的统计信息
    total_orders = len(agent.agent_static_orders) + len(agent.agent_dynamic_orders)
    total_revenue = sum([order.amount for order in agent.agent_static_orders]) + \
                   sum([order.amount for order in agent.agent_dynamic_orders])
    
    return {
        "code": 0,
        "message": "success",
        "data": {
            "totalOrders": total_orders,
            "monthlyOrders": 0,  # TODO: 实现月度订单统计
            "totalRevenue": total_revenue,
            "monthlyRevenue": 0  # TODO: 实现月度收入统计
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

@router.post("/agent/{agent_id}/balance")
async def update_agent_balance(
    agent_id: int,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """调整代理商额度"""
    try:
        # 检查代理商是否存在
        agent = db.query(User).filter(User.id == agent_id, User.is_agent == True).first()
        if not agent:
            raise HTTPException(status_code=404, detail={"code": 404, "message": "代理商不存在"})
        
        # 检查权限：只有管理员可以调整代理商额度
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail={"code": 403, "message": "没有权限执行此操作"})
        
        # 获取调整金额和类型
        amount = data.get("amount")
        adjust_type = data.get("type")
        remark = data.get("remark", "")
        
        if not amount or not adjust_type:
            raise HTTPException(status_code=400, detail={"code": 400, "message": "缺少必要参数"})
        
        # 根据类型调整余额
        if adjust_type == "add":
            agent.balance += amount
            transaction_type = "recharge"
        else:
            if agent.balance < amount:
                raise HTTPException(status_code=400, detail={"code": 400, "message": "余额不足"})
            agent.balance -= amount
            transaction_type = "deduction"
        
        # 记录交易
        transaction = Transaction(
            order_no=generate_transaction_no(),
            user_id=agent.id,
            amount=amount,
            type=transaction_type,
            status="completed",
            remark=remark,
            operator_id=current_user.id
        )
        db.add(transaction)
        
        db.commit()
        db.refresh(agent)
        
        return {
            "code": 200,
            "message": "额度调整成功",
            "data": agent.to_dict()
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"调整代理商额度失败: {str(e)}")
        raise HTTPException(status_code=500, detail={"code": 500, "message": str(e)})

@router.post("/agent/{agent_id}/status")
async def update_agent_status(
    agent_id: int,
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """更新代理商状态"""
    try:
        # 检查代理商是否存在
        agent = db.query(User).filter(User.id == agent_id, User.is_agent == True).first()
        if not agent:
            raise HTTPException(status_code=404, detail={"code": 404, "message": "代理商不存在"})
        
        # 检查权限：只有管理员可以更新代理商状态
        if not current_user.is_admin:
            raise HTTPException(status_code=403, detail={"code": 403, "message": "没有权限执行此操作"})
        
        # 更新状态
        status = data.get("status")
        if not status:
            raise HTTPException(status_code=400, detail={"code": 400, "message": "缺少状态参数"})
            
        agent.status = status
        agent.remark = data.get("remark", "")
        
        db.commit()
        db.refresh(agent)
        
        return {
            "code": 200,
            "message": "状态更新成功",
            "data": agent.to_dict()
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"更新代理商状态失败: {str(e)}")
        raise HTTPException(status_code=500, detail={"code": 500, "message": str(e)})

@router.get("/agent/{agent_id}/transactions")
async def get_agent_transactions(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """获取代理商交易记录"""
    try:
        # 检查代理商是否存在
        agent = db.query(User).filter(User.id == agent_id, User.is_agent == True).first()
        if not agent:
            raise HTTPException(status_code=404, detail={"code": 404, "message": "代理商不存在"})
        
        # 检查权限：管理员可以查看所有代理商，代理商只能查看自己的信息
        if not current_user.is_admin and current_user.id != agent_id:
            raise HTTPException(status_code=403, detail={"code": 403, "message": "没有权限执行此操作"})
        
        # 获取交易记录
        transactions = db.query(Transaction).filter(Transaction.user_id == agent_id).all()
        
        return {
            "code": 200,
            "message": "success",
            "data": {
                "transactions": [t.to_dict() for t in transactions]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取代理商交易记录失败: {str(e)}")
        raise HTTPException(status_code=500, detail={"code": 500, "message": str(e)})

@router.api_route("/open/app/area/v2", methods=["GET", "POST"])
async def get_area_list() -> Dict[str, Any]:
    """获取地区列表"""
    try:
        # 调用服务获取区域列表
        result = await ipproxy_service.get_area_v2({"type": 1})
        
        # 确保返回的数据格式正确
        if not result:
            result = []
            
        # 返回标准格式的响应
        return {
            "code": 200,  # 修改为200以匹配前端预期
            "msg": "success",  # 使用msg而不是message
            "data": result
        }
    except Exception as e:
        logger.error(f"获取地区列表失败: {str(e)}")
        return {
            "code": 500,
            "msg": str(e),  # 使用msg而不是message
            "data": None
        } 
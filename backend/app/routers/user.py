from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.transaction import Transaction
from app.models.dynamic_order import DynamicOrder
from app.models.static_order import StaticOrder
from app.models.agent_price import AgentPrice
from app.models.agent_statistics import AgentStatistics
from typing import Dict, Any, List, Optional
from sqlalchemy import or_
from datetime import datetime, timedelta
from app.services.auth import get_current_user
import uuid
from pydantic import BaseModel
import logging
from passlib.hash import bcrypt

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
    remark: Optional[str] = None

router = APIRouter()

@router.get("/open/app/user/list")
async def get_user_list(
    page: int = 1,
    pageSize: int = 10,
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
                "status": user.status,
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

@router.post("/open/app/user/create")
async def create_user(
    user_data: CreateUserRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """创建用户"""
    try:
        # 检查用户名是否已存在
        existing_user = db.query(User).filter(User.username == user_data.username).first()
        if existing_user:
            return {
                "code": 400,
                "msg": "用户名已存在",
                "data": None
            }

        # 创建新用户
        user = User(
            username=user_data.username,
            password=user_data.password,
            email=user_data.email,
            remark=user_data.remark,
            agent_id=None if current_user.is_admin else current_user.id,
            status="active"
        )
        db.add(user)
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
            "msg": f"创建用户失败: {str(e)}",
            "data": None
        }
    finally:
        db.close()

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
    """激活业务"""
    try:
        # 检查用户是否存在
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail={"code": 404, "message": "用户不存在"})
        
        # 检查权限：管理员可以为任何用户激活业务，代理商只能为其下属用户激活业务
        if not current_user.is_admin and current_user.id != user.agent_id:
            raise HTTPException(status_code=403, detail={"code": 403, "message": "没有权限执行此操作"})
        
        # 获取代理商价格设置
        agent = db.query(User).filter(User.id == user.agent_id).first()
        if not agent:
            raise HTTPException(status_code=404, detail={"code": 404, "message": "代理商不存在"})
            
        price_settings = db.query(AgentPrice).filter(AgentPrice.agent_id == agent.id).first()
        if not price_settings:
            price_settings = AgentPrice(agent_id=agent.id)
            db.add(price_settings)
            db.commit()
            db.refresh(price_settings)
        
        # 计算业务费用
        if data["proxyType"] == "dynamic":
            resource_type = data.get("poolType", "resource1")  # 默认使用resource1的价格
            unit_price = price_settings.get_dynamic_price(resource_type)
            total_cost = int(data["traffic"]) * unit_price
        else:
            resource_type = data.get("staticType", "resource1")  # 默认使用resource1的价格
            region = data.get("region", "asia").lower()  # 默认使用亚洲的价格
            unit_price = price_settings.get_static_price(resource_type, region)
            total_cost = int(data["quantity"]) * int(data["duration"]) * unit_price
        
        # 检查代理商余额是否充足
        if agent.balance < total_cost:
            raise HTTPException(
                status_code=400,
                detail={
                    "code": 400,
                    "message": f"代理商余额不足，需要 {total_cost} 元，当前余额 {agent.balance} 元"
                }
            )
        
        # 生成订单号
        order_no = generate_order_no()
        
        # 调用代理服务API
        api_response = await call_proxy_service_api(data)
        if not api_response.get("success"):
            raise HTTPException(
                status_code=500,
                detail={"code": 500, "message": api_response.get("message", "激活业务失败")}
            )
        
        # 创建交易记录
        transaction = Transaction(
            order_no=order_no,
            user_id=user.id,
            agent_id=agent.id,
            amount=total_cost,
            type="consumption",
            status="completed",
            remark=data.get("remark"),
            operator_id=current_user.id
        )
        db.add(transaction)
        
        # 更新代理商余额和统计信息
        agent.balance -= total_cost
        
        # 获取或创建代理商统计信息
        stats = db.query(AgentStatistics).filter(AgentStatistics.agent_id == agent.id).first()
        if not stats:
            stats = AgentStatistics(agent_id=agent.id)
            db.add(stats)
        
        # 更新统计信息
        stats.update_consumption(total_cost)
        if data["proxyType"] == "dynamic":
            stats.update_resource_count(is_dynamic=True, count=int(data["traffic"]))
        else:
            stats.update_resource_count(is_dynamic=False, count=int(data["quantity"]))
        
        # 创建业务订单
        if data["proxyType"] == "dynamic":
            order = DynamicOrder(
                order_no=order_no,
                user_id=user.id,
                agent_id=agent.id,
                pool_type=data["poolType"],
                traffic=int(data["traffic"]),
                status="active",
                remark=data.get("remark"),
                proxy_info=api_response.get("data", {})
            )
        else:
            order = StaticOrder(
                order_no=order_no,
                user_id=user.id,
                agent_id=agent.id,
                region=data["region"],
                country=data["country"],
                city=data["city"],
                static_type=data["staticType"],
                ip_range=data["ipRange"],
                duration=int(data["duration"]),
                quantity=int(data["quantity"]),
                status="active",
                remark=data.get("remark"),
                proxy_info=api_response.get("data", {})
            )
        
        db.add(order)
        db.commit()
        db.refresh(agent)
        db.refresh(stats)
        db.refresh(order)
        
        return {
            "code": 200,
            "message": "业务激活成功",
            "data": {
                "order": order.to_dict(),
                "agent": agent.to_dict(),
                "statistics": stats.to_dict()
            }
        }
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"激活业务失败: {str(e)}")
        raise HTTPException(status_code=500, detail={"code": 500, "message": str(e)})

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
                user_id=user.id,
                region=data["region"],
                country=data["country"],
                city=data["city"],
                static_type=data["staticType"],
                ip_range=data["ipRange"],
                duration=int(data["duration"]),
                quantity=int(data["quantity"]),
                status="active",
                remark=data.get("remark"),
                proxy_info=api_response.get("data", {})
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
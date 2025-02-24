# 仪表盘路由模块
# ==============
#
# 此模块处理所有与仪表盘相关的路由请求，包括：
# - 统计数据展示（账户余额、充值消费等）
# - 动态资源监控（流量使用情况）
# - 静态资源监控（IP使用情况）
# - 实时数据同步
#
# 重要提示：
# ---------
# 1. 此模块是系统监控的核心，需要保证数据的实时性和准确性
# 2. 需要合理处理大量数据的展示和更新
# 3. 注意性能优化，避免频繁的数据库查询
#
# 依赖关系：
# ---------
# - 数据模型：
#   - ProxyInfo (app/models/dashboard.py)
#   - ResourceUsage (app/models/dashboard.py)
#   - MainUser (app/models/main_user.py)
# - 服务：
#   - IPProxyService (app/services/ipproxy_service.py)
#
# 前端对应：
# ---------
# - 服务层：src/services/dashboardService.ts
# - 页面组件：src/pages/dashboard/index.tsx
# - 类型定义：src/types/dashboard.ts
#
# 数据结构：
# ---------
# 1. 统计数据：
#    - 账户余额
#    - 总充值金额
#    - 总消费金额
#    - 月度充值金额
#    - 月度消费金额
#
# 2. 动态资源：
#    - 资源名称
#    - 使用率
#    - 总流量
#    - 已用流量
#    - 剩余流量
#
# 3. 静态资源：
#    - 资源名称
#    - 使用率
#    - 总数量
#    - 已用数量
#    - 可用数量
#
# 修改注意事项：
# ------------
# 1. 数据同步：
#    - 确保数据实时性
#    - 处理同步失败情况
#    - 避免数据不一致
#
# 2. 性能优化：
#    - 使用缓存减少查询
#    - 优化大数据量查询
#    - 合理设置更新频率
#
# 3. 错误处理：
#    - 优雅处理超时
#    - 合理的重试机制
#    - 友好的错误提示
#
# 4. 安全性：
#    - 验证数据访问权限
#    - 保护敏感信息
#    - 防止数据泄露

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
import logging
import json
import traceback

from app.database import get_db
from app.models.user import User
from app.models.resource_usage import ResourceUsageStatistics
from app.services.auth import get_current_user
from app.services.dashboard import DashboardService
from app.core.deps import get_dashboard_service

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/open/app/dashboard/info/v2")
async def get_dashboard_info(
    db: Session = Depends(get_db),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
    current_user: User = Depends(get_current_user),
    target_user_id: Optional[int] = None
):
    """获取仪表盘数据"""
    try:
        logger.info(f"[Dashboard Router] 开始获取仪表盘数据: current_user={current_user.username}, target_user_id={target_user_id}")
        
        # 权限验证
        if target_user_id:
            # 如果指定了目标用户
            target_user = db.query(User).filter(User.id == target_user_id).first()
            if not target_user:
                logger.error(f"[Dashboard Router] 目标用户不存在: target_user_id={target_user_id}")
                raise HTTPException(status_code=404, detail="目标用户不存在")
                
            # 验证访问权限
            if not current_user.is_admin:  # 不是管理员
                if not current_user.is_agent:  # 也不是代理商
                    logger.error(f"[Dashboard Router] 权限不足: current_user={current_user.username} 尝试访问用户 {target_user_id} 的数据")
                    raise HTTPException(status_code=403, detail="没有权限查看其他用户数据")
                # 是代理商，检查目标用户是否为其下属
                if target_user.agent_id != current_user.id:
                    logger.error(f"[Dashboard Router] 代理商权限不足: agent={current_user.username} 尝试访问非下属用户 {target_user_id} 的数据")
                    raise HTTPException(status_code=403, detail="没有权限查看非下属用户数据")
                    
            logger.info(f"[Dashboard Router] 权限验证通过: current_user={current_user.username} 访问用户 {target_user.username} 的数据")
        else:
            # 未指定目标用户，使用当前用户
            target_user_id = current_user.id
            logger.info(f"[Dashboard Router] 使用当前用户: user_id={target_user_id}")
            
        # 获取仪表盘数据
        dashboard_data = await dashboard_service.get_dashboard_data(target_user_id, db)
        
        logger.info(f"[Dashboard Router] 仪表盘数据获取成功: user_id={target_user_id}")
        logger.info(f"[Dashboard Router] 返回数据: {json.dumps(dashboard_data, ensure_ascii=False)}")
        return dashboard_data
        
    except Exception as e:
        logger.error(f"[Dashboard Router] 获取仪表盘数据失败: {str(e)}")
        logger.error(f"[Dashboard Router] 错误详情: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/dashboard/agent/{agent_id}")
async def get_agent_dashboard(
    agent_id: int,
    current_user: User = Depends(get_current_user),
    dashboard_service: DashboardService = Depends(get_dashboard_service),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """获取代理商仪表盘数据"""
    try:
        logger.info(f"[Dashboard Router] 获取代理商仪表盘: agent_id={agent_id}")
        
        # 获取代理商数据
        agent_data = await dashboard_service.get_agent_dashboard_data(agent_id, db)
        
        logger.info("[Dashboard Router] 代理商仪表盘数据获取成功")
        return agent_data
        
    except Exception as e:
        logger.error(f"[Dashboard Router] 获取代理商仪表盘失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/api/dashboard/resources")
async def get_resources(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    dashboard_service: DashboardService = Depends(get_dashboard_service)
):
    """获取动态和静态资源数据"""
    try:
        logger.info(f"[Dashboard Router] 用户 {current_user.username} 请求获取资源数据")
        
        # 获取资源数据
        resources_data = await dashboard_service.get_resources_data(current_user.id, db)
        
        logger.info("[Dashboard Router] 资源数据获取成功")
        return resources_data
        
    except Exception as e:
        logger.error(f"[Dashboard Router] 获取资源数据失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

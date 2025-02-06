from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.static_order_service import StaticOrderService
from app.services.ipipv_base_api import IPIPVBaseAPI
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/api/callback/proxy")
async def proxy_callback(
    type: str = Query(..., description="回调类型(order/instance/product)"),
    no: str = Query(..., description="回调编号"),
    op: str = Query(..., description="操作类型(1=创建,2=续费,3=释放)"),
    db: Session = Depends(get_db)
):
    """
    处理IPIPV回调
    
    参数:
    - type: 回调类型(order/instance/product)
    - no: 回调编号
    - op: 操作类型(1=创建,2=续费,3=释放)
    """
    try:
        logger.info(f"收到IPIPV回调请求: type={type}, no={no}, op={op}")
        
        # 创建服务实例
        service = StaticOrderService(db, IPIPVBaseAPI())
        
        # 处理回调
        result = await service.handle_callback(type, no, op)
        
        logger.info(f"回调处理结果: {result}")
        return result
        
    except Exception as e:
        logger.error(f"回调处理失败: {str(e)}")
        return {
            'code': 'failed',
            'msg': str(e)
        } 
"""
安全相关功能模块
=============

此模块包含所有与安全相关的功能，包括：
1. 密码哈希生成
2. 密码验证
3. 令牌生成和验证

注意事项：
--------
1. 所有密码相关操作都应该使用此模块
2. 保持配置的一致性
3. 记录详细的日志信息
"""

from passlib.context import CryptContext
import logging

# 配置日志
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# 配置密码上下文
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12,  # 设置固定的轮数
    bcrypt__ident="2b",  # 使用 $2b$ 标识符
)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    try:
        logger.debug(f"验证密码: plain_password={plain_password}, hashed_password={hashed_password}")
        result = pwd_context.verify(plain_password, hashed_password)
        logger.debug(f"密码验证结果: {result}")
        return result
    except Exception as e:
        logger.error(f"密码验证失败: {str(e)}")
        return False

def get_password_hash(password: str) -> str:
    """获取密码哈希值"""
    try:
        hashed = pwd_context.hash(password)
        logger.debug(f"生成密码哈希: password={password}, hash={hashed}")
        return hashed
    except Exception as e:
        logger.error(f"密码哈希失败: {str(e)}")
        return None 
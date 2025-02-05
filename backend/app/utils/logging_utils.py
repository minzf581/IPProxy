from typing import Any, Dict

def truncate_response(response: Dict[str, Any], max_length: int = 1000) -> str:
    """截断响应内容，用于日志记录
    
    Args:
        response: API响应字典
        max_length: 最大长度限制
        
    Returns:
        截断后的字符串
    """
    response_str = str(response)
    if len(response_str) > max_length:
        return response_str[:max_length] + "..."
    return response_str 
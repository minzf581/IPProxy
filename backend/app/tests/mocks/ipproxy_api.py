"""
IPIPV API Mock实现
用于测试环境，提供模拟的API响应
"""

import json
from datetime import datetime
from typing import Dict, Any, Optional

class MockIPIPVAPI:
    """模拟IPIPV API的响应"""
    
    def __init__(self):
        """初始化mock数据"""
        self.mock_inventory = {
            "code": 0,
            "msg": "success",
            "data": json.dumps({
                "list": [
                    {
                        "productNo": "test_product_001",
                        "countryCode": "US",
                        "cityCode": "LAX",
                        "inventory": 100,
                        "price": 1.0
                    },
                    {
                        "productNo": "test_product_002",
                        "countryCode": "CA",
                        "cityCode": "TOR",
                        "inventory": 50,
                        "price": 1.5
                    }
                ]
            })
        }
        
        self.mock_order_response = {
            "code": 0,
            "msg": "success",
            "data": json.dumps({
                "orderNo": "TEST_ORDER_001",
                "status": "success",
                "amount": 100.0,
                "instances": [
                    {
                        "instanceNo": "INS_001",
                        "proxyIp": "1.2.3.4",
                        "proxyPort": 8080,
                        "username": "test_user",
                        "password": "test_pass",
                        "expireTime": "2024-12-31T23:59:59Z"
                    }
                ]
            })
        }
    
    async def mock_request(self, endpoint: str, params: Dict[str, Any] = None) -> Optional[Dict[str, Any]]:
        """模拟API请求响应"""
        if "product/query" in endpoint:
            return self.mock_inventory
        elif "instance/open" in endpoint:
            return self.mock_order_response
        else:
            return {
                "code": 0,
                "msg": "success",
                "data": "{}"
            } 
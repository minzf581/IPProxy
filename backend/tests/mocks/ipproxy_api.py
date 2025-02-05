import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, List

class MockIPIPVAPI:
    def __init__(self):
        self.delay = 0
        self.fail_count = 0
        self.current_fails = 0
        
        # 预定义的测试数据
        self.test_data = {
            'open/app/area/v2': [
                {
                    'areaCode': 'AS',
                    'countryList': [
                        {'countryCode': 'CN', 'countryName': '中国'},
                        {'countryCode': 'JP', 'countryName': '日本'}
                    ]
                },
                {
                    'areaCode': 'EU',
                    'countryList': [
                        {'countryCode': 'DE', 'countryName': '德国'},
                        {'countryCode': 'FR', 'countryName': '法国'}
                    ]
                }
            ],
            'open/app/city/list/v2': {
                'CN': [
                    {'cityCode': 'BJ', 'cityName': '北京'},
                    {'cityCode': 'SH', 'cityName': '上海'}
                ],
                'JP': [
                    {'cityCode': 'TK', 'cityName': '东京'},
                    {'cityCode': 'OS', 'cityName': '大阪'}
                ]
            }
        }
    
    def add_delay(self, seconds: int):
        """添加延迟"""
        self.delay = seconds
    
    def fail_next(self, count: int):
        """设置接下来的请求失败次数"""
        self.fail_count = count
        self.current_fails = 0
    
    async def _handle_request(self, endpoint: str, params: Dict[str, Any] = None) -> Any:
        """处理请求的通用方法"""
        if self.delay > 0:
            await asyncio.sleep(self.delay)
        
        # 如果还有失败次数，则抛出异常
        if self.current_fails < self.fail_count:
            self.current_fails += 1
            raise Exception("模拟API请求失败")
        
        # 根据不同的端点返回相应的测试数据
        if endpoint == 'open/app/area/v2':
            if params and params.get('code'):
                # 返回指定区域的数据
                return [area for area in self.test_data[endpoint] 
                       if area['areaCode'] == params['code']]
            return self.test_data[endpoint]
            
        elif endpoint == 'open/app/city/list/v2':
            country_code = params.get('countryCode') if params else None
            if country_code:
                return self.test_data[endpoint].get(country_code, [])
            return []
        
        return None
    
    async def _make_request(self, endpoint: str, params: Dict[str, Any] = None) -> Any:
        """模拟API请求"""
        return await self._handle_request(endpoint, params) 
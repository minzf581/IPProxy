"""
产品查询接口测试
=============

此模块包含对 /api/open/app/product/query/v2 接口的全面测试。
测试场景包括：
1. 不同代理类型的查询
2. 不同地区的查询
3. 不同参数组合的查询
4. 错误参数的处理

代理类型说明：
- 101: 静态云平台
- 102: 静态国内家庭
- 103: 静态国外家庭
- 104: 动态国外
- 105: 动态国内
- 201: whatsapp

产品编号说明：
- out_dynamic_1: 动态国外代理
- aws_light_206: 静态云平台代理
- ipideash_598: 静态数据中心代理
- mb_gmhd5exp2: 静态手机代理
- jp_static_101: 日本静态代理
"""

import pytest
import logging
import json
from app.services.ipipv_base_api import IPIPVBaseAPI
from app.utils.logging_utils import truncate_response
from app.config import settings
import time
import hashlib
import httpx
from datetime import datetime
import aiohttp
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
import base64

# 设置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# 设置其他模块的日志级别
logging.getLogger('app.services.ipipv_base_api').setLevel(logging.DEBUG)
logging.getLogger('httpx').setLevel(logging.DEBUG)

@pytest.mark.asyncio
class TestProductQuery:
    def setup_method(self):
        """测试前的初始化"""
        self.api_url = settings.IPPROXY_API_URL
        self.app_key = settings.IPPROXY_APP_KEY
        self.app_secret = settings.IPPROXY_APP_SECRET
        self.test_results = {}  # 存储测试结果

    @pytest.fixture(scope="class")
    def ipipv_api(self):
        """创建IPIPV API实例"""
        api = IPIPVBaseAPI()
        logger.info("=" * 80)
        logger.info("[测试] API配置:")
        logger.info(f"[测试] base_url = {api.base_url}")
        logger.info(f"[测试] app_key = {api.app_key}")
        logger.info(f"[测试] app_secret = {api.app_secret}")
        logger.info("[测试] 环境变量:")
        logger.info(f"[测试] IPPROXY_API_URL = {settings.IPPROXY_API_URL}")
        logger.info(f"[测试] IPPROXY_APP_KEY = {settings.IPPROXY_APP_KEY}")
        logger.info(f"[测试] IPPROXY_APP_SECRET = {settings.IPPROXY_APP_SECRET}")
        logger.info("=" * 80)
        return api
        
    async def test_1_static_residential_proxy(self, ipipv_api):
        """测试静态住宅代理查询"""
        logger.info("=" * 80)
        logger.info("[测试] 开始测试静态住宅代理查询")
        logger.info("=" * 80)
        
        params = {
            "proxyType": [103],  # 静态国外家庭
            "productNo": "ipideash_598"  # 静态数据中心代理
        }
        
        logger.info("[测试] 步骤1: 准备请求参数")
        logger.info(f"[测试] 原始参数: {json.dumps(params, ensure_ascii=False, indent=2)}")
        
        logger.info("[测试] 步骤2: 加密参数")
        encrypted_params = ipipv_api._encrypt_params(params)
        logger.info(f"[测试] 加密后参数: {encrypted_params}")
        
        logger.info("[测试] 步骤3: 生成签名")
        timestamp = str(int(time.time()))
        sign_str = f"appKey={ipipv_api.app_key}&params={encrypted_params}&timestamp={timestamp}&key={ipipv_api.app_secret}"
        sign = hashlib.md5(sign_str.encode()).hexdigest().upper()
        logger.info(f"[测试] 签名字符串: {sign_str}")
        logger.info(f"[测试] 签名结果: {sign}")
        
        logger.info("[测试] 步骤4: 构建请求参数")
        request_params = {
            'version': 'v2',
            'encrypt': 'AES',
            'appKey': ipipv_api.app_key,
            'reqId': hashlib.md5(f"{time.time()}".encode()).hexdigest(),
            'timestamp': timestamp,
            'params': encrypted_params,
            'sign': sign
        }
        logger.info(f"[测试] 完整请求参数: {json.dumps(request_params, ensure_ascii=False, indent=2)}")
        
        logger.info("[测试] 步骤5: 发送请求")
        url = f"{ipipv_api.base_url}/api/open/app/product/query/v2"
        logger.info(f"[测试] 请求URL: {url}")
        
        async with httpx.AsyncClient(verify=False) as client:
            response = await client.post(
                url,
                json=request_params,
                headers={
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            )
            
            logger.info("[测试] 步骤6: 处理响应")
            logger.info(f"[测试] 响应状态码: {response.status_code}")
            logger.info(f"[测试] 响应头: {json.dumps(dict(response.headers), indent=2)}")
            logger.info(f"[测试] 响应内容: {response.text}")
            
            if response.is_success:
                try:
                    data = response.json()
                    logger.info(f"[测试] 响应JSON: {json.dumps(data, ensure_ascii=False, indent=2)}")
                    
                    if data.get('code') == 0 or data.get('msg') == "OK":
                        encrypted_data = data.get('data')
                        if encrypted_data:
                            logger.info(f"[测试] 加密的响应数据: {encrypted_data}")
                            decrypted_data = ipipv_api._decrypt_response(encrypted_data)
                            logger.info(f"[测试] 解密后的数据: {json.dumps(decrypted_data, ensure_ascii=False, indent=2) if decrypted_data else None}")
                        else:
                            logger.error("[测试] 响应中没有加密数据")
                    else:
                        logger.error(f"[测试] API错误: {data.get('msg')}")
                except json.JSONDecodeError as e:
                    logger.error(f"[测试] JSON解析错误: {str(e)}")
            else:
                logger.error(f"[测试] HTTP请求失败: {response.status_code}")
                logger.error(f"[测试] 错误响应: {response.text}")
        
        logger.info("[测试] 步骤7: 使用基础API方法发送请求")
        response = await ipipv_api._make_request("api/open/app/product/query/v2", params)
        logger.info(f"[测试] 基础API响应: {truncate_response(response)}")
        
        logger.info("[测试] 步骤8: 验证响应")
        assert response is not None, "响应不应为空"
        if isinstance(response, list):
            for product in response:
                assert "productNo" in product, "产品编号字段缺失"
                assert "productName" in product, "产品名称字段缺失"
                assert "inventory" in product, "库存数量字段缺失"
                assert "costPrice" in product, "价格字段缺失"
                
        logger.info("=" * 80)
        logger.info("[测试] 测试完成")
        logger.info("=" * 80)
        
    async def test_2_static_datacenter_proxy(self, ipipv_api):
        """测试静态数据中心代理查询"""
        params = {
            "proxyType": [102],  # 静态数据中心代理
            "productNo": "ipideash_598",  # 静态数据中心代理
            "countryCode": "US",  # 美国
            "cityCode": "US000NYC",  # 纽约
            "ispType": 4,  # 数据中心类型
            "unit": 3,  # 月
            "duration": 1  # 1个月
        }
        
        logger.info(f"[测试] 静态数据中心代理查询，参数: {json.dumps(params, ensure_ascii=False)}")
        response = await ipipv_api._make_request("api/open/app/product/query/v2", params)
        logger.info(f"[测试] 响应: {truncate_response(response)}")
        
        assert response is not None, "响应不应为空"
        if isinstance(response, list):
            for product in response:
                assert "productNo" in product, "产品编号字段缺失"
                assert "productName" in product, "产品名称字段缺失"
                assert "inventory" in product, "库存数量字段缺失"
                assert "costPrice" in product, "价格字段缺失"
                assert "ispType" in product, "ISP类型字段缺失"
                
    async def test_3_static_mobile_proxy(self, ipipv_api):
        """测试静态手机代理查询"""
        params = {
            "proxyType": [103],  # 静态手机代理
            "productNo": "mb_gmhd5exp2",  # 静态手机代理
            "countryCode": "GB",  # 英国
            "cityCode": "GB000LON",  # 伦敦
            "unit": 3,  # 月
            "duration": 1  # 1个月
        }
        
        logger.info(f"[测试] 静态手机代理查询，参数: {json.dumps(params, ensure_ascii=False)}")
        response = await ipipv_api._make_request("api/open/app/product/query/v2", params)
        logger.info(f"[测试] 响应: {truncate_response(response)}")
        
        assert response is not None, "响应不应为空"
        if isinstance(response, list):
            for product in response:
                assert "productNo" in product, "产品编号字段缺失"
                assert "productName" in product, "产品名称字段缺失"
                assert "inventory" in product, "库存数量字段缺失"
                assert "costPrice" in product, "价格字段缺失"
                
    async def test_4_dynamic_foreign_proxy(self, ipipv_api):
        """测试动态国外代理查询"""
        params = {
            "proxyType": [104],  # 动态国外
            "productNo": "out_dynamic_1",  # 动态国外代理
            "countryCode": "US",  # 美国
            "cityCode": "US000NYC",  # 纽约
            "unit": 3,  # 月
            "duration": 1  # 1个月
        }
        
        logger.info(f"[测试] 动态国外代理查询，参数: {json.dumps(params, ensure_ascii=False)}")
        response = await ipipv_api._make_request("api/open/app/product/query/v2", params)
        logger.info(f"[测试] 响应: {truncate_response(response)}")
        
        assert response is not None, "响应不应为空"
        if isinstance(response, list):
            for product in response:
                assert "productNo" in product, "产品编号字段缺失"
                assert "productName" in product, "产品名称字段缺失"
                assert "inventory" in product, "库存数量字段缺失"
                assert "costPrice" in product, "价格字段缺失"
                
    async def test_5_whatsapp_proxy(self, ipipv_api):
        """测试 WhatsApp 代理查询"""
        params = {
            "proxyType": [201],  # WhatsApp
            "countryCode": "US",  # 美国
            "cityCode": "US000NYC",  # 纽约
            "unit": 3,  # 月
            "duration": 1  # 1个月
        }
        
        logger.info(f"[测试] WhatsApp 代理查询，参数: {json.dumps(params, ensure_ascii=False)}")
        response = await ipipv_api._make_request("api/open/app/product/query/v2", params)
        logger.info(f"[测试] 响应: {truncate_response(response)}")
        
        assert response is not None, "响应不应为空"
        if isinstance(response, list):
            for product in response:
                assert "productNo" in product, "产品编号字段缺失"
                assert "productName" in product, "产品名称字段缺失"
                assert "inventory" in product, "库存数量字段缺失"
                assert "costPrice" in product, "价格字段缺失"
                
    async def test_6_different_durations(self, ipipv_api):
        """测试不同时长单位和时长的查询"""
        test_cases = [
            {"unit": 1, "duration": 7},  # 7天
            {"unit": 2, "duration": 1},  # 1周
            {"unit": 3, "duration": 1},  # 1月
            {"unit": 4, "duration": 1},  # 1年
        ]
        
        for case in test_cases:
            params = {
                "proxyType": [101],  # 静态云平台
                "productNo": "aws_light_206",  # 静态云平台代理
                "countryCode": "JP",  # 日本
                "cityCode": "JP000TYO",  # 东京
                "unit": case["unit"],
                "duration": case["duration"]
            }
            
            logger.info(f"[测试] 不同时长查询，参数: {json.dumps(params, ensure_ascii=False)}")
            response = await ipipv_api._make_request("api/open/app/product/query/v2", params)
            logger.info(f"[测试] 响应: {truncate_response(response)}")
            
            assert response is not None, "响应不应为空"
            if isinstance(response, list):
                for product in response:
                    assert "unit" in product, "时长单位字段缺失"
                    assert "duration" in product, "时长字段缺失"
                    
    async def test_7_error_handling(self, ipipv_api):
        """测试错误参数处理"""
        error_cases = [
            {
                "case": "空代理类型",
                "params": {
                    "proxyType": [],
                    "countryCode": "JP"
                }
            },
            {
                "case": "无效代理类型",
                "params": {
                    "proxyType": [999],
                    "countryCode": "JP"
                }
            },
            {
                "case": "无效产品编号",
                "params": {
                    "proxyType": [101],
                    "productNo": "invalid_product",
                    "countryCode": "JP"
                }
            },
            {
                "case": "无效国家代码",
                "params": {
                    "proxyType": [101],
                    "countryCode": "XX"
                }
            },
            {
                "case": "无效城市代码",
                "params": {
                    "proxyType": [101],
                    "countryCode": "JP",
                    "cityCode": "INVALID"
                }
            }
        ]
        
        for case in error_cases:
            logger.info(f"[测试] {case['case']}，参数: {json.dumps(case['params'], ensure_ascii=False)}")
            response = await ipipv_api._make_request("api/open/app/product/query/v2", case["params"])
            logger.info(f"[测试] 响应: {truncate_response(response)}")
            
            # 错误情况下应该返回空列表或错误信息
            if response is not None and isinstance(response, list):
                assert len(response) == 0, f"{case['case']}应返回空列表"
        
    async def test_get_product_stock(self):
        """测试获取产品库存"""
        async with aiohttp.ClientSession() as session:
            for proxy_type in [101, 102, 103, 104, 105, 201]:
                # 构造请求参数
                timestamp = str(int(time.time()))
                business_params = {
                    "proxyType": [proxy_type]  # 使用数组格式
                }
                
                # 加密业务参数
                key = self.app_secret.encode('utf-8')[:32]
                iv = self.app_secret.encode('utf-8')[:16]
                cipher = AES.new(key, AES.MODE_CBC, iv)
                json_params = json.dumps(business_params, separators=(',', ':'), ensure_ascii=False)
                padded_data = pad(json_params.encode('utf-8'), AES.block_size, style='pkcs7')
                encrypted = cipher.encrypt(padded_data)
                encrypted_params = base64.b64encode(encrypted).decode('ascii')
                
                # 构建完整请求参数
                request_params = {
                    'version': 'v2',
                    'encrypt': 'AES',
                    'appKey': self.app_key,
                    'reqId': hashlib.md5(f"{time.time()}".encode()).hexdigest(),
                    'timestamp': timestamp,
                    'params': encrypted_params
                }
                
                # 计算签名
                sign_str = f"appKey={self.app_key}&params={encrypted_params}&timestamp={timestamp}&key={self.app_secret}"
                request_params['sign'] = hashlib.md5(sign_str.encode()).hexdigest().upper()
                
                # 发送请求
                url = f"{self.api_url}/api/open/app/product/query/v2"
                print(f"\n发送请求到 {url}")
                print(f"请求参数: {request_params}")
                async with session.post(url, json=request_params) as response:
                    result = await response.json()
                    print(f"代理类型 {proxy_type} 的响应: {truncate_response(result)}")
                    
                    # 记录结果
                    success = result.get("code") == 200
                    if success and result.get("data"):
                        # 解密响应数据
                        try:
                            # 清理输入字符串
                            encrypted_data = result["data"]
                            cleaned_text = ''.join(
                                c for c in encrypted_data 
                                if c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
                            )
                            
                            # Base64解码
                            encrypted = base64.b64decode(cleaned_text)
                            
                            # 准备解密密钥和IV
                            key = self.app_secret.encode('utf-8')[:32]
                            iv = self.app_secret.encode('utf-8')[:16]
                            
                            # 执行解密
                            cipher = AES.new(key, AES.MODE_CBC, iv)
                            decrypted = unpad(cipher.decrypt(encrypted), AES.block_size, style='pkcs7')
                            
                            # 尝试不同编码方式
                            for encoding in ['utf-8', 'latin1', 'ascii']:
                                try:
                                    decrypted_text = decrypted.decode(encoding)
                                    print(f"使用 {encoding} 解码成功")
                                    print(f"解码后文本: {decrypted_text}")
                                    break
                                except UnicodeDecodeError:
                                    print(f"{encoding} 解码失败")
                                    continue
                            else:
                                print("所有编码方式都解码失败")
                                decrypted_text = None
                            
                            if decrypted_text:
                                try:
                                    decrypted_data = json.loads(decrypted_text)
                                    products = decrypted_data if isinstance(decrypted_data, list) else []
                                except json.JSONDecodeError as e:
                                    print(f"JSON解析失败: {e}")
                                    products = []
                            else:
                                products = []
                                
                        except Exception as e:
                            print(f"解密响应数据失败: {e}")
                            products = []
                    else:
                        products = []
                    
                    self.test_results[proxy_type] = {
                        "success": success,
                        "products": products
                    }
            
        # 生成测试报告
        report = "# 产品库存查询测试报告\n\n"
        report += "## 测试时间\n"
        report += f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        report += "## 测试环境\n"
        report += f"- API URL: {self.api_url}\n"
        report += f"- APP ID: {self.app_key}\n"
        report += f"- APP KEY: {self.app_key}\n\n"
        report += "## 测试结果汇总\n\n"
        
        # 添加统计信息
        success_count = len([r for r in self.test_results.values() if r['success']])
        total_products = sum(len(r['products']) for r in self.test_results.values())
        report += f"- 总测试用例数量: {len(self.test_results)}\n"
        report += f"- 成功用例数量: {success_count}\n"
        report += f"- 失败用例数量: {len(self.test_results) - success_count}\n"
        report += f"- 总产品数量: {total_products}\n\n"
        
        report += "## 详细测试结果\n\n"
        for proxy_type, result in self.test_results.items():
            report += f"### 代理类型: {proxy_type}\n"
            report += f"- 查询结果: {'成功' if result['success'] else '失败'}\n"
            
            if result['products']:
                report += f"- 产品数量: {len(result['products'])}\n"
                report += "- 产品列表:\n"
                for product in result['products']:
                    report += "  ```\n"
                    for key, value in product.items():
                        report += f"  {key}: {value}\n"
                    report += "  ```\n"
            else:
                report += "- 无可用产品\n"
            
            report += "\n"
        
        # 保存测试报告
        with open("docs/product_stock_test_report.md", "w", encoding="utf-8") as f:
            f.write(report)
            
        logger.info("=" * 80)
        logger.info("[测试] 产品库存测试报告已生成: docs/product_stock_test_report.md")
        logger.info("=" * 80) 
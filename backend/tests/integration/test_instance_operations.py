"""
代理实例操作测试
=============

此模块测试代理实例相关的API：
1. /api/open/app/instance/v2 - 获取实例列表（通过供应商实例编号）
2. /api/open/app/instance/open/v2 - 开通代理

代理类型说明：
- 103: 静态国外家庭代理

测试场景：
1. 获取实例列表
   - 不同状态的实例
   - 不同类型的实例
   - 分页查询
   
2. 开通代理
   - 不同区域
   - 不同时长
   - 不同数量
"""

import pytest
import logging
import json
from app.services.ipipv_base_api import IPIPVBaseAPI
from app.utils.logging_utils import truncate_response
from app.config import settings
from datetime import datetime

# 设置日志
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 设置其他模块的日志级别
logging.getLogger('app.services.ipipv_base_api').setLevel(logging.DEBUG)

@pytest.mark.asyncio
class TestInstanceOperations:
    @pytest.fixture(scope="class")
    def ipipv_api(self):
        """创建IPIPV API实例"""
        return IPIPVBaseAPI()
        
    async def test_1_get_instance_list(self, ipipv_api):
        """测试获取实例列表"""
        logger.info("=" * 80)
        logger.info("[测试] 开始测试获取实例列表")
        logger.info("=" * 80)
        
        # 测试不同的实例编号
        test_cases = [
            {
                "name": "实例编号1",
                "params": {
                    "instanceNo": "ipideash_598_001"  # 示例实例编号
                }
            },
            {
                "name": "实例编号2",
                "params": {
                    "instanceNo": "ipideash_598_002"  # 示例实例编号
                }
            },
            {
                "name": "实例编号3",
                "params": {
                    "instanceNo": "ipideash_599_001"  # 示例实例编号
                }
            },
            {
                "name": "实例编号4",
                "params": {
                    "instanceNo": "mb_gmhd5exp1_001"  # 示例实例编号
                }
            },
            {
                "name": "实例编号5",
                "params": {
                    "instanceNo": "mb_gmhd5exp2_001"  # 示例实例编号
                }
            }
        ]
        
        results = []
        for case in test_cases:
            logger.info(f"[测试] 执行测试用例: {case['name']}")
            logger.info(f"[测试] 请求参数: {json.dumps(case['params'], ensure_ascii=False)}")
            
            response = await ipipv_api._make_request("api/open/app/instance/v2", case["params"])
            logger.info(f"[测试] 响应: {truncate_response(response)}")
            
            result = {
                "用例名称": case["name"],
                "实例编号": case["params"]["instanceNo"],
                "查询结果": "成功" if response else "失败",
                "实例信息": None
            }
            
            if response:
                if isinstance(response, dict):
                    result["实例信息"] = response
                elif isinstance(response, list) and len(response) > 0:
                    result["实例信息"] = response[0]
            
            results.append(result)
            logger.info(f"[测试] 测试用例结果: {json.dumps(result, ensure_ascii=False, indent=2)}")
            
        # 生成测试报告
        report = "# 代理实例查询测试报告\n\n"
        report += "## 测试时间\n"
        report += f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        report += "## 测试环境\n"
        report += f"- API URL: {settings.IPPROXY_API_URL}\n"
        report += f"- APP KEY: {settings.IPPROXY_APP_KEY}\n\n"
        report += "## 测试结果汇总\n\n"
        
        # 添加统计信息
        success_count = len([r for r in results if r['查询结果'] == "成功"])
        report += f"- 总测试用例数量: {len(results)}\n"
        report += f"- 成功用例数量: {success_count}\n"
        report += f"- 失败用例数量: {len(results) - success_count}\n\n"
        
        report += "## 详细测试结果\n\n"
        for result in results:
            report += f"### {result['用例名称']}\n"
            report += f"- 实例编号: {result['实例编号']}\n"
            report += f"- 查询结果: {result['查询结果']}\n"
            
            if result['实例信息']:
                report += "- 实例信息:\n"
                report += "  ```\n"
                for key, value in result['实例信息'].items():
                    report += f"  {key}: {value}\n"
                report += "  ```\n"
            
            report += "\n"
        
        # 保存测试报告
        with open("docs/instance_query_test_report.md", "w", encoding="utf-8") as f:
            f.write(report)
            
        logger.info("=" * 80)
        logger.info("[测试] 实例查询测试报告已生成: docs/instance_query_test_report.md")
        logger.info("=" * 80)
        
    async def test_2_open_instance(self, ipipv_api):
        """测试开通代理"""
        logger.info("=" * 80)
        logger.info("[测试] 开始测试开通代理")
        logger.info("=" * 80)
        
        # 测试不同的开通参数组合
        test_cases = [
            {
                "name": "韩国数据中心代理",
                "params": {
                    "proxyType": 103,
                    "countryCode": "KOR",
                    "cityCode": "KOR000000",
                    "count": 1,
                    "unit": 3,  # 月
                    "duration": 1  # 1个月
                }
            },
            {
                "name": "日本数据中心代理",
                "params": {
                    "proxyType": 103,
                    "countryCode": "JP",
                    "cityCode": "JP000TYO",
                    "count": 1,
                    "unit": 3,
                    "duration": 1
                }
            },
            {
                "name": "美国数据中心代理",
                "params": {
                    "proxyType": 103,
                    "countryCode": "US",
                    "cityCode": "US000NYC",
                    "count": 1,
                    "unit": 3,
                    "duration": 1
                }
            },
            {
                "name": "英国数据中心代理",
                "params": {
                    "proxyType": 103,
                    "countryCode": "GB",
                    "cityCode": "GB000LON",
                    "count": 1,
                    "unit": 3,
                    "duration": 1
                }
            },
            {
                "name": "德国数据中心代理",
                "params": {
                    "proxyType": 103,
                    "countryCode": "DE",
                    "cityCode": "DE000BER",
                    "count": 1,
                    "unit": 3,
                    "duration": 1
                }
            }
        ]
        
        results = []
        for case in test_cases:
            logger.info(f"[测试] 执行测试用例: {case['name']}")
            logger.info(f"[测试] 请求参数: {json.dumps(case['params'], ensure_ascii=False)}")
            
            response = await ipipv_api._make_request("api/open/app/instance/open/v2", case["params"])
            logger.info(f"[测试] 响应: {truncate_response(response)}")
            
            result = {
                "用例名称": case["name"],
                "请求参数": case["params"],
                "开通结果": "成功" if response else "失败",
                "实例信息": None
            }
            
            if response:
                if isinstance(response, list):
                    result["实例信息"] = response
                elif isinstance(response, dict):
                    result["实例信息"] = [response]
            
            results.append(result)
            logger.info(f"[测试] 测试用例结果: {json.dumps(result, ensure_ascii=False, indent=2)}")
            
        # 生成测试报告
        report = "# 代理开通测试报告\n\n"
        report += "## 测试时间\n"
        report += f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        report += "## 测试环境\n"
        report += f"- API URL: {settings.IPPROXY_API_URL}\n"
        report += f"- APP KEY: {settings.IPPROXY_APP_KEY}\n\n"
        report += "## 测试结果汇总\n\n"
        
        # 添加统计信息
        success_count = len([r for r in results if r['开通结果'] == "成功"])
        report += f"- 总测试用例数量: {len(results)}\n"
        report += f"- 成功用例数量: {success_count}\n"
        report += f"- 失败用例数量: {len(results) - success_count}\n\n"
        
        report += "## 详细测试结果\n\n"
        for result in results:
            report += f"### {result['用例名称']}\n"
            report += f"- 请求参数: {json.dumps(result['请求参数'], ensure_ascii=False)}\n"
            report += f"- 开通结果: {result['开通结果']}\n"
            
            if result['实例信息']:
                report += "- 实例信息:\n"
                for instance in result['实例信息']:
                    report += "  ```\n"
                    for key, value in instance.items():
                        report += f"  {key}: {value}\n"
                    report += "  ```\n"
            
            report += "\n"
        
        # 保存测试报告
        with open("docs/instance_open_test_report.md", "w", encoding="utf-8") as f:
            f.write(report)
            
        logger.info("=" * 80)
        logger.info("[测试] 代理开通测试报告已生成: docs/instance_open_test_report.md")
        logger.info("=" * 80) 
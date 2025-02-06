"""
产品和代理类型组合测试
==================

此模块专注于测试代理类型103（静态国外家庭）的不同产品编号组合。

代理类型说明：
- 103: 静态国外家庭代理

测试不同产品编号：
1. 数据中心系列 (ipideash_xxx):
   - 598-602: 亚洲区域
   - 603-607: 欧洲区域
   - 608-612: 北美区域
   - 613-617: 南美区域
   - 618-622: 大洋洲区域
   - 623-627: 非洲区域

2. 手机代理系列 (mb_gmhd5expx):
   - 1-5: 欧洲区域
   - 6-10: 亚洲区域
   - 11-15: 美洲区域
   - 16-20: 其他区域
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
class TestProductCombinations:
    @pytest.fixture(scope="class")
    def ipipv_api(self):
        """创建IPIPV API实例"""
        return IPIPVBaseAPI()

    async def test_product_combinations(self, ipipv_api):
        """测试代理类型103的不同产品组合"""
        combinations = [
            # 亚洲数据中心代理
            {
                "name": "韩国数据中心代理",
                "productNo": "ipideash_598",
                "countryCode": "KOR",
                "cityCode": "KOR000000",
                "detail": "韩国首尔"
            },
            {
                "name": "日本数据中心代理",
                "productNo": "ipideash_599",
                "countryCode": "JP",
                "cityCode": "JP000TYO",
                "detail": "日本东京"
            },
            {
                "name": "新加坡数据中心代理",
                "productNo": "ipideash_600",
                "countryCode": "SGP",
                "cityCode": "SGP000001",
                "detail": "新加坡"
            },
            {
                "name": "香港数据中心代理",
                "productNo": "ipideash_601",
                "countryCode": "HK",
                "cityCode": "HK000001",
                "detail": "香港"
            },
            {
                "name": "台湾数据中心代理",
                "productNo": "ipideash_602",
                "countryCode": "TWN",
                "cityCode": "TWN00001",
                "detail": "台北"
            },
            # 欧洲数据中心代理
            {
                "name": "德国数据中心代理",
                "productNo": "ipideash_603",
                "countryCode": "DE",
                "cityCode": "DE000BER",
                "detail": "德国柏林"
            },
            {
                "name": "法国数据中心代理",
                "productNo": "ipideash_604",
                "countryCode": "FR",
                "cityCode": "FR000PAR",
                "detail": "法国巴黎"
            },
            {
                "name": "英国数据中心代理",
                "productNo": "ipideash_605",
                "countryCode": "GB",
                "cityCode": "GB000LON",
                "detail": "英国伦敦"
            },
            {
                "name": "意大利数据中心代理",
                "productNo": "ipideash_606",
                "countryCode": "IT",
                "cityCode": "IT000ROM",
                "detail": "意大利罗马"
            },
            {
                "name": "西班牙数据中心代理",
                "productNo": "ipideash_607",
                "countryCode": "ES",
                "cityCode": "ES000MAD",
                "detail": "西班牙马德里"
            },
            # 北美数据中心代理
            {
                "name": "美国纽约数据中心代理",
                "productNo": "ipideash_608",
                "countryCode": "US",
                "cityCode": "US000NYC",
                "detail": "美国纽约"
            },
            {
                "name": "美国洛杉矶数据中心代理",
                "productNo": "ipideash_609",
                "countryCode": "US",
                "cityCode": "US000LAX",
                "detail": "美国洛杉矶"
            },
            {
                "name": "美国芝加哥数据中心代理",
                "productNo": "ipideash_610",
                "countryCode": "US",
                "cityCode": "US000CHI",
                "detail": "美国芝加哥"
            },
            {
                "name": "加拿大多伦多数据中心代理",
                "productNo": "ipideash_611",
                "countryCode": "CA",
                "cityCode": "CA000TOR",
                "detail": "加拿大多伦多"
            },
            {
                "name": "加拿大温哥华数据中心代理",
                "productNo": "ipideash_612",
                "countryCode": "CA",
                "cityCode": "CA000VAN",
                "detail": "加拿大温哥华"
            },
            # 南美数据中心代理
            {
                "name": "巴西圣保罗数据中心代理",
                "productNo": "ipideash_613",
                "countryCode": "BR",
                "cityCode": "BR000SAO",
                "detail": "巴西圣保罗"
            },
            {
                "name": "阿根廷布宜诺斯艾利斯数据中心代理",
                "productNo": "ipideash_614",
                "countryCode": "AR",
                "cityCode": "AR000BUE",
                "detail": "阿根廷布宜诺斯艾利斯"
            },
            {
                "name": "智利圣地亚哥数据中心代理",
                "productNo": "ipideash_615",
                "countryCode": "CL",
                "cityCode": "CL000STG",
                "detail": "智利圣地亚哥"
            },
            {
                "name": "哥伦比亚波哥大数据中心代理",
                "productNo": "ipideash_616",
                "countryCode": "CO",
                "cityCode": "CO000BOG",
                "detail": "哥伦比亚波哥大"
            },
            {
                "name": "秘鲁利马数据中心代理",
                "productNo": "ipideash_617",
                "countryCode": "PE",
                "cityCode": "PE000LIM",
                "detail": "秘鲁利马"
            },
            # 大洋洲数据中心代理
            {
                "name": "澳大利亚悉尼数据中心代理",
                "productNo": "ipideash_618",
                "countryCode": "AU",
                "cityCode": "AU000SYD",
                "detail": "澳大利亚悉尼"
            },
            {
                "name": "澳大利亚墨尔本数据中心代理",
                "productNo": "ipideash_619",
                "countryCode": "AU",
                "cityCode": "AU000MEL",
                "detail": "澳大利亚墨尔本"
            },
            {
                "name": "新西兰奥克兰数据中心代理",
                "productNo": "ipideash_620",
                "countryCode": "NZ",
                "cityCode": "NZ000AKL",
                "detail": "新西兰奥克兰"
            },
            {
                "name": "新西兰惠灵顿数据中心代理",
                "productNo": "ipideash_621",
                "countryCode": "NZ",
                "cityCode": "NZ000WLG",
                "detail": "新西兰惠灵顿"
            },
            {
                "name": "斐济苏瓦数据中心代理",
                "productNo": "ipideash_622",
                "countryCode": "FJ",
                "cityCode": "FJ000SUV",
                "detail": "斐济苏瓦"
            },
            # 非洲数据中心代理
            {
                "name": "南非约翰内斯堡数据中心代理",
                "productNo": "ipideash_623",
                "countryCode": "ZA",
                "cityCode": "ZA000JNB",
                "detail": "南非约翰内斯堡"
            },
            {
                "name": "埃及开罗数据中心代理",
                "productNo": "ipideash_624",
                "countryCode": "EG",
                "cityCode": "EG000CAI",
                "detail": "埃及开罗"
            },
            {
                "name": "尼日利亚拉各斯数据中心代理",
                "productNo": "ipideash_625",
                "countryCode": "NG",
                "cityCode": "NG000LOS",
                "detail": "尼日利亚拉各斯"
            },
            {
                "name": "肯尼亚内罗毕数据中心代理",
                "productNo": "ipideash_626",
                "countryCode": "KE",
                "cityCode": "KE000NBO",
                "detail": "肯尼亚内罗毕"
            },
            {
                "name": "摩洛哥卡萨布兰卡数据中心代理",
                "productNo": "ipideash_627",
                "countryCode": "MA",
                "cityCode": "MA000CAS",
                "detail": "摩洛哥卡萨布兰卡"
            },
            # 欧洲手机代理
            {
                "name": "英国手机代理",
                "productNo": "mb_gmhd5exp1",
                "countryCode": "GB",
                "cityCode": "GB000LON",
                "detail": "英国伦敦"
            },
            {
                "name": "法国手机代理",
                "productNo": "mb_gmhd5exp2",
                "countryCode": "FR",
                "cityCode": "FR000PAR",
                "detail": "法国巴黎"
            },
            {
                "name": "德国手机代理",
                "productNo": "mb_gmhd5exp3",
                "countryCode": "DE",
                "cityCode": "DE000BER",
                "detail": "德国柏林"
            },
            {
                "name": "意大利手机代理",
                "productNo": "mb_gmhd5exp4",
                "countryCode": "IT",
                "cityCode": "IT000ROM",
                "detail": "意大利罗马"
            },
            {
                "name": "西班牙手机代理",
                "productNo": "mb_gmhd5exp5",
                "countryCode": "ES",
                "cityCode": "ES000MAD",
                "detail": "西班牙马德里"
            },
            # 亚洲手机代理
            {
                "name": "日本手机代理",
                "productNo": "mb_gmhd5exp6",
                "countryCode": "JP",
                "cityCode": "JP000TYO",
                "detail": "日本东京"
            },
            {
                "name": "韩国手机代理",
                "productNo": "mb_gmhd5exp7",
                "countryCode": "KOR",
                "cityCode": "KOR000000",
                "detail": "韩国首尔"
            },
            {
                "name": "新加坡手机代理",
                "productNo": "mb_gmhd5exp8",
                "countryCode": "SGP",
                "cityCode": "SGP000001",
                "detail": "新加坡"
            },
            {
                "name": "香港手机代理",
                "productNo": "mb_gmhd5exp9",
                "countryCode": "HK",
                "cityCode": "HK000001",
                "detail": "香港"
            },
            {
                "name": "台湾手机代理",
                "productNo": "mb_gmhd5exp10",
                "countryCode": "TWN",
                "cityCode": "TWN00001",
                "detail": "台北"
            },
            # 美洲手机代理
            {
                "name": "美国纽约手机代理",
                "productNo": "mb_gmhd5exp11",
                "countryCode": "US",
                "cityCode": "US000NYC",
                "detail": "美国纽约"
            },
            {
                "name": "美国洛杉矶手机代理",
                "productNo": "mb_gmhd5exp12",
                "countryCode": "US",
                "cityCode": "US000LAX",
                "detail": "美国洛杉矶"
            },
            {
                "name": "加拿大多伦多手机代理",
                "productNo": "mb_gmhd5exp13",
                "countryCode": "CA",
                "cityCode": "CA000TOR",
                "detail": "加拿大多伦多"
            },
            {
                "name": "巴西圣保罗手机代理",
                "productNo": "mb_gmhd5exp14",
                "countryCode": "BR",
                "cityCode": "BR000SAO",
                "detail": "巴西圣保罗"
            },
            {
                "name": "阿根廷布宜诺斯艾利斯手机代理",
                "productNo": "mb_gmhd5exp15",
                "countryCode": "AR",
                "cityCode": "AR000BUE",
                "detail": "阿根廷布宜诺斯艾利斯"
            },
            # 其他地区手机代理
            {
                "name": "澳大利亚悉尼手机代理",
                "productNo": "mb_gmhd5exp16",
                "countryCode": "AU",
                "cityCode": "AU000SYD",
                "detail": "澳大利亚悉尼"
            },
            {
                "name": "新西兰奥克兰手机代理",
                "productNo": "mb_gmhd5exp17",
                "countryCode": "NZ",
                "cityCode": "NZ000AKL",
                "detail": "新西兰奥克兰"
            },
            {
                "name": "南非约翰内斯堡手机代理",
                "productNo": "mb_gmhd5exp18",
                "countryCode": "ZA",
                "cityCode": "ZA000JNB",
                "detail": "南非约翰内斯堡"
            },
            {
                "name": "埃及开罗手机代理",
                "productNo": "mb_gmhd5exp19",
                "countryCode": "EG",
                "cityCode": "EG000CAI",
                "detail": "埃及开罗"
            },
            {
                "name": "阿联酋迪拜手机代理",
                "productNo": "mb_gmhd5exp20",
                "countryCode": "AE",
                "cityCode": "AE000DXB",
                "detail": "阿联酋迪拜"
            }
        ]

        # 创建结果文档
        results = []
        
        for combo in combinations:
            logger.info("=" * 80)
            logger.info(f"[测试] 测试组合: {combo['name']}")
            logger.info(f"[测试] 参数: {json.dumps(combo, ensure_ascii=False, indent=2)}")
            
            params = {
                "proxyType": [103],  # 固定使用103类型
                "productNo": combo["productNo"],
                "countryCode": combo["countryCode"],
                "cityCode": combo["cityCode"],
                "unit": 3,  # 月
                "duration": 1  # 1个月
            }
            
            response = await ipipv_api._make_request("api/open/app/product/query/v2", params)
            logger.info(f"[测试] 响应: {truncate_response(response)}")
            
            result = {
                "组合名称": combo["name"],
                "产品编号": combo["productNo"],
                "代理类型": 103,
                "国家": combo["countryCode"],
                "城市": combo["cityCode"],
                "预期地区": combo["detail"],
                "查询结果": "成功" if response else "失败",
                "价格": None,
                "库存": None,
                "详细信息": None
            }
            
            if response and isinstance(response, list) and len(response) > 0:
                product = response[0]
                result.update({
                    "价格": product.get("costPrice"),
                    "库存": product.get("inventory"),
                    "详细信息": {
                        "产品名称": product.get("productName"),
                        "ISP类型": product.get("ispType"),
                        "网络类型": product.get("netType"),
                        "地区详情": product.get("detail"),
                        "供应商": product.get("supplierCode"),
                        "协议": product.get("protocol"),
                        "使用限制": product.get("useLimit"),
                        "销售限制": product.get("sellLimit")
                    }
                })
            
            results.append(result)
            logger.info(f"[测试] 结果: {json.dumps(result, ensure_ascii=False, indent=2)}")
            
        # 生成测试报告
        report = "# 静态国外家庭代理(103)产品组合测试报告\n\n"
        report += "## 测试时间\n"
        report += f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n"
        report += "## 测试环境\n"
        report += f"- API URL: {settings.IPPROXY_API_URL}\n"
        report += f"- APP KEY: {settings.IPPROXY_APP_KEY}\n\n"
        report += "## 测试结果汇总\n\n"
        
        # 添加统计信息
        success_count = len([r for r in results if r['查询结果'] == "成功"])
        report += f"- 总测试数量: {len(results)}\n"
        report += f"- 成功数量: {success_count}\n"
        report += f"- 失败数量: {len(results) - success_count}\n\n"
        
        report += "## 详细测试结果\n\n"
        for result in results:
            report += f"### {result['组合名称']}\n"
            report += f"- 产品编号: {result['产品编号']}\n"
            report += f"- 代理类型: {result['代理类型']}\n"
            report += f"- 国家/地区: {result['国家']}\n"
            report += f"- 城市: {result['城市']}\n"
            report += f"- 预期地区: {result['预期地区']}\n"
            report += f"- 查询结果: {result['查询结果']}\n"
            
            if result['查询结果'] == "成功":
                report += f"- 价格: {result['价格']}\n"
                report += f"- 库存: {result['库存']}\n"
                report += "- 详细信息:\n"
                for key, value in result['详细信息'].items():
                    report += f"  - {key}: {value}\n"
            
            report += "\n"
        
        # 保存测试报告
        with open("docs/product_combinations_test_report.md", "w", encoding="utf-8") as f:
            f.write(report)
            
        logger.info("=" * 80)
        logger.info("[测试] 测试报告已生成: docs/product_combinations_test_report.md")
        logger.info("=" * 80) 
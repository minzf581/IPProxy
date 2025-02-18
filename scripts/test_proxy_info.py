import logging
import time
import random
import json
from typing import Tuple
from datetime import datetime

def open_dynamic_instance(api_instance, username):
    """
    开通动态代理实例
    """
    try:
        # 设置请求参数
        params = {
            "appOrderNo": "TEST20240726094927",
            "params": [{
                "productNo": "out_dynamic_1",
                "proxyType": 104,
                "appUsername": "test1006",
                "flow": 300,
                "duration": 1,
                "unit": 3
            }]
        }
        
        logging.info("=" * 60)
        logging.info("开始开通动态代理实例")
        logging.info(f"使用参数: {json.dumps(params, ensure_ascii=False)}")
        
        # 发送请求
        response = api_instance.send_request("api/open/app/instance/open/v2", params)
        
        if response:
            logging.info(f"开通响应: {json.dumps(response, ensure_ascii=False)}")
        else:
            logging.error("开通实例失败: 无响应")
            
        return response
    except Exception as e:
        logging.error(f"开通实例失败: {str(e)}")
        return None

def test_proxy_info():
    """
    测试代理信息查询
    """
    logging.info("开始测试...")
    
    # 初始化API
    api_instance = init_api()
    
    # 第一步：创建代理商子账号
    logging.info("第一步：创建代理商子账号")
    create_proxy_user(api_instance)
    
    # 第二步：开通动态代理实例
    logging.info("第二步：开通动态代理实例")
    if not open_dynamic_instance(api_instance, "kgjyxxdj5cnf"):
        logging.error("开通动态代理实例失败，但继续测试资源查询")
    
    # 第三步：测试资源查询
    logging.info("\n第三步：测试资源查询")
    
    # 使用已知有效的用户名组合进行测试
    test_combinations = [
        ("egjyv6xz5p8b", "kgjyxxdj5cnf"),
        ("kgjyxxdj5cnf", "test_son_1001"),
        ("test1006", "kgjyxxdj5cnf"),
    ]
    
    for username, app_username in test_combinations:
        logging.info("=" * 60)
        logging.info("测试组合:")
        logging.info(f"username: {username}")
        logging.info(f"appUsername: {app_username}")
        query_proxy_info(api_instance, username, app_username)
        logging.info("")
    
    logging.info("测试完成!")

    # ... existing code ... 
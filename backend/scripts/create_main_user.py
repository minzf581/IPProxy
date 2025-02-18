"""
创建主账号脚本
==============

此脚本用于创建 IPIPV 平台的主账号。

使用方法：
python3 scripts/create_main_user.py
"""

import os
import sys
from pathlib import Path
import asyncio
import logging
from app.config import settings
from app.services.ipipv_base_api import IPIPVBaseAPI
from app.models.main_user import MainUser
from app.database import SessionLocal
import traceback

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.append(str(project_root))

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(name)s] %(levelname)s [%(filename)s:%(lineno)d]: %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

async def main():
    """创建主账号"""
    try:
        print("="*50)
        print("开始初始化主账号...")
        print("="*50)
        
        # 初始化数据库会话
        db = SessionLocal()
        
        # 检查主账号是否已存在
        main_user = db.query(MainUser).filter(MainUser.app_username == settings.IPPROXY_MAIN_USERNAME).first()
        if main_user:
            print(f"\n✅ 主账号已存在: {main_user.app_username}")
            print(f"✅ 主账号用户名: {main_user.username}")
            print(f"✅ 认证状态: {'已认证' if main_user.auth_type == 3 else '未认证'}")
            
            # 如果主账号未认证，进行实名认证
            if main_user.auth_type != 3:
                api = IPIPVBaseAPI()
                auth_params = {
                    "appUsername": main_user.app_username,
                    "username": main_user.username,
                    "authType": 3,  # 企业认证
                    "authName": settings.IPPROXY_MAIN_AUTH_NAME,
                    "no": settings.IPPROXY_MAIN_AUTH_NO
                }
                
                print("\n开始实名认证...")
                
                # 发送实名认证请求
                auth_response = await api._make_request(
                    "api/open/app/userAuth/v2",
                    auth_params
                )
                
                if auth_response.get("code") not in [0, 200]:
                    error_msg = auth_response.get("msg", "未知错误")
                    print(f"❌ 实名认证失败: {error_msg}")
                    print("="*50)
                    return
                
                # 更新认证状态
                auth_data = auth_response.get("data", {})
                main_user.auth_type = auth_data.get("authStatus", 3)  # 企业认证
                db.commit()
                print(f"\n✅ 实名认证成功!")
                print(f"✅ 认证状态: {'已认证' if main_user.auth_type == 3 else '未认证'}")
            
            print("="*50)
            return
            
        # 如果主账号不存在，创建新账号
        api = IPIPVBaseAPI()
        
        # 构造创建主账号请求参数
        create_params = {
            "appUsername": settings.IPPROXY_MAIN_USERNAME,
            "password": settings.IPPROXY_MAIN_PASSWORD,
            "phone": settings.IPPROXY_MAIN_PHONE,
            "email": settings.IPPROXY_MAIN_EMAIL,
            "authType": 1,  # 企业认证
            "authName": settings.IPPROXY_MAIN_AUTH_NAME,
            "no": settings.IPPROXY_MAIN_AUTH_NO,
            "status": 1,
            "limitFlow": 1048576  # 1TB
        }
        
        print("\n开始创建主账号...")
        
        # 发送创建主账号请求
        response = await api._make_request(
            "api/open/app/user/v2",
            create_params
        )
        
        if response.get("code") not in [0, 200]:
            error_msg = response.get("msg", "未知错误")
            print(f"❌ 创建主账号失败: {error_msg}")
            print("="*50)
            return
        
        # 获取响应数据
        ipipv_data = response.get("data", {})
        
        # 创建主账号记录
        main_user = MainUser(
            username=ipipv_data.get("username"),
            app_username=settings.IPPROXY_MAIN_USERNAME,
            password=settings.IPPROXY_MAIN_PASSWORD,
            phone=settings.IPPROXY_MAIN_PHONE,
            email=settings.IPPROXY_MAIN_EMAIL,
            auth_type=1,  # 未认证
            auth_name=settings.IPPROXY_MAIN_AUTH_NAME,
            auth_no=settings.IPPROXY_MAIN_AUTH_NO,
            status=1,
            balance=0
        )
        
        # 保存到数据库
        db.add(main_user)
        db.commit()
        print(f"\n✅ 主账号创建成功!")
        print(f"✅ 主账号: {main_user.app_username}")
        print(f"✅ 用户名: {main_user.username}")
        
        # 实名认证
        auth_params = {
            "appUsername": main_user.app_username,
            "username": main_user.username,
            "authType": 3,  # 企业认证
            "authName": main_user.auth_name,
            "no": main_user.auth_no
        }
        
        print("\n开始实名认证...")
        
        # 发送实名认证请求
        auth_response = await api._make_request(
            "api/open/app/userAuth/v2",
            auth_params
        )
        
        if auth_response.get("code") not in [0, 200]:
            error_msg = auth_response.get("msg", "未知错误")
            print(f"❌ 实名认证失败: {error_msg}")
            print("="*50)
            return
        
        # 更新认证状态
        auth_data = auth_response.get("data", {})
        main_user.auth_type = auth_data.get("authStatus", 3)  # 企业认证
        db.commit()
        print(f"\n✅ 实名认证成功!")
        print(f"✅ 认证状态: {'已认证' if main_user.auth_type == 3 else '未认证'}")
        
        print("="*50)
        print("主账号初始化完成!")
        print("="*50)
        
    except Exception as e:
        print(f"\n❌ 创建主账号失败: {str(e)}")
        logger.error(traceback.format_exc())
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(main()) 
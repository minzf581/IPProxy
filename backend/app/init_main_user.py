from app.database import SessionLocal
from app.models.main_user import MainUser
from app.core.config import settings

def init_main_user():
    """初始化主账户"""
    db = SessionLocal()
    try:
        # 检查是否已存在主账户
        main_user = db.query(MainUser).first()
        if main_user:
            print("主账户已存在:", main_user.app_username)
            return

        # 创建主账户
        main_user = MainUser(
            app_username=settings.IPPROXY_MAIN_USERNAME,  # 渠道商主账号
            username=settings.IPPROXY_MAIN_USERNAME,  # 平台主账号
            password=settings.IPPROXY_MAIN_PASSWORD,  # 主账号密码
            phone=settings.IPPROXY_MAIN_PHONE,  # 主账号手机号
            email=settings.IPPROXY_MAIN_EMAIL,  # 主账号邮箱
            auth_type=settings.IPPROXY_MAIN_AUTH_TYPE,  # 企业认证
            auth_name=settings.IPPROXY_MAIN_AUTH_NAME,  # 认证名称
            auth_no=settings.IPPROXY_MAIN_AUTH_NO,  # 证件号码
            status=settings.IPPROXY_MAIN_STATUS  # 正常状态
        )
        db.add(main_user)
        db.commit()
        print("主账户创建成功:", main_user.app_username)
    finally:
        db.close()

if __name__ == "__main__":
    init_main_user() 
from app.database import SessionLocal
from app.models.main_user import MainUser

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
            app_username="admin",  # 渠道商主账号
            username="admin",  # 平台主账号
            password="admin123456",  # 主账号密码
            phone="13800138000",  # 主账号手机号
            email="admin@example.com",  # 主账号邮箱
            auth_type=2,  # 个人实名
            auth_name="测试用户",  # 实名认证的真实名字
            auth_no="110101199001011234",  # 实名证件号码
            status=1  # 正常状态
        )
        db.add(main_user)
        db.commit()
        print("主账户创建成功:", main_user.app_username)
    finally:
        db.close()

if __name__ == "__main__":
    init_main_user() 
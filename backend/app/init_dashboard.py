from app.database import SessionLocal, engine
from app.models.dashboard import ProxyInfo, ResourceUsage
from datetime import datetime

def init_dashboard_data():
    db = SessionLocal()
    try:
        # 检查是否已存在代理信息
        proxy_info = db.query(ProxyInfo).first()
        if not proxy_info:
            # 创建初始代理信息
            proxy_info = ProxyInfo(
                balance=0.0,
                total_recharge=0.0,
                total_consumption=0.0,
                month_recharge=0.0,
                month_consumption=0.0,
                last_month_consumption=0.0,
                updated_at=datetime.now()
            )
            db.add(proxy_info)
            print("创建初始代理信息成功")

        # 检查是否已存在动态资源使用记录
        dynamic_resources = db.query(ResourceUsage).filter_by(resource_type="dynamic").all()
        if not dynamic_resources:
            # 创建动态资源使用记录
            dynamic_resources_data = [
                {"title": "动态资源1"},
                {"title": "动态资源2"},
                {"title": "动态资源3"}
            ]
            
            for data in dynamic_resources_data:
                dynamic_resource = ResourceUsage(
                    resource_type="dynamic",
                    title=data["title"],
                    total=0.0,
                    used=0.0,
                    today=0.0,
                    last_month=0.0,
                    percentage=0.0,
                    updated_at=datetime.now()
                )
                db.add(dynamic_resource)
            print("创建动态资源使用记录成功")

        # 检查是否已存在静态资源使用记录
        static_resources = db.query(ResourceUsage).filter_by(resource_type="static").all()
        if not static_resources:
            # 创建静态资源使用记录
            static_resources_data = [
                {"title": "静态资源1"},
                {"title": "静态资源2"},
                {"title": "静态资源3"},
                {"title": "静态资源4"},
                {"title": "静态资源5"},
                {"title": "静态资源7"}  # 注意这里是7而不是6
            ]
            
            for data in static_resources_data:
                static_resource = ResourceUsage(
                    resource_type="static",
                    title=data["title"],
                    total=0.0,
                    used=0.0,
                    today=0.0,
                    last_month=0.0,
                    available=0.0,
                    percentage=0.0,
                    updated_at=datetime.now()
                )
                db.add(static_resource)
            print("创建静态资源使用记录成功")

        db.commit()
        print("初始化仪表盘数据完成")

    except Exception as e:
        print(f"初始化仪表盘数据失败: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_dashboard_data() 
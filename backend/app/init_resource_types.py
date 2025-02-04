from app.database import SessionLocal
from app.models.resource_type import ResourceType

def init_resource_types():
    db = SessionLocal()
    try:
        # 检查是否已经存在资源类型
        if db.query(ResourceType).count() > 0:
            print("Resource types already initialized")
            return

        # 动态资源类型
        dynamic_resources = [
            {"name": "动态ip池1", "type": "dynamic", "price": 100.0},
            {"name": "动态ip池2", "type": "dynamic", "price": 200.0},
            {"name": "动态ip池3", "type": "dynamic", "price": 300.0},
        ]

        # 静态资源类型
        static_resources = [
            {"name": "纯净静态1", "type": "static", "price": 500.0},
            {"name": "纯净静态2", "type": "static", "price": 600.0},
            {"name": "纯净静态3", "type": "static", "price": 700.0},
            {"name": "纯净静态4", "type": "static", "price": 800.0},
            {"name": "纯净静态5", "type": "static", "price": 900.0},
            {"name": "纯净静态7", "type": "static", "price": 1000.0},
        ]

        # 创建所有资源类型
        for resource in dynamic_resources + static_resources:
            db.add(ResourceType(**resource))

        db.commit()
        print("Resource types initialized successfully")
    except Exception as e:
        print(f"Error initializing resource types: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_resource_types() 
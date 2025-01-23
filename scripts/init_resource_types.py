import sys
import os

# 添加backend目录到Python路径
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.database import SessionLocal, init_db
from app.models.resource_type import ResourceType
from app.models.user import User
from app.models.agent import Agent
from app.models.main_user import MainUser

def init_resource_types():
    # 确保数据库表已创建
    init_db()
    
    db = SessionLocal()
    try:
        # 检查是否已经存在资源类型
        if db.query(ResourceType).count() > 0:
            print('Resource types already initialized')
            return

        # 动态资源类型
        dynamic_resources = [
            {'name': '动态资源1', 'type': 'dynamic', 'price': 100.0},
            {'name': '动态资源2', 'type': 'dynamic', 'price': 200.0},
            {'name': '动态资源3', 'type': 'dynamic', 'price': 300.0},
        ]

        # 静态资源类型
        static_resources = [
            {'name': '静态资源1', 'type': 'static', 'price': 500.0},
            {'name': '静态资源2', 'type': 'static', 'price': 600.0},
            {'name': '静态资源3', 'type': 'static', 'price': 700.0},
            {'name': '静态资源4', 'type': 'static', 'price': 800.0},
            {'name': '静态资源5', 'type': 'static', 'price': 900.0},
            {'name': '静态资源7', 'type': 'static', 'price': 1000.0},
        ]

        # 创建所有资源类型
        for resource in dynamic_resources + static_resources:
            db.add(ResourceType(**resource))

        db.commit()
        print('Resource types initialized successfully')
    except Exception as e:
        print(f'Error initializing resource types: {e}')
        db.rollback()
    finally:
        db.close()

if __name__ == '__main__':
    init_resource_types() 
from app.database import engine
from app.models import Base

def migrate_database():
    """迁移数据库"""
    print("开始迁移数据库...")
    Base.metadata.create_all(bind=engine)
    print("数据库迁移完成")

if __name__ == "__main__":
    migrate_database() 
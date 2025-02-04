from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.user import User
from app.database import get_db, Base
from app.config import settings

# 创建数据库连接
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def update_agent_balance():
    db = SessionLocal()
    try:
        # 更新代理商余额
        agent = db.query(User).filter(User.id == 261).first()
        if agent:
            agent.balance = 10000
            db.commit()
            print(f"成功更新代理商 {agent.username} 的余额为 10000 元")
        else:
            print("未找到代理商")
    except Exception as e:
        print(f"更新失败: {str(e)}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    update_agent_balance() 
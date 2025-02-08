import os
import sys
import pytest
from pathlib import Path

# 添加项目根目录到 Python 路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# 添加 backend 目录到 Python 路径
backend_path = project_root / "backend"
sys.path.insert(0, str(backend_path))

@pytest.fixture(scope="session")
def app():
    """获取 FastAPI 应用实例"""
    from app.main import app
    return app

@pytest.fixture(scope="session")
def db():
    """获取测试数据库会话"""
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 
from sqlalchemy import create_engine, inspect, MetaData
from sqlalchemy.orm import sessionmaker
import sys
import os

# 添加项目根目录到 Python 路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import DATABASE_URL
from app.models.base import Base
from app.models.user import User
from app.models.transaction import Transaction
from app.models.dynamic_order import DynamicOrder
from app.models.static_order import StaticOrder
from app.models.main_user import MainUser
from app.models.agent_price import AgentPrice

def describe_database():
    """生成数据库的详细描述"""
    # 创建数据库连接
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()
    inspector = inspect(engine)

    print("\n=== 数据库结构描述 ===\n")

    # 获取所有表
    for table_name in inspector.get_table_names():
        print(f"\n表名: {table_name}")
        print("-" * 50)
        
        # 获取表的列信息
        columns = inspector.get_columns(table_name)
        print("\n列信息:")
        for column in columns:
            nullable = "NULL" if column['nullable'] else "NOT NULL"
            default = f"DEFAULT {column['default']}" if column['default'] else ""
            print(f"  - {column['name']}: {column['type']} {nullable} {default}")
        
        # 获取主键信息
        pk = inspector.get_pk_constraint(table_name)
        if pk['constrained_columns']:
            print(f"\n主键: {', '.join(pk['constrained_columns'])}")
        
        # 获取外键信息
        fks = inspector.get_foreign_keys(table_name)
        if fks:
            print("\n外键关系:")
            for fk in fks:
                print(f"  - {', '.join(fk['constrained_columns'])} -> {fk['referred_table']}.{', '.join(fk['referred_columns'])}")
        
        # 获取索引信息
        indexes = inspector.get_indexes(table_name)
        if indexes:
            print("\n索引:")
            for index in indexes:
                unique = "UNIQUE " if index['unique'] else ""
                print(f"  - {unique}INDEX {index['name']} ON ({', '.join(index['column_names'])})")

        # 获取表中的记录数
        try:
            model_class = {
                'user': User,
                'transaction': Transaction,
                'dynamic_order': DynamicOrder,
                'static_order': StaticOrder,
                'main_user': MainUser,
                'agent_price': AgentPrice
            }.get(table_name)
            
            if model_class:
                count = session.query(model_class).count()
                print(f"\n当前记录数: {count}")
        except Exception as e:
            print(f"\n获取记录数失败: {str(e)}")

    print("\n=== 表关系描述 ===\n")
    
    # 描述主要表之间的关系
    print("1. User 表:")
    print("   - 与 Transaction 表: 一对多关系 (一个用户可以有多个交易记录)")
    print("   - 与 DynamicOrder 表: 一对多关系 (一个用户可以有多个动态订单)")
    print("   - 与 StaticOrder 表: 一对多关系 (一个用户可以有多个静态订单)")
    print("   - 与 AgentPrice 表: 一对一关系 (一个代理商有一个价格配置)")
    
    print("\n2. Transaction 表:")
    print("   - 与 User 表: 多对一关系 (每个交易记录属于一个用户)")
    
    print("\n3. DynamicOrder 表:")
    print("   - 与 User 表: 多对一关系 (每个动态订单属于一个用户)")
    
    print("\n4. StaticOrder 表:")
    print("   - 与 User 表: 多对一关系 (每个静态订单属于一个用户)")
    
    print("\n5. AgentPrice 表:")
    print("   - 与 User 表: 一对一关系 (每个代理商价格配置属于一个代理商)")

    session.close()

if __name__ == "__main__":
    describe_database() 
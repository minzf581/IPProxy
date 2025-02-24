from sqlalchemy import create_engine, inspect
import os

# 获取数据库 URL
database_url = os.getenv('DATABASE_URL', 'postgresql://postgres:VklXzDrDMygoJNZjzzSlNLMjmqKIPaYQ@turntable.proxy.rlwy.net:12038/railway')

# 创建引擎
engine = create_engine(database_url)

# 获取检查器
inspector = inspect(engine)

# 检查表是否存在
if 'users' in inspector.get_table_names():
    print('users 表已存在')
    print('\n表结构:')
    for column in inspector.get_columns('users'):
        print(f'{column["name"]}: {column["type"]}')
else:
    print('users 表不存在') 
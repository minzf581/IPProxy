#!/bin/bash

# 重置数据库脚本
echo "开始重置数据库..."

# 停止运行中的服务器
pkill -f "uvicorn app.main:app"

# 删除数据库文件
rm -f instance/test.db

# 运行初始化脚本
python3 scripts/init_db.py

# 重启服务器
python3 -m uvicorn app.main:app --reload &

echo "数据库重置完成！"
echo "服务器已在后台重启"
echo ""
echo "默认用户:"
echo "1. 管理员"
echo "   - 用户名: admin"
echo "   - 密码: admin123"
echo "2. 代理商"
echo "   - 用户名: agent"
echo "   - 密码: agent123" 
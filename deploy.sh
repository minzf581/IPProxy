#!/bin/sh

# 确保脚本在错误时退出
set -e

echo "开始部署前端静态文件..."

# 检查 nginx 配置
echo "检查 nginx 配置..."
nginx -t

# 启动 nginx
echo "启动 nginx 服务..."
nginx -g 'daemon off;' 
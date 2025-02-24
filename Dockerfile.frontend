# 构建阶段
FROM node:16-alpine as builder

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci --production=false

# 复制源代码和配置文件
COPY . .

# 确保.env.production文件存在
RUN if [ ! -f .env.production ]; then \
    echo "Error: .env.production file not found"; \
    exit 1; \
    fi

# 构建项目
RUN npm run build

# 验证构建输出
RUN if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then \
    echo "Error: Build failed - dist/index.html not found"; \
    exit 1; \
    fi

# 运行阶段
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 验证 nginx 配置
RUN nginx -t

# 创建健康检查脚本
RUN echo '#!/bin/sh\n\
if [ ! -f /usr/share/nginx/html/index.html ]; then\n\
    echo "Error: index.html not found"\n\
    exit 1\n\
fi\n\
curl -f http://localhost/ || exit 1' > /healthcheck.sh && \
    chmod +x /healthcheck.sh

# 设置健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD /healthcheck.sh

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"] 
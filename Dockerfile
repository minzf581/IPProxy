# 构建阶段
FROM node:18 as builder

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV VITE_API_URL=https://ipproxy-production.up.railway.app:8080
ENV PATH /app/node_modules/.bin:$PATH

# 安装构建依赖
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 清理 npm 缓存并安装依赖
RUN npm cache clean --force && \
    npm install --legacy-peer-deps --force && \
    npm install -D @vitejs/plugin-react@4.2.1 vite@4.5.2 --force

# 验证关键依赖安装
RUN npm list @vitejs/plugin-react@4.2.1 || true && \
    npm list vite@4.5.2 || true && \
    npm list react || true

# 复制源代码和配置文件
COPY . ./

# 确保.env.production文件存在
RUN touch .env.production

# 显示环境信息
RUN node -v && \
    npm -v

# 构建项目
RUN VITE_API_URL=$VITE_API_URL npm run build || \
    (echo "Build failed" && ls -la && cat package.json && cat vite.config.ts && exit 1)

# 验证构建输出
RUN if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then \
    echo "Error: Build failed - dist/index.html not found"; \
    ls -la; \
    exit 1; \
    fi

# 运行阶段
FROM nginx:alpine

# 安装 curl 用于健康检查
RUN apk add --no-cache curl

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
# 构建阶段
FROM node:18 as builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install --legacy-peer-deps

# 复制源代码
COPY . .

# 创建 .env.production 文件
RUN echo "VITE_API_URL=https://ipproxy-production.up.railway.app:8080" > .env.production && \
    echo "VITE_API_PROXY_URL=https://ipproxy-production.up.railway.app:8080" >> .env.production && \
    echo "VITE_APP_ENV=production" >> .env.production && \
    echo "NODE_ENV=production" >> .env.production

# 显示环境信息
RUN echo "Node version: $(node -v)" && \
    echo "NPM version: $(npm -v)" && \
    echo "Environment variables:" && \
    cat .env.production

# 构建项目
RUN NODE_ENV=production \
    VITE_API_URL=https://ipproxy-production.up.railway.app:8080 \
    VITE_API_PROXY_URL=https://ipproxy-production.up.railway.app:8080 \
    VITE_APP_ENV=production \
    npm run build --force || \
    (echo "Build failed" && \
     echo "TypeScript version:" && \
     npx tsc --version && \
     echo "Environment:" && \
     env | grep VITE_ && \
     echo "Directory contents:" && \
     ls -la && \
     echo "Package.json:" && \
     cat package.json && \
     echo "Vite Config:" && \
     cat vite.config.ts && \
     echo "TypeScript errors:" && \
     npx tsc --noEmit && \
     exit 1)

# 生产环境使用 nginx
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 复制部署脚本
COPY deploy.sh /deploy.sh
RUN chmod +x /deploy.sh

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

# 使用部署脚本启动
CMD ["/deploy.sh"]
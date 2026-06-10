# =============================================================
# 阶段 1: Node 构建前端（国内源 ENV 版，无权限问题）
# =============================================================
FROM node:20-alpine AS build
WORKDIR /app

# 用环境变量设置国内源（不需要写 .npmrc，不涉及权限）
ENV NPM_CONFIG_REGISTRY=https://registry.npmmirror.com
ENV NPM_CONFIG_DISTURL=https://npmmirror.com/dist
ENV NPM_CONFIG_SASS_BINARY_SITE=https://npmmirror.com/mirrors/node-sass

# 复制依赖文件
COPY package.json package-lock.json .npmrc ./
RUN npm ci --silent --no-audit --no-fund

# 复制源码并构建
COPY . .
RUN npm run build

# =============================================================
# 阶段 2: Nginx 服务
# =============================================================
FROM nginx:1.25-alpine

# alpine 换清华源
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1
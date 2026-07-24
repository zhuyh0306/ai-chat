# ============================================
# Stage 1: 依赖安装 & 构建
# ============================================
# BASE_IMAGE 默认用 docker.io，CI 中覆盖为 ACR 缓存镜像
ARG BASE_IMAGE=node:22-alpine
FROM ${BASE_IMAGE} AS builder

WORKDIR /app

# pnpm 安装
RUN corepack enable && corepack prepare pnpm@latest --activate

# 先复制依赖文件，利用 Docker 缓存层
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

RUN pnpm install --frozen-lockfile

# 复制源码并构建
COPY . .

ARG MASTRA_API_URL
ARG MASTRA_AGENT_ID

ENV MASTRA_API_URL=${MASTRA_API_URL}
ENV MASTRA_AGENT_ID=${MASTRA_AGENT_ID}

RUN pnpm run build

# ============================================
# Stage 2: 生产运行时（最小镜像）
# ============================================
FROM ${BASE_IMAGE} AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 复制 standalone 输出
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000

CMD ["node", "server.js"]

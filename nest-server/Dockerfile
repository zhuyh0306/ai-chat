# ============================================
# nest-server 生产镜像（独立 NestJS 工程）
# ============================================
# ---- 构建阶段 ----
FROM node:22-alpine AS builder
WORKDIR /app

# 启用 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json ./
# 注意：nest-server 当前无 lockfile，使用普通 install；
# 若后续生成了 pnpm-lock.yaml，可改为 `pnpm install --frozen-lockfile`
RUN pnpm install

COPY . .
RUN pnpm run build

# ---- 运行阶段 ----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# 复制构建产物与依赖
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/nest-cli.json ./nest-cli.json

USER nestjs

EXPOSE 3001
ENV PORT=3001

# 与 package.json 的 start:prod 一致（node dist/main）
CMD ["node", "dist/main"]

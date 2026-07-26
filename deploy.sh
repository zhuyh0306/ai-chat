#!/usr/bin/env bash
set -e

# ============================================================
# 阿里云 ECS 一键部署（nginx 单端口入口）
#   - nginx   :80  ->  /api 转发 nest-server(:3001)，其余转发 my-app(:3000)
#   - my-app  : Next.js 前端
#   - nest-server: NestJS 后端
#   - postgres: PostgreSQL（docker 镜像）
#
# 在 ECS 上执行（仓库已 clone 到 ECS）。
#
# 用法示例：
#   export ACR_REGISTRY=registry.cn-shanghai.aliyuncs.com
#   export ACR_NAMESPACE=mastra_ai
#   export ACR_USERNAME=你的阿里云账号
#   export VERSION=$(git rev-parse --short HEAD)
#
#   # —— 业务相关变量，按需覆盖 ——
#   export MASTRA_API_URL=http://<ECS公网IP>:4111   # Mastra 地址（若独立部署）
#   export MASTRA_AGENT_ID=assistant-agent
#   export DB_HOST=postgres          # 用 RDS 则填 RDS 内网地址
#   export DB_PASSWORD=强密码
#   export JWT_SECRET=强随机值
#
#   ./deploy.sh
#
# 说明：前端通过 nginx 同域访问后端，NEXT_PUBLIC_API_BASE 默认 /api，
#       无需再在构建期绑定 ECS IP。
# ============================================================

ACR_REGISTRY="${ACR_REGISTRY:-registry.cn-shanghai.aliyuncs.com}"
ACR_NAMESPACE="${ACR_NAMESPACE:-mastra_ai}"
ACR_USERNAME="${ACR_USERNAME:-}"
VERSION="${VERSION:-latest}"

# 前端 / 后端构建与运行参数（可通过环境变量覆盖）
NEXT_PUBLIC_API_BASE="${NEXT_PUBLIC_API_BASE:-/api}"
MASTRA_API_URL="${MASTRA_API_URL:-http://8.133.180.60:4111}"
MASTRA_AGENT_ID="${MASTRA_AGENT_ID:-assistant-agent}"
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
DB_USERNAME="${DB_USERNAME:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-123456}"
DB_DATABASE="${DB_DATABASE:-mastra_app}"
JWT_SECRET="${JWT_SECRET:-change-me-strong-secret}"

# 导出给 docker-compose（build args + environment 都会读取）
export ACR_REGISTRY ACR_NAMESPACE VERSION \
       NEXT_PUBLIC_API_BASE MASTRA_API_URL MASTRA_AGENT_ID \
       DB_HOST DB_PORT DB_USERNAME DB_PASSWORD DB_DATABASE JWT_SECRET

echo "=========================================="
echo "  部署 my-app + nest-server (nginx 入口)"
echo "  镜像版本: ${VERSION}"
echo "  前端 API_BASE: ${NEXT_PUBLIC_API_BASE}"
echo "  数据库主机: ${DB_HOST}"
echo "=========================================="

if [ -z "$ACR_USERNAME" ]; then
  echo "❌ 请设置 ACR_USERNAME 环境变量"
  echo "   export ACR_USERNAME=你的阿里云账号"
  exit 1
fi

# 1. 登录 ACR
echo ""
echo "🔐 登录 ACR: ${ACR_REGISTRY}"
docker login --username="${ACR_USERNAME}" "${ACR_REGISTRY}"

# 2. 构建前端 + 后端镜像（docker-compose 按各服务 Dockerfile 构建）
echo ""
echo "🔨 构建镜像 (my-app + nest-server)..."
docker-compose build

# 3. 推送镜像到 ACR
echo ""
echo "⬆️  推送镜像到 ACR..."
docker-compose push

# 4. 启动全部服务（含 nginx 反向代理）
echo ""
echo "🚀 启动服务 (nginx / my-app / nest-server / postgres)..."
docker-compose up -d

# 5. 等待并检查状态
echo ""
echo "⏳ 等待应用启动..."
sleep 10

docker ps --filter "name=nginx" --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
docker ps --filter "name=my-app" --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
docker ps --filter "name=nest-server" --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
docker ps --filter "name=postgres" --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'

echo ""
echo "✅ 部署完成"
echo "   访问地址: http://<ECS公网IP>/   (nginx 统一入口)"
echo "   后端 API: http://<ECS公网IP>/api"
echo "   聊天/Mastra 代理: http://<ECS公网IP>/mastra/*"
echo ""
echo "💡 初始化管理员账号（数据库就绪后执行一次）："
echo "   cd nest-server && DB_HOST=localhost DB_PORT=5432 DB_PASSWORD=${DB_PASSWORD} \\"
echo "     INIT_USERNAME=admin INIT_PASSWORD=admin123 \\"
echo "     node -r ts-node/register scripts/init-user.ts"
echo "   或把 postgres 端口临时暴露到 0.0.0.0 后从本地执行。"

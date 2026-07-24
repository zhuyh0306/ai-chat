#!/usr/bin/env bash
set -e

# ============================================================
# 阿里云 ECS 上一键部署 my-app
# 用法：
#   export ACR_REGISTRY=registry.cn-shanghai.aliyuncs.com
#   export ACR_NAMESPACE=mastra_ai
#   export ACR_USERNAME=你的阿里云账号
#   export VERSION=<git commit sha 或 latest>
#   export MASTRA_API_URL=https://...
#   export MASTRA_AGENT_ID=assistant-agent
#   ./deploy.sh
# ============================================================

ACR_REGISTRY="${ACR_REGISTRY:-registry.cn-shanghai.aliyuncs.com}"
ACR_NAMESPACE="${ACR_NAMESPACE:-mastra_ai}"
ACR_USERNAME="${ACR_USERNAME:-}"
VERSION="${VERSION:-latest}"
MASTRA_API_URL="${MASTRA_API_URL:-http://8.133.180.60:4111}"
MASTRA_AGENT_ID="${MASTRA_AGENT_ID:-assistant-agent}"

IMAGE="${ACR_REGISTRY}/${ACR_NAMESPACE}/my-app:${VERSION}"

echo "=========================================="
echo "  部署镜像: ${IMAGE}"
echo "=========================================="

if [ -z "$ACR_USERNAME" ]; then
  echo "❌ 请设置 ACR_USERNAME 环境变量"
  echo "   export ACR_USERNAME=你的阿里云账号"
  exit 1
fi

# 1. 登录 ACR（会提示输入密码）
echo ""
echo "🔐 登录 ACR: ${ACR_REGISTRY}"
docker login --username="${ACR_USERNAME}" "${ACR_REGISTRY}"

# 2. 拉取镜像
echo ""
echo "⬇️  拉取镜像: ${IMAGE}"
docker pull "${IMAGE}"

# 3. 启动容器
echo ""
echo "🚀 启动容器..."
export IMAGE
export MASTRA_API_URL
export MASTRA_AGENT_ID
docker-compose pull
docker-compose up -d

# 4. 等待并检查状态
echo ""
echo "⏳ 等待应用启动..."
sleep 5

if docker ps --filter "name=my-app" --format '{{.Status}}' | grep -q "Up"; then
  echo ""
  echo "✅ 容器已启动"
  echo ""
  echo "📋 容器状态:"
  docker ps --filter "name=my-app"
  echo ""
  echo "📜 最近日志:"
  docker logs --tail 20 my-app
  echo ""
  echo "🔍 实时日志: docker logs -f my-app"
else
  echo ""
  echo "❌ 容器启动失败，查看日志："
  docker logs --tail 50 my-app
  exit 1
fi

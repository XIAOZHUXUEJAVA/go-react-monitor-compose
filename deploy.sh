#!/bin/bash

# Docker Compose 部署脚本
# 用于快速部署监控系统

set -e

echo "🚀 开始部署监控系统..."

# 检查 Docker 和 Docker Compose 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p nginx/ssl

# 检查环境配置文件
if [ ! -f .env ]; then
    echo "⚠️  .env 文件不存在，使用默认配置"
fi

# 构建和启动服务
echo "🏗️  构建和启动服务..."
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 10

# 检查服务状态
echo "🔍 检查服务状态..."
docker-compose ps

# 检查健康状态
echo "🏥 检查服务健康状态..."
for service in postgres monitor-server monitor-web; do
    echo "检查 $service..."
    timeout=60
    while [ $timeout -gt 0 ]; do
        if docker-compose ps $service | grep -q "Up.*healthy\|Up.*running"; then
            echo "✅ $service 服务正常"
            break
        fi
        sleep 2
        timeout=$((timeout - 2))
    done
    
    if [ $timeout -le 0 ]; then
        echo "❌ $service 服务启动超时或异常"
        docker-compose logs $service
    fi
done

echo ""
echo "🎉 部署完成！"
echo ""
echo "📋 服务访问地址："
echo "   前端应用:  http://localhost (通过 Nginx)"
echo "   前端应用:  http://localhost:3000 (直接访问)"
echo "   后端API:   http://localhost:9000"
echo "   数据库:    localhost:5432"
echo ""
echo "🔧 管理命令："
echo "   查看日志:  docker-compose logs -f [服务名]"
echo "   重启服务:  docker-compose restart [服务名]"
echo "   停止服务:  docker-compose down"
echo "   查看状态:  docker-compose ps"
echo ""
echo "📊 健康检查："
echo "   后端健康:  curl http://localhost:9000/health"
echo "   前端健康:  curl http://localhost:3000"
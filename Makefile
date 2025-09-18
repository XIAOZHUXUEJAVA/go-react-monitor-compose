# Docker Compose 管理 Makefile

.PHONY: help build up down logs restart clean dev-up dev-down prod-up prod-down

# 默认目标
help:
	@echo "可用的命令："
	@echo "  make build      - 构建所有镜像"
	@echo "  make up         - 启动生产环境"
	@echo "  make down       - 停止生产环境"
	@echo "  make logs       - 查看生产环境日志"
	@echo "  make restart    - 重启生产环境"
	@echo "  make clean      - 清理资源"
	@echo ""
	@echo "  make dev-up     - 启动开发环境"
	@echo "  make dev-down   - 停止开发环境"
	@echo "  make dev-logs   - 查看开发环境日志"
	@echo ""
	@echo "  make prod-up    - 启动生产环境（完整版本）"
	@echo "  make prod-down  - 停止生产环境（完整版本）"

# 构建所有镜像
build:
	@echo "🏗️ 构建所有镜像..."
	docker-compose build --no-cache

# 生产环境管理
up:
	@echo "🚀 启动生产环境..."
	docker-compose up -d

down:
	@echo "🛑 停止生产环境..."
	docker-compose down

logs:
	@echo "📋 查看生产环境日志..."
	docker-compose logs -f

restart:
	@echo "🔄 重启生产环境..."
	docker-compose restart

# 开发环境管理
dev-up:
	@echo "🚀 启动开发环境..."
	docker-compose -f docker-compose.dev.yml up -d

dev-down:
	@echo "🛑 停止开发环境..."
	docker-compose -f docker-compose.dev.yml down

dev-logs:
	@echo "📋 查看开发环境日志..."
	docker-compose -f docker-compose.dev.yml logs -f

dev-restart:
	@echo "🔄 重启开发环境..."
	docker-compose -f docker-compose.dev.yml restart

# 生产环境完整版本（包含 Nginx）
prod-up:
	@echo "🚀 启动生产环境（完整版本）..."
	@./deploy.sh

prod-down:
	@echo "🛑 停止生产环境（完整版本）..."
	docker-compose down --remove-orphans

# 清理资源
clean:
	@echo "🧹 清理 Docker 资源..."
	docker-compose down --volumes --remove-orphans
	docker-compose -f docker-compose.dev.yml down --volumes --remove-orphans
	docker system prune -f

# 数据库管理
db-backup:
	@echo "💾 备份数据库..."
	docker-compose exec postgres pg_dump -U xiaozhu monitordb > backup_$(shell date +%Y%m%d_%H%M%S).sql

db-restore:
	@echo "📥 恢复数据库..."
	@if [ -z "$(FILE)" ]; then echo "请指定备份文件: make db-restore FILE=backup.sql"; exit 1; fi
	docker-compose exec -T postgres psql -U xiaozhu monitordb < $(FILE)

# 健康检查
health:
	@echo "🏥 检查服务健康状态..."
	@echo "检查后端服务..."
	@curl -s http://localhost:9000/health || echo "❌ 后端服务异常"
	@echo "检查前端服务..."
	@curl -s http://localhost:3000 > /dev/null || echo "❌ 前端服务异常"
	@echo "检查数据库..."
	@docker-compose exec postgres pg_isready -U xiaozhu || echo "❌ 数据库异常"

# 查看状态
status:
	@echo "📊 服务状态："
	docker-compose ps
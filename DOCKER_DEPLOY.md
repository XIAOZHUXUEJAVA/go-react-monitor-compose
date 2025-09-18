# Docker Compose 部署指南

本文档介绍如何使用 Docker Compose 部署完整的监控系统，包括前端、后端和数据库。

## 🏗️ 架构概览

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   Nginx (80)    │────│ Monitor Web     │────│ Monitor Server  │
│   反向代理        │    │ (Next.js:3000) │    │ (Go API:9000)   │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                               ┌─────────────────┐
                                               │                 │
                                               │ PostgreSQL      │
                                               │ (数据库:5432)    │
                                               │                 │
                                               └─────────────────┘
```

## 📦 服务组件

### 1. 数据库服务 (postgres)
- **镜像**: `postgres:15-alpine`
- **端口**: `5432`
- **存储**: 持久化数据卷
- **配置**: 自动初始化 schema 和权限

### 2. 后端服务 (monitor-server)
- **镜像**: 自构建 Go 应用
- **端口**: `9000`
- **功能**: 系统监控 API、告警管理
- **依赖**: PostgreSQL 数据库

### 3. 前端服务 (monitor-web)
- **镜像**: 自构建 Next.js 应用
- **端口**: `3000`
- **功能**: 监控仪表板界面
- **依赖**: 后端 API 服务

### 4. 反向代理 (nginx)
- **镜像**: `nginx:alpine`
- **端口**: `80` (HTTP)
- **功能**: 统一入口、负载均衡、静态文件缓存
- **可选**: HTTPS 支持

## 🚀 快速部署

### 前置要求

- Docker 20.0+ 
- Docker Compose 2.0+
- 可用的 80、3000、9000、5432 端口

### 一键部署

```bash
# 执行部署脚本
./deploy.sh
```

### 手动部署

```bash
# 1. 启动所有服务
docker-compose up -d

# 2. 查看服务状态
docker-compose ps

# 3. 查看日志
docker-compose logs -f
```

### 服务访问

部署完成后，可以通过以下地址访问：

- **前端界面**: http://localhost (推荐，通过 Nginx)
- **前端界面**: http://localhost:3000 (直接访问)
- **后端API**: http://localhost:9000
- **健康检查**: http://localhost:9000/health

## ⚙️ 配置说明

### 环境变量配置

主要配置项在 `.env` 文件中：

```bash
# 数据库配置
POSTGRES_DB=monitordb
POSTGRES_USER=xiaozhu
POSTGRES_PASSWORD=12345679

# 后端服务配置
APP_ENVIRONMENT=production
LOG_LEVEL=info
SERVER_HOST=0.0.0.0
SERVER_PORT=9000

# 前端配置
NODE_ENV=production
PORT=3000
```

### 自定义配置

1. **修改数据库密码**:
   ```bash
   # 编辑 .env 文件
   vim .env
   
   # 重新部署
   docker-compose down
   docker-compose up -d
   ```

2. **修改端口映射**:
   ```yaml
   # 编辑 docker-compose.yml
   services:
     nginx:
       ports:
         - "8080:80"  # 改为 8080 端口
   ```

3. **启用 HTTPS**:
   ```bash
   # 将 SSL 证书放置到 nginx/ssl/ 目录
   cp your-cert.pem nginx/ssl/
   cp your-key.key nginx/ssl/
   
   # 修改 nginx 配置添加 443 端口
   ```

## 🔧 管理命令

### 基本操作

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 重启指定服务
docker-compose restart monitor-server

# 查看服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f monitor-server
```

### 数据管理

```bash
# 备份数据库
docker-compose exec postgres pg_dump -U xiaozhu monitordb > backup.sql

# 恢复数据库
docker-compose exec -T postgres psql -U xiaozhu monitordb < backup.sql

# 清理数据卷（谨慎使用）
docker-compose down -v
```

### 镜像管理

```bash
# 重新构建镜像
docker-compose build --no-cache

# 拉取最新镜像
docker-compose pull

# 清理未使用的镜像
docker system prune -f
```

## 📊 监控和诊断

### 健康检查

```bash
# 检查后端服务
curl http://localhost:9000/health

# 检查前端服务
curl http://localhost:3000

# 检查数据库连接
docker-compose exec postgres pg_isready -U xiaozhu
```

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs

# 实时查看特定服务日志
docker-compose logs -f monitor-server

# 查看错误日志
docker-compose logs | grep -i error
```

### 性能监控

```bash
# 查看容器资源使用
docker stats

# 查看详细信息
docker-compose exec monitor-server top
```

## 🔐 安全配置

### 生产环境建议

1. **更改默认密码**:
   ```bash
   # 修改数据库密码
   POSTGRES_PASSWORD=your-strong-password
   ```

2. **启用 HTTPS**:
   - 获取 SSL 证书
   - 配置 Nginx HTTPS
   - 强制 HTTPS 重定向

3. **网络安全**:
   ```yaml
   # 限制数据库访问
   postgres:
     ports: []  # 移除端口映射，仅内部访问
   ```

4. **日志管理**:
   ```bash
   # 配置日志轮转
   LOG_LEVEL=warn  # 生产环境减少日志级别
   ```

## 🚨 故障排除

### 常见问题

1. **端口冲突**:
   ```bash
   # 检查端口占用
   netstat -tulpn | grep :80
   
   # 修改端口映射
   vim docker-compose.yml
   ```

2. **服务无法启动**:
   ```bash
   # 查看详细错误
   docker-compose logs service-name
   
   # 检查配置文件
   docker-compose config
   ```

3. **数据库连接失败**:
   ```bash
   # 检查数据库状态
   docker-compose exec postgres pg_isready
   
   # 查看数据库日志
   docker-compose logs postgres
   ```

4. **前端无法访问后端**:
   ```bash
   # 检查网络连通性
   docker-compose exec monitor-web curl http://monitor-server:9000/health
   
   # 检查 DNS 解析
   docker-compose exec monitor-web nslookup monitor-server
   ```

### 调试技巧

```bash
# 进入容器调试
docker-compose exec monitor-server sh

# 查看网络配置
docker network ls
docker network inspect new-go-web-monitor_monitor-network

# 检查卷挂载
docker volume ls
docker volume inspect new-go-web-monitor_postgres_data
```

## 📝 更新升级

### 代码更新

```bash
# 拉取最新代码
git pull origin main

# 重新构建并部署
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 滚动更新

```bash
# 逐个更新服务，减少停机时间
docker-compose up -d --no-deps monitor-server
docker-compose up -d --no-deps monitor-web
```

## 📋 维护检查清单

### 日常维护

- [ ] 检查服务健康状态
- [ ] 查看错误日志
- [ ] 监控资源使用情况
- [ ] 备份重要数据

### 定期维护

- [ ] 更新 Docker 镜像
- [ ] 清理未使用的镜像和容器
- [ ] 检查安全更新
- [ ] 性能优化调整

### 应急预案

- [ ] 数据库备份策略
- [ ] 服务恢复流程
- [ ] 监控告警配置
- [ ] 故障联系人信息
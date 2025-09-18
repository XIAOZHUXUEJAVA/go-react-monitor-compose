# 监控服务器 (Monitor Server)

基于 Go 语言开发的系统监控服务器，提供系统资源监控和告警管理功能。

## 项目特性

### 🖥️ 系统监控
- **CPU 监控**: CPU 使用率、频率、核心信息
- **内存监控**: RAM 和 swap 使用统计
- **磁盘监控**: 多分区存储使用情况
- **网络监控**: 网络接口统计和流量数据
- **系统信息**: 操作系统详情、运行时间和负载平均值
- **进程监控**: 运行进程及其资源使用情况

### 🚨 告警系统
- **告警规则管理**: 支持多种指标类型和阈值配置
- **告警级别管理**: info、warning、critical 三级告警
- **告警历史记录**: 完整的告警生命周期跟踪
- **告警状态管理**: 支持手动确认和解决告警
- **通知模型**: 已预留邮件、webhook、SMS通知接口（待实现）

### 🛠️ 系统管理
- **配置管理**: 动态监控配置和系统参数调整
- **数据库支持**: PostgreSQL 数据存储
- **RESTful API**: 完整的 HTTP API 接口
- **CORS 支持**: 跨域请求处理

## 项目架构

本项目遵循 Go 语言最佳实践，采用清洁架构模式：

```
monitor-server/
├── cmd/                 # 应用程序入口
│   ├── server/         # 主服务器启动程序
│   ├── setup-db/       # 数据库初始化工具
│   ├── migrate-*/      # 数据库迁移工具
│   └── test-*/         # 测试工具
├── internal/           # 私有应用程序代码
│   ├── api/           # HTTP 路由和 API 设置
│   ├── config/        # 配置管理
│   ├── database/      # 数据库连接和迁移
│   ├── handler/       # HTTP 请求处理器
│   ├── middleware/    # HTTP 中间件
│   ├── model/         # 数据模型
│   ├── service/       # 业务逻辑服务
│   └── repository/    # 数据访问层
├── pkg/               # 公共包
│   ├── logger/        # 日志工具
│   └── response/      # HTTP 响应工具
├── configs/           # 配置文件
└── Dockerfile         # Docker 构建文件
```

## 快速开始

### 环境要求

- Go 1.21 或更高版本
- PostgreSQL 数据库
- Make 工具（可选，用于使用 Makefile 命令）

### 安装步骤

1. 克隆代码仓库：
```bash
git clone <repository-url>
cd monitor-server
```

2. 安装依赖：
```bash
make deps
# 或
go mod tidy
```

3. 配置数据库：
   - 编辑 `configs/config.yaml` 文件
   - 设置 PostgreSQL 连接参数

4. 初始化数据库：
```bash
make setup-db
```

5. 启动服务器：
```bash
make dev
# 或
go run cmd/server/main.go
```

服务器将在 `http://localhost:9000` 启动。

### 配置说明

配置可通过以下方式设置：
- YAML 配置文件：`configs/config.yaml`
- 环境变量（使用 `_` 分隔符，例如：`SERVER_PORT=9000`）

主要配置项：
- **服务器配置**: 端口、主机地址
- **数据库配置**: PostgreSQL 连接参数
- **日志配置**: 日志级别和格式
- **CORS 配置**: 跨域请求设置

## API 接口文档

### 系统监控接口

#### v1 API (推荐)
- `GET /api/v1/cpu` - CPU 监控数据
- `GET /api/v1/memory` - 内存使用数据
- `GET /api/v1/disk` - 磁盘使用数据
- `GET /api/v1/network` - 网络统计数据
- `GET /api/v1/system` - 系统信息
- `GET /api/v1/processes` - 进程列表（支持 `?limit=10&sort=cpu`）

#### 告警管理接口
- `GET /api/v1/alert-rules` - 获取告警规则
- `PUT /api/v1/alert-rules/{metric_type}/{severity}/threshold` - 更新告警阈值
- `GET /api/v1/alerts` - 获取告警列表
- `GET /api/v1/alerts/{id}` - 获取告警详情
- `POST /api/v1/alerts/{id}/acknowledge` - 确认告警
- `POST /api/v1/alerts/{id}/resolve` - 解决告警
- `GET /api/v1/alerts/{id}/history` - 获取告警历史
- `GET /api/v1/alerts/statistics` - 获取告警统计

#### 配置管理接口
- `GET /api/v1/monitoring-configs` - 获取监控配置
- `GET /api/v1/monitoring-configs/{key}` - 获取指定配置
- `PUT /api/v1/monitoring-configs/{key}` - 更新配置
- `GET /api/v1/monitoring-configs/category/{category}` - 按类别获取配置

#### 系统接口
- `GET /health` - 健康检查
- `GET /api/v1/system-events` - 系统事件

### 开发命令

```bash
make dev                    # 开发模式运行
make build                  # 构建二进制文件
make build-linux           # 构建 Linux 版本
make test                   # 运行测试
make test-coverage         # 运行测试并生成覆盖率报告
make fmt                    # 格式化代码
make lint                   # 运行代码检查
make clean                  # 清理构建文件
make setup-db              # 初始化数据库
make migrate-remove-hosts  # 数据库迁移工具
```

## 数据模型

### 核心数据模型

- **SystemMetrics**: 系统指标数据
- **SystemInfoDB**: 系统信息
- **AlertRule**: 告警规则配置
- **Alert**: 告警记录
- **MonitoringConfig**: 监控配置

### 数据库表结构

所有表都包含标准的 `BaseModel` 字段（ID、创建时间、更新时间、删除时间）。

## 技术栈

### 核心依赖
- **Gin**: HTTP Web 框架
- **GORM**: ORM 数据库工具
- **Viper**: 配置管理
- **Zap**: 结构化日志
- **gopsutil**: 系统和进程监控工具

### 数据库
- **PostgreSQL**: 主数据库
- **自动迁移**: 支持数据库结构自动迁移

### 特性支持
- **优雅关闭**: 支持信号处理和优雅关闭
- **中间件**: 日志记录、CORS、错误恢复
- **环境配置**: 支持多种配置方式
- **数据持久化**: PostgreSQL 数据存储和历史记录
- **告警检测**: 后台自动告警检测

## 监控指标

### 系统级指标
- CPU 使用率和核心数
- 内存使用量和总量
- 磁盘使用量和总量
- 网络发送和接收字节数
- 系统负载和运行时间

### 告警配置
- 支持多种运算符：`>`, `<`, `>=`, `<=`, `==`
- 可配置持续时间阈值
- 三级告警严重程度：info、warning、critical
- 支持启用/禁用告警规则

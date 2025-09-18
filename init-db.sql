-- 数据库初始化脚本
-- 创建 monitor schema
CREATE SCHEMA IF NOT EXISTS monitor;

-- 设置默认 schema
SET search_path TO monitor, public;

-- 创建扩展（如果需要）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 设置时区
SET timezone = 'Asia/Shanghai';

-- 创建用户权限（如果需要额外权限）
GRANT ALL PRIVILEGES ON SCHEMA monitor TO xiaozhu;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA monitor TO xiaozhu;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA monitor TO xiaozhu;

-- 设置默认权限
ALTER DEFAULT PRIVILEGES IN SCHEMA monitor GRANT ALL ON TABLES TO xiaozhu;
ALTER DEFAULT PRIVILEGES IN SCHEMA monitor GRANT ALL ON SEQUENCES TO xiaozhu;
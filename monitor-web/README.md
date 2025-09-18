# 监控系统前端 (Monitor Web)

基于 Next.js 开发的系统监控前端应用，为系统监控数据提供可视化界面。

## 项目特点

- **🖥️ 监控仪表板**: 实时显示 CPU、内存、磁盘、网络等系统指标
- **📊 数据可视化**: 使用 Recharts 展示监控数据图表
- **🚨 告警管理**: 告警规则配置、告警列表查看和状态管理
- **⚙️ 系统配置**: 监控参数和阈值配置界面
- **📱 响应式设计**: 支持桌面端和移动端访问
- **🎨 现代界面**: 基于 Tailwind CSS 和 Radix UI 的界面设计

## 技术栈

### 核心框架
- **Next.js 15**: React 全栈框架，支持 App Router
- **React 19**: 用户界面库
- **TypeScript**: 类型安全的 JavaScript
- **Tailwind CSS**: 实用优先的 CSS 框架

### UI 组件
- **Shadcn UI**: 组件库
- **Lucide React**: 图标库
- **Recharts**: React 图表库

### 状态管理
- **Zustand**: 轻量级状态管理库

### 开发工具
- **Turbopack**: 快速构建工具
- **ESLint**: 代码检查工具
- **PostCSS**: CSS 处理工具

## 项目结构

```
src/
├── app/                    # Next.js App Router 页面
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局组件
│   └── page.tsx          # 首页
├── components/            # React 组件
│   ├── layout/           # 布局组件
│   ├── monitors/         # 监控相关组件
│   ├── pages/            # 页面级组件
│   └── ui/               # 基础 UI 组件
├── hooks/                # 自定义 React Hooks
├── lib/                  # 工具函数和 API 客户端
├── store/                # Zustand 状态管理
└── types/                # TypeScript 类型定义
```

## 快速开始

### 环境要求

- Node.js 18.0 或更高版本
- npm、yarn、pnpm 或 bun 包管理器

### 本地开发

1. **安装依赖**:
   ```bash
   npm install
   # 或
   yarn install
   # 或
   pnpm install
   ```

2. **启动开发服务器**:
   ```bash
   npm run dev
   # 或
   yarn dev
   # 或
   pnpm dev
   ```

3. **访问应用**:
   打开浏览器访问 [http://localhost:3000](http://localhost:3000)

### 构建部署

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

### Docker 部署

```bash
# 构建 Docker 镜像
docker build -t monitor-web .

# 运行容器
docker run -p 3000:3000 monitor-web
```

## 功能模块

### 📊 监控仪表板
- **概览页面**: 系统整体状态和关键指标
- **CPU 监控**: CPU 使用率、负载和历史趋势
- **内存监控**: 内存使用情况和 Swap 状态
- **磁盘监控**: 磁盘空间使用和 I/O 统计
- **网络监控**: 网络接口流量和连接状态
- **系统信息**: 操作系统详情和运行时间

### 🚨 告警管理
- **告警列表**: 查看当前告警状态
- **告警历史**: 历史告警记录和统计
- **告警规则**: 配置告警阈值和规则
- **告警操作**: 确认和解决告警

### ⚙️ 系统配置
- **监控配置**: 数据刷新间隔等参数设置
- **阈值配置**: 告警阈值动态调整
- **显示设置**: 界面主题和显示选项

## 开发指南

### 添加新页面

1. 在 `src/components/pages/` 创建页面组件
2. 在 `src/components/layout/dashboard-layout.tsx` 中添加导航
3. 更新相关的状态管理和 API 调用

### 自定义组件

项目使用 Radix UI 作为基础，你可以:
1. 在 `src/components/ui/` 中创建可复用组件
2. 使用 Tailwind CSS 进行样式定制
3. 遵循现有的设计系统规范

### API 集成

1. 在 `src/lib/` 中添加 API 客户端函数
2. 在 `src/hooks/` 中创建数据获取 Hooks
3. 在 `src/store/` 中管理应用状态

### 类型定义

在 `src/types/` 中定义 TypeScript 类型，确保类型安全。

## 配置说明

### 环境变量

- `NEXT_PUBLIC_API_URL`: 后端 API 地址 (默认: http://localhost:9000)
- `NODE_ENV`: 运行环境 (development/production)
- `PORT`: 应用端口 (默认: 3000)

### Next.js 配置

项目配置文件 `next.config.ts` 包含:
- API 路由代理配置
- 构建优化设置
- 输出模式配置 (standalone)

## 开发命令

```bash
# 开发模式 (支持热重载)
npm run dev

# 生产构建
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint
```

## 注意事项

### 浏览器兼容性
- 现代浏览器 (Chrome 90+, Firefox 88+, Safari 14+)
- 部分功能需要较新的浏览器 API 支持

### 性能优化
- 组件懒加载和代码分割
- 图片优化和缓存策略
- API 请求防抖和缓存

### 安全考虑
- 环境变量安全管理
- API 请求错误处理
- 用户输入验证

## 故障排除

### 常见问题

1. **开发服务器启动失败**:
   ```bash
   # 清理依赖并重新安装
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **API 请求失败**:
   - 检查后端服务是否正常运行
   - 确认 `NEXT_PUBLIC_API_URL` 配置正确
   - 查看浏览器网络请求日志

3. **构建失败**:
   ```bash
   # 清理 Next.js 缓存
   rm -rf .next
   npm run build
   ```

## 参与贡献

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 相关链接

- [Next.js 文档](https://nextjs.org/docs)
- [React 文档](https://react.dev)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)
- [Radix UI 文档](https://www.radix-ui.com/docs)
- [Recharts 文档](https://recharts.org/)

---

> 这是监控系统的前端应用，需要配合后端 API 服务使用。详细的部署说明请参考项目根目录的 [Docker 部署指南](../DOCKER_DEPLOY.md)。

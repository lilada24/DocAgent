# DocAgent Frontend

AI 文档生成器 - React 前端

## 技术栈

- React 18
- TypeScript
- Vite
- Ant Design
- TailwindCSS 3
- Axios
- Socket.IO

## 快速开始

### 1. 安装依赖

```bash
cd frontend
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 3. 构建生产版本

```bash
npm run build
```

## 配置

### 开发环境

开发服务器配置在 `vite.config.ts` 中：

```typescript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
    },
  },
},
```

### 环境变量

创建 `.env` 文件：

```env
VITE_API_BASE_URL=http://localhost:8080
```

## 项目结构

```
frontend/
├── src/
│   ├── components/           # UI 组件
│   │   ├── DocumentGenerator.tsx  # 文档生成器
│   │   ├── ProjectList.tsx        # 项目列表
│   │   ├── TaskMonitor.tsx        # 任务监控
│   │   └── HealthStatus.tsx       # 系统状态
│   ├── services/             # API 服务
│   │   ├── api.ts                 # 基础 API 配置
│   │   ├── projectService.ts      # 项目服务
│   │   └── documentService.ts     # 文档服务
│   ├── types/                # TypeScript 类型定义
│   │   └── index.ts
│   ├── App.tsx               # 主应用组件
│   ├── main.tsx              # 入口文件
│   └── index.css             # 全局样式
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── postcss.config.js
```

## 功能模块

### 1. 文档生成器
- 支持多种文档类型（README、API、全部）
- 支持多语言（中文、英文）
- 支持多种 AI 模型选择
- 实时进度显示

### 2. 项目管理
- 项目列表展示
- 创建/编辑/删除项目
- 项目搜索

### 3. 任务监控
- 任务列表展示
- 实时状态更新
- 进度显示

### 4. 系统状态
- 后端服务状态
- Agent 服务状态
- 健康检查

## API 接口

前端通过 `/api` 路径代理到后端（http://localhost:8080）：

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/projects` | GET/POST | 项目管理 |
| `/api/documents/generate` | POST | 文档生成 |
| `/api/documents/tasks/{taskId}` | GET | 任务状态 |
| `/api/documents/health` | GET | 健康检查 |

## 开发说明

### 添加新页面

1. 在 `src/components/` 下创建新组件
2. 在 `App.tsx` 中添加路由和菜单项

### 添加新 API

1. 在 `src/services/` 下创建服务文件
2. 在组件中导入并使用

### 代码规范

- 使用 TypeScript
- 使用 React Hooks
- 使用 Ant Design 组件
- 使用 TailwindCSS 进行样式管理
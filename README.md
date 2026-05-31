# DocAgent

**AI 文档生成平台** - 自动生成 README、API 文档等

---

## 项目简介

DocAgent 是一个基于 AI 的文档生成平台，可以自动分析代码项目并生成：

- **README.md** - 项目介绍、安装指南、使用说明
- **API 文档** - 接口说明、参数定义、示例代码
- **架构文档** - 项目结构、技术栈、设计说明

---

## 技术架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DocAgent 系统架构                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                       │
│   ┌─────────────────┐     HTTP      ┌─────────────────┐    HTTP     ┌─────────────────┐
│   │   React 前端    │ ───────────→ │  Java 后端      │ ──────────→ │ Python Agent    │
│   │   (端口 3000)    │ ←────────── │  (端口 8080)     │ ←───────── │ (端口 8000)      │
│   │                 │   WebSocket   │                 │   JSON      │                 │
│   └────────┬────────┘               └────────┬────────┘             └────────┬────────┘
│            │                                │                                │
│            │                                ▼                                ▼
│            │                         ┌───────────┐                   ┌───────────┐
│            │                         │   MySQL   │                   │  DeepSeek │
│            │                         │   数据库    │                   │  API      │
│            │                         └───────────┘                   └───────────┘
│            │
│            ▼
│   ┌─────────────────┐
│   │ 功能模块        │
│   │ • 文档生成器    │
│   │ • 项目管理      │
│   │ • 任务监控      │
│   │ • 用户认证      │
│   └─────────────────┘
│
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 功能特性

###  AI 文档生成
- 支持多种文档类型（README、API、全部）
- 支持多语言（中文、英文）
- 支持多种 AI 模型（DeepSeek、GPT-4o、Qwen 等）

###  项目管理
- 项目列表展示
- 创建/编辑/删除项目
- 项目搜索

### 任务监控
- 实时任务进度显示
- WebSocket 实时更新
- 任务历史记录

###  用户认证
- JWT 令牌认证
- 用户注册/登录
- 权限隔离

---

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/your-username/DocAgent.git
cd DocAgent
```

### 2. 配置环境变量

创建 `.env` 文件：

```env
OPENAI_API_KEY=your-api-key
OPENAI_BASE_URL=https://api.deepseek.com
```

### 3. 安装依赖

```bash
# Python Agent
pip install -e .

# Java 后端
cd backend
mvn install

# React 前端
cd frontend
npm install
```

### 4. 启动服务

```bash
# 1. 启动 Python Agent (端口 8000)
python -m docagent.agent_service

# 2. 启动 Java 后端 (端口 8080)
cd backend
mvn spring-boot:run

# 3. 启动 React 前端 (端口 3000)
cd frontend
npm run dev
```

### 5. 访问应用

打开浏览器访问：http://localhost:3000

---

## 项目结构

```
DocAgent/
├── docagent/                 # Python Agent 核心
│   ├── agent.py             # Agent 主循环
│   ├── llm.py               # LLM 接口
│   ├── tools/               # 工具集
│   ├── doc_agent.py         # 文档生成 Agent
│   └── agent_service.py     # FastAPI 服务
│
├── backend/                  # Java Spring Boot 后端
│   ├── src/main/java/
│   │   └── com/example/docagent/
│   │       ├── controller/  # API 控制器
│   │       ├── service/     # 业务逻辑
│   │       ├── entity/      # 数据实体
│   │       ├── security/    # JWT 认证
│   │       └── config/      # 配置类
│   └── pom.xml              # Maven 配置
│
├── frontend/                 # React 前端
│   ├── src/
│   │   ├── components/      # UI 组件
│   │   ├── services/        # API 服务
│   │   ├── pages/           # 页面
│   │   └── types/           # TypeScript 类型
│   └ package.json           # npm 配置
│
├── deploy/                   # 部署配置
│   ├── docagent-backend.service
│   ├── docagent-agent.service
│   └ nginx.conf
│
└── README.md                 # 项目说明
```

---

## API 接口

| 接口 | 方法 | 说明 | 认证 |
|------|------|------|------|
| `/api/auth/register` | POST | 用户注册 | ❌ |
| `/api/auth/login` | POST | 用户登录 | ❌ |
| `/api/auth/me` | GET | 获取当前用户 | ✅ |
| `/api/projects` | GET/POST | 项目管理 | ✅ |
| `/api/documents/generate` | POST | 文档生成 | ✅ |
| `/api/documents/tasks/{taskId}` | GET | 任务状态 | ✅ |
| `/ws` | WebSocket | 实时通信 | ✅ |

---

## 部署指南

详见 [deploy/](./deploy/) 目录：

- `docagent-backend.service` - Java 后端 systemd 服务
- `docagent-agent.service` - Python Agent systemd 服务
- `nginx.conf` - Nginx 反向代理配置
- `application-prod.yml` - 生产环境配置

---

## 技术栈

| 层级 | 技术 |
|------|------|
| **前端** | React 18, TypeScript, Ant Design, TailwindCSS |
| **后端** | Spring Boot 3, JWT, WebSocket, JPA |
| **Agent** | Python 3.10+, FastAPI, OpenAI API |
| **数据库** | MySQL / H2 |
| **部署** | Nginx, Systemd, Docker |

---

## 开发计划

- [ ] 支持更多文档类型
- [ ] 多语言国际化
- [ ] 团队协作功能
- [ ] 文档版本管理
- [ ] API 测试集成
- [ ] 代码质量报告

---
## 致谢

本项目的 AI 部分参考了以下优秀的开源项目：

| 项目 | 说明 | 链接 |
|------|------|------|
| **原项目名称** | AI Agent 核心逻辑参考 | [[https://github.com/原作者/原项目名](https://github.com/he-yufeng)](https://github.com/原作者/原项目名) |
| **LangChain** | LLM 工具调用框架 | [https://github.com/langchain-ai/langchain](https://github.com/langchain-ai/langchain) |
| **FastAPI** | API 服务框架 | [https://github.com/tiangolo/fastapi](https://github.com/tiangolo/fastapi) |

感谢开源项目的作者！

---
## 贡献指南

欢迎提交 Issue 和 Pull Request！

---

## 许可证

MIT License

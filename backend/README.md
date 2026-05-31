# DocAgent Backend

AI 文档生成服务 - Spring Boot 后端

## 技术栈

- Spring Boot 3.2.0
- Java 21
- Spring Data JPA
- Spring WebSocket
- H2 Database (开发环境)
- MySQL (生产环境)

## 快速开始

### 1. 环境要求

- JDK 21+
- Maven 3.8+

### 2. 配置

编辑 `src/main/resources/application.yml`:

```yaml
spring:
  datasource:
    url: jdbc:h2:mem:docagentdb
    username: sa
    password:

agent:
  api:
    base-url: http://localhost:8000  # Python Agent API 地址
```

### 3. 启动

方式一：使用 Maven
```bash
cd backend
mvn spring-boot:run
```

方式二：使用 start.bat
```bash
cd backend
start.bat
```

方式三：打包后运行
```bash
mvn clean package -DskipTests
java -jar target/docagent-backend-1.0.0.jar
```

### 4. 验证

访问 http://localhost:8080 应该返回健康检查信息。

## API 文档

### 项目管理

```
POST   /api/projects           - 创建项目
GET    /api/projects           - 获取所有项目
GET    /api/projects/{id}     - 获取项目详情
PUT    /api/projects/{id}     - 更新项目
DELETE /api/projects/{id}     - 删除项目
GET    /api/projects/search    - 搜索项目
```

### 文档生成

```
POST   /api/documents/generate           - 创建文档生成任务
GET    /api/documents/tasks/{taskId}    - 获取任务状态
GET    /api/documents/health            - 健康检查
```

### 数据库管理

开发环境 H2 控制台：http://localhost:8080/h2-console

- JDBC URL: `jdbc:h2:mem:docagentdb`
- Username: `sa`
- Password: `(空)`

## WebSocket

连接地址: `ws://localhost:8080/ws/docagent`

STOMP 端点: `/ws/docagent`

订阅主题:
- `/topic/task/{taskId}` - 订阅任务进度更新

## 配置说明

### application.yml

```yaml
server:
  port: 8080

spring:
  datasource:
    # 开发环境 (H2)
    url: jdbc:h2:mem:docagentdb
    # 生产环境 (MySQL)
    # url: jdbc:mysql://localhost:3306/docagentdb

agent:
  api:
    base-url: http://localhost:8000  # Python Agent API
    timeout: 300000                    # 5 分钟超时
```

## 项目结构

```
backend/
├── src/main/java/com/example/docagent/
│   ├── DocAgentApplication.java      # 启动类
│   ├── config/                        # 配置类
│   │   ├── RestTemplateConfig.java
│   │   ├── WebSocketConfig.java
│   │   ├── CorsConfig.java
│   │   └── GlobalExceptionHandler.java
│   ├── controller/                    # REST 控制器
│   │   ├── ProjectController.java
│   │   └── DocumentController.java
│   ├── service/                      # 业务逻辑
│   │   ├── ProjectService.java
│   │   ├── DocumentService.java
│   │   └── AgentService.java
│   ├── repository/                   # 数据访问
│   ├── entity/                        # 实体类
│   └── dto/                           # 数据传输对象
├── src/main/resources/
│   └── application.yml               # 配置文件
├── pom.xml                           # Maven 配置
└── start.bat                         # 启动脚本
```
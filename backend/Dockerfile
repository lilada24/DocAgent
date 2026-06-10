# =============================================================
# 阶段 1: Maven 构建
# =============================================================
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# 配置 Maven 国内镜像（加速依赖下载）
RUN mkdir -p /root/.m2 && echo '<settings><mirrors><mirror><id>aliyunmaven</id><mirrorOf>central</mirrorOf><url>https://maven.aliyun.com/repository/public</url></mirror><mirror><id>maven.aliyun.com</id><mirrorOf>jboss-public-repository-group</mirrorOf><url>https://maven.aliyun.com/repository/jboss</url></mirror></mirrors></settings>' > /root/.m2/settings.xml

# 先复制 pom.xml 下载依赖（利用 Docker 缓存层）
COPY pom.xml .
RUN mvn dependency:go-offline -B -q

# 复制源码并构建
COPY src ./src
RUN mvn package -DskipTests -q

# =============================================================
# 阶段 2: 运行时
# =============================================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# 创建非 root 用户
RUN addgroup -g 1000 appgroup && \
    adduser -u 1000 -G appgroup -D appuser

# 复制构建产物
COPY --from=build /app/target/*.jar app.jar

# 创建数据目录（如果使用 H2 文件存储）
RUN mkdir -p /app/data && chown -R appuser:appgroup /app

USER appuser
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/documents/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]

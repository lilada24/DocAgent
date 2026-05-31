#!/bin/bash

echo "=========================================="
echo "   DocAgent 部署脚本"
echo "=========================================="

PROJECT_DIR="/opt/docagent"
LOG_DIR="/var/log/docagent"

echo "1. 创建目录..."
sudo mkdir -p $PROJECT_DIR
sudo mkdir -p $PROJECT_DIR/backend
sudo mkdir -p $PROJECT_DIR/frontend
sudo mkdir -p $PROJECT_DIR/corecoder
sudo mkdir -p $LOG_DIR

echo "2. 安装依赖..."
sudo apt update
sudo apt install -y openjdk-21-jdk python3.11 python3-pip mysql-server nginx

echo "3. 配置 MySQL..."
sudo mysql -u root -e "CREATE DATABASE IF NOT EXISTS docagentdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -u root -e "CREATE USER IF NOT EXISTS 'docagent'@'localhost' IDENTIFIED BY 'docagent_password';"
sudo mysql -u root -e "GRANT ALL PRIVILEGES ON docagentdb.* TO 'docagent'@'localhost';"
sudo mysql -u root -e "FLUSH PRIVILEGES;"

echo "4. 创建 Python 虚拟环境..."
python3.11 -m venv $PROJECT_DIR/venv
$PROJECT_DIR/venv/bin/pip install -e $PROJECT_DIR/corecoder[server]

echo "5. 构建 Java 后端..."
cd $PROJECT_DIR/backend
mvn clean package -DskipTests
sudo cp target/docagent-backend.jar $PROJECT_DIR/backend/

echo "6. 构建前端..."
cd $PROJECT_DIR/frontend
npm install
npm run build
sudo cp -r dist/* $PROJECT_DIR/frontend/dist/

echo "7. 安装 Systemd 服务..."
sudo cp deploy/docagent-backend.service /etc/systemd/system/
sudo cp deploy/docagent-agent.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable docagent-backend
sudo systemctl enable docagent-agent

echo "8. 配置 Nginx..."
sudo cp deploy/nginx.conf /etc/nginx/sites-available/docagent
sudo ln -sf /etc/nginx/sites-available/docagent /etc/nginx/sites-enabled/docagent
sudo nginx -t
sudo systemctl restart nginx

echo "9. 启动服务..."
sudo systemctl start docagent-agent
sudo systemctl start docagent-backend

echo "=========================================="
echo "   部署完成！"
echo "=========================================="
echo ""
echo "访问地址: https://your-domain.com"
echo ""
echo "查看状态:"
echo "  sudo systemctl status docagent-agent"
echo "  sudo systemctl status docagent-backend"
echo ""
echo "查看日志:"
echo "  tail -f $LOG_DIR/backend.log"
echo ""
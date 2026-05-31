@echo off
rem DocAgent Backend Startup Script

echo ========================================
echo DocAgent Backend Starting...
echo ========================================

rem Check Java version
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Java is not installed or not in PATH
    exit /b 1
)

rem Set default port
if "%PORT%"=="" set PORT=8080

echo Starting on port %PORT%...
echo.

rem Start Spring Boot
cd /d %~dp0
mvnw.cmd spring-boot:run -Dspring-boot.run.jvmArguments="-Dserver.port=%PORT%"

pause
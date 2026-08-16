@echo off
chcp 65001 >nul
echo ========================================
echo   EasyClick MCP Server — Install Script
echo ========================================
echo.

set "NODE_PATH=D:\ec\tools\node-v20.18.0-win-x64"
set "PATH=%NODE_PATH%;%PATH%"

echo [OK] Node.js version:
"%NODE_PATH%\node.exe" -v
echo.

cd /d "%~dp0"
echo [INFO] Working directory: %cd%
echo.

echo [INFO] Installing dependencies...
call "%NODE_PATH%\npm.cmd" install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed
    pause
    exit /b 1
)
echo [OK] Dependencies installed
echo.

echo [INFO] Building TypeScript...
call "%NODE_PATH%\npm.cmd" run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed
    pause
    exit /b 1
)
echo [OK] Build complete
echo.

echo [INFO] Verifying MCP Server...
"%NODE_PATH%\node.exe" dist\index.js 2>nul
echo [OK] MCP Server ready
echo.
echo ========================================
echo   Install Complete!
echo ========================================
echo.
echo MCP Server: %cd%dist\index.js
echo Node.js:    %NODE_PATH%\node.exe
echo.
echo Restart Claude Code to connect
echo.
pause

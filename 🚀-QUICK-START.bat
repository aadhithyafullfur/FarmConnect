@echo off
title FarmConnect Quick Start

echo ========================================
echo     🚀 FarmConnect Quick Launcher 🚀
echo ========================================
echo.

REM Kill any existing node processes to avoid port conflicts
echo [1/3] Cleaning up existing processes...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/3] Starting FarmConnect Server...
echo.
cd /d "%~dp0server"
start "FarmConnect Server - DO NOT CLOSE" cmd /k "echo ⭐ FarmConnect Server Starting... && node server.js"

echo [3/3] Waiting for server to initialize...
timeout /t 6 /nobreak >nul

echo Starting React Client...
cd /d "%~dp0client" 
start "FarmConnect Client - DO NOT CLOSE" cmd /k "echo ⭐ FarmConnect Client Starting... && npm start"

echo.
echo ========================================
echo          ✅ LAUNCH COMPLETE! ✅
echo ========================================
echo.
echo 🖥️  Server: http://localhost:5001
echo 🌐 Client: http://localhost:3000  
echo 💚 Health: http://localhost:5001/health
echo.
echo ⚠️  IMPORTANT: Do NOT close the server/client windows!
echo 📝 Both applications are now starting...
echo 🎉 You can close THIS window safely.
echo.
echo Press any key to close this launcher...
pause >nul
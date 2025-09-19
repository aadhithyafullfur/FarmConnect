@echo off
echo ========================================
echo     FarmConnect Auto-Startup Script
echo ========================================
echo.

echo [1/4] Checking for existing servers...
tasklist | findstr node >nul && echo Node.js processes found, stopping existing servers...
taskkill /f /im node.exe >nul 2>&1

echo.
echo [2/4] Starting MongoDB (if available)...
net start MongoDB >nul 2>&1
if %errorlevel% == 0 (
    echo MongoDB started successfully
) else (
    echo MongoDB already running or not installed
)

echo.
echo [3/4] Starting Backend Server...
start "FarmConnect Server" cmd /k "cd /d %~dp0server && echo Starting FarmConnect Server... && node server.js"

echo.
echo [4/4] Waiting for server to initialize...
timeout /t 8 /nobreak >nul

echo Starting React Client...
start "FarmConnect Client" cmd /k "cd /d %~dp0client && echo Starting FarmConnect Client... && npm start"

echo.
echo ========================================
echo           Startup Complete!
echo ========================================
echo Server: http://localhost:5002
echo Client: http://localhost:3000
echo Health: http://localhost:5002/health
echo.
echo Both applications are starting in separate windows.
echo This window can be closed safely.
echo.
pause
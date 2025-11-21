@echo off
REM Start FarmConnect Application

echo.
echo ========================================
echo FarmConnect Startup Script
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/4] Checking dependencies...
echo.

REM Get the project root directory
set PROJECT_ROOT=%~dp0

REM Start Server
echo [2/4] Starting Server on port 5002...
start cmd /k "cd %PROJECT_ROOT%server && node server.js"

REM Wait for server to start
timeout /t 3 /nobreak

REM Start Client
echo [3/4] Starting Client on port 3000...
start cmd /k "cd %PROJECT_ROOT%client && npm start"

echo [4/4] Done!
echo.
echo ========================================
echo FarmConnect is starting up:
echo.
echo Server: http://localhost:5002
echo Client: http://localhost:3000
echo Chat API: http://localhost:5002/api/messages
echo.
echo Press ENTER to close this window
echo ========================================
echo.

pause

@echo off
REM FarmConnect Auto-Startup Monitor
setlocal enabledelayedexpansion

:MAIN
cls
echo ========================================
echo    🔄 FarmConnect Auto-Startup Monitor
echo ========================================
echo.

REM Check if server is running
netstat -an | findstr ":5001" >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ Server is running on port 5001
    echo 💤 Monitoring... Press Ctrl+C to stop
    timeout /t 30 /nobreak >nul
    goto MAIN
) else (
    echo ❌ Server not detected on port 5001
    echo 🚀 Starting FarmConnect Server...
    
    REM Kill any hanging node processes
    taskkill /f /im node.exe >nul 2>&1
    
    REM Start server in background
    cd /d "%~dp0server"
    start /min "FarmConnect Server" cmd /k "echo 🚀 FarmConnect Server Auto-Started && node server.js"
    
    echo ⏳ Waiting for server to initialize...
    timeout /t 10 /nobreak >nul
    
    REM Check again
    netstat -an | findstr ":5001" >nul 2>&1
    if %errorlevel% == 0 (
        echo ✅ Server started successfully!
        echo 🌐 Available at: http://localhost:5001
        echo 💚 Health check: http://localhost:5001/health
    ) else (
        echo ⚠️  Server may still be starting...
    )
    
    echo.
    timeout /t 5 /nobreak >nul
    goto MAIN
)

:END
echo Monitor stopped.
pause
# FarmConnect Reliable Startup Script
$Host.UI.RawUI.Write-Host "🖥️  Server: " -NoNewline -ForegroundColor White
Write-Host "http://localhost:5001" -ForegroundColor Cyan
Write-Host "🌐 Client: " -NoNewline -ForegroundColor White  
Write-Host "http://localhost:3000" -ForegroundColor Cyan
Write-Host "💚 Health: " -NoNewline -ForegroundColor White
Write-Host "http://localhost:5001/health" -ForegroundColor CyanTitle = "FarmConnect Launcher"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    🚀 FarmConnect Reliable Launcher    " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Kill existing processes to avoid conflicts
Write-Host "[1/4] Cleaning up existing processes..." -ForegroundColor Yellow
try {
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Cleanup complete" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  No processes to cleanup" -ForegroundColor Gray
}

Start-Sleep -Seconds 2

# Start MongoDB if available
Write-Host "[2/4] Starting MongoDB (if available)..." -ForegroundColor Yellow
try {
    Start-Service MongoDB -ErrorAction SilentlyContinue
    Write-Host "✅ MongoDB started" -ForegroundColor Green
} catch {
    Write-Host "ℹ️  MongoDB not available or already running" -ForegroundColor Gray
}

Write-Host ""

# Start Backend Server
Write-Host "[3/4] Starting Backend Server..." -ForegroundColor Cyan
$serverPath = Join-Path $scriptDir "server"
$serverCmd = "cd '$serverPath'; Write-Host 'FarmConnect Server Starting...' -ForegroundColor Green; node server.js"
Start-Process cmd -ArgumentList "/k", "powershell -Command `"$serverCmd`"" -WindowStyle Normal

# Wait for server to start
Write-Host "[4/4] Waiting for server to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Start React Client
Write-Host "Starting React Client..." -ForegroundColor Blue
$clientPath = Join-Path $scriptDir "client"
$clientCmd = "cd '$clientPath'; Write-Host 'FarmConnect Client Starting...' -ForegroundColor Blue; npm start"
Start-Process cmd -ArgumentList "/k", "powershell -Command `"$clientCmd`"" -WindowStyle Normal

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "          ✅ STARTUP COMPLETE!          " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "�️  Server: " -NoNewline -ForegroundColor White
Write-Host "http://localhost:5002" -ForegroundColor Cyan
Write-Host "🌐 Client: " -NoNewline -ForegroundColor White  
Write-Host "http://localhost:3000" -ForegroundColor Cyan
Write-Host "💚 Health: " -NoNewline -ForegroundColor White
Write-Host "http://localhost:5002/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  Keep the server and client windows open!" -ForegroundColor Yellow
Write-Host "📝 Both applications are now starting..." -ForegroundColor Gray
Write-Host ""
Write-Host "Press any key to close this launcher..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
#!/usr/bin/env pwsh

# FarmConnect Startup Script for PowerShell

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "FarmConnect Startup Script" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if Node.js is installed
$nodeVersion = node --version 2>$null
if (-not $nodeVersion) {
    Write-Host "Error: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    Read-Host "Press ENTER to exit"
    exit 1
}

Write-Host "[1/4] Node.js version: $nodeVersion" -ForegroundColor Green

# Get project root
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

# Start Server
Write-Host "[2/4] Starting Server on port 5002..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @"
  Set-Location '$projectRoot\server'
  Write-Host 'Server starting...' -ForegroundColor Green
  node server.js
"@

# Wait for server to initialize
Write-Host "Waiting 3 seconds for server to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

# Start Client
Write-Host "[3/4] Starting Client on port 3000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @"
  Set-Location '$projectRoot\client'
  Write-Host 'Client starting...' -ForegroundColor Green
  npm start
"@

Write-Host "[4/4] Done!" -ForegroundColor Green
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "FarmConnect is starting up:" -ForegroundColor Cyan
Write-Host "`nServer:  http://localhost:5002" -ForegroundColor Green
Write-Host "Client:  http://localhost:3000" -ForegroundColor Green
Write-Host "Chat API: http://localhost:5002/api/messages" -ForegroundColor Green
Write-Host "`nClose PowerShell windows when done." -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

Read-Host "Press ENTER to close this window"

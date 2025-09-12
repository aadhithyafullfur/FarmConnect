@echo off
echo Starting FarmConnect Server...
echo.
cd /d "D:\Projects\Farmer_connect\FARMCONNECT\farmconnect\server"
echo Current directory: %CD%
echo.
echo Installing dependencies if needed...
npm install --silent
echo.
echo Starting Node.js server...
npm start
pause

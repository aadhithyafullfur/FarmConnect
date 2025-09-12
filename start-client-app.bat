@echo off
echo Starting FarmConnect Web Client...
echo.
cd /d "D:\Projects\Farmer_connect\FARMCONNECT\farmconnect\client"
echo Current directory: %CD%
echo.
echo Installing dependencies if needed...
npm install --silent
echo.
echo Starting React development server...
npm start
pause

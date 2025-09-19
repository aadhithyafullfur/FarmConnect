@echo off
cls

echo 🚜 FarmConnect - Quick Setup Script (Windows)
echo ===============================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm.
    pause
    exit /b 1
)

echo ✅ Node.js version:
node --version
echo ✅ npm version:
npm --version
echo.

REM Install client dependencies
echo 📦 Installing client dependencies...
cd client
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install client dependencies
    pause
    exit /b 1
)
echo ✅ Client dependencies installed successfully!

REM Install server dependencies
echo.
echo 📦 Installing server dependencies...
cd ..\server
call npm install
if %errorlevel% neq 0 (
    echo ❌ Failed to install server dependencies
    pause
    exit /b 1
)
echo ✅ Server dependencies installed successfully!

REM Check if .env file exists
echo.
if not exist ".env" (
    echo ⚠️  Creating .env template file...
    (
    echo # Database Configuration - REPLACE WITH YOUR MONGODB URI
    echo MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/FARMCONNECT?retryWrites=true^&w=majority^&ssl=true^&authSource=admin
    echo.
    echo # Server Configuration
    echo PORT=5001
    echo.
    echo # Security - REPLACE WITH A SECURE SECRET
    echo JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-complex
    echo.
    echo # Development Settings
    echo NODE_ENV=development
    ) > .env
    echo ✅ .env template created! Please edit server\.env with your MongoDB credentials.
) else (
    echo ✅ .env file already exists.
)

echo.
echo 🎉 Setup Complete!
echo.
echo Next steps:
echo 1. 📝 Edit server\.env with your MongoDB Atlas connection string
echo 2. 🔑 Update JWT_SECRET in server\.env with a secure secret key
echo 3. 🚀 Run the application:
echo    Terminal 1: cd server ^&^& npm start
echo    Terminal 2: cd client ^&^& npm start
echo.
echo    OR use the quick start script: 🚀-QUICK-START.bat
echo.
echo 📖 For detailed instructions, see README.md
echo 🌐 Application will run on: http://localhost:3000
echo 🔧 Server API will run on: http://localhost:5001
echo.
echo Happy coding! 🌾
echo.
pause
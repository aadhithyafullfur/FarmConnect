#!/bin/bash

# FarmConnect Quick Setup Script
# This script automates the installation process for new developers

echo "🚜 FarmConnect - Quick Setup Script"
echo "===================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client
if npm install; then
    echo "✅ Client dependencies installed successfully!"
else
    echo "❌ Failed to install client dependencies"
    exit 1
fi

# Install server dependencies
echo ""
echo "📦 Installing server dependencies..."
cd ../server
if npm install; then
    echo "✅ Server dependencies installed successfully!"
else
    echo "❌ Failed to install server dependencies"
    exit 1
fi

# Check if .env file exists
echo ""
if [ ! -f ".env" ]; then
    echo "⚠️  Creating .env template file..."
    cat > .env << EOL
# Database Configuration - REPLACE WITH YOUR MONGODB URI
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/FARMCONNECT?retryWrites=true&w=majority&ssl=true&authSource=admin

# Server Configuration
PORT=5001

# Security - REPLACE WITH A SECURE SECRET
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-complex

# Development Settings
NODE_ENV=development
EOL
    echo "✅ .env template created! Please edit server/.env with your MongoDB credentials."
else
    echo "✅ .env file already exists."
fi

echo ""
echo "🎉 Setup Complete!"
echo ""
echo "Next steps:"
echo "1. 📝 Edit server/.env with your MongoDB Atlas connection string"
echo "2. 🔑 Update JWT_SECRET in server/.env with a secure secret key"
echo "3. 🚀 Run the application:"
echo "   Terminal 1: cd server && npm start"
echo "   Terminal 2: cd client && npm start"
echo ""
echo "📖 For detailed instructions, see README.md"
echo "🌐 Application will run on: http://localhost:3000"
echo "🔧 Server API will run on: http://localhost:5001"
echo ""
echo "Happy coding! 🌾"
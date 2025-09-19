# 🚜 FarmConnect - Farm-to-Table Marketplace

A comprehensive full-stack application connecting farmers directly with buyers, featuring real-time communication, secure authentication, and seamless order management.

## 📋 Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)  
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## ✨ Features

### 🌱 For Farmers
- **Professional Dashboard** - Modern analytics and product management
- **Product Management** - Add, edit, delete products with image uploads
- **Inventory Tracking** - Real-time stock management
- **Order Management** - Track and fulfill customer orders
- **Analytics** - Revenue tracking and performance metrics
- **Profile Management** - Farm details and farming methods

### 🛒 For Buyers  
- **Marketplace** - Browse fresh products from local farmers
- **Advanced Search** - Filter by category, price, location, organic status
- **Shopping Cart** - Seamless checkout experience
- **Order Tracking** - Real-time order status updates
- **Farmer Profiles** - View farm information and farming practices
- **Reviews & Ratings** - Product and farmer feedback system

### 📱 Additional Features
- **Real-time Messaging** - Direct communication between farmers and buyers
- **Secure Authentication** - JWT-based login system with auto-reconnection
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Image Management** - High-quality product photo uploads
- **Location Services** - Farm and delivery location mapping

## 🛠️ Tech Stack

### Frontend (Client)
- **React 19.1.1** - Modern UI framework
- **React Router DOM** - Navigation and routing
- **Tailwind CSS** - Utility-first styling
- **Headless UI** - Accessible components
- **Axios** - HTTP client
- **Socket.io Client** - Real-time communication
- **React Toastify** - Notifications

### Backend (Server)  
- **Node.js** - Runtime environment
- **Express 5.1.0** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **Socket.io** - WebSocket communication
- **JWT** - Authentication tokens
- **Multer** - File upload handling
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** (v7 or higher) - Comes with Node.js
- **Git** - [Download](https://git-scm.com/)
- **MongoDB Account** - [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier available)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/aadhithyafullfur/FarmConnect.git
cd FarmConnect
```

### 2. Install Dependencies

#### Install Client Dependencies
```bash
cd client
npm install
```

#### Install Server Dependencies  
```bash
cd ../server
npm install
```

## ⚙️ Configuration

### 1. Database Setup

1. Create a **MongoDB Atlas** account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a new cluster (free tier works fine)
3. Create a database user with read/write permissions
4. Get your connection string from MongoDB Atlas

### 2. Environment Variables

Create a `.env` file in the `server` directory:

```bash
cd server
touch .env  # On Windows: type nul > .env
```

Add the following configuration to `server/.env`:

```env
# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/FARMCONNECT?retryWrites=true&w=majority&ssl=true&authSource=admin

# Server Configuration  
PORT=5001

# Security
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-complex

# Optional: Development Settings
NODE_ENV=development
```

**⚠️ Important:** Replace the placeholders with your actual values:
- `username:password` - Your MongoDB Atlas credentials
- `cluster` - Your MongoDB cluster name  
- `your-super-secret-jwt-key` - Generate a secure random string

### 3. Port Configuration

The application uses these default ports:
- **Client (React):** `http://localhost:3000`
- **Server (Node.js):** `http://localhost:5001`

If you need to change ports, update:
- Server port: Change `PORT` in `server/.env`
- Client API base URL: Update `client/src/services/api.js`

## 🏃‍♂️ Running the Application

### Option 1: Manual Startup (Recommended for Development)

#### Terminal 1 - Start the Server
```bash
cd server
npm start
```
You should see:
```
Server running on port 🚀 5001
MongoDB connected successfully 💡
Health endpoint: http://127.0.0.1:5001/health
```

#### Terminal 2 - Start the Client  
```bash
cd client
npm start
```
The browser will automatically open to `http://localhost:3000`

### Option 2: Quick Start Scripts (Windows)

For Windows users, use the provided batch scripts:

```bash
# Quick start both server and client
🚀-QUICK-START.bat

# Or start individually
start-server.bat
start-client-app.bat
```

### Option 3: Development Mode

For server auto-restart during development:

```bash
cd server
npm run dev  # Uses nodemon for auto-restart
```

## 📁 Project Structure

```
FarmConnect/
├── client/                          # React Frontend
│   ├── public/
│   │   ├── crops/                   # Product images
│   │   └── index.html
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   ├── pages/                   # Application pages
│   │   ├── services/                # API communication
│   │   ├── context/                 # React context providers
│   │   ├── hooks/                   # Custom React hooks
│   │   └── utils/                   # Utility functions
│   ├── package.json
│   └── tailwind.config.js
│
├── server/                          # Node.js Backend
│   ├── controllers/                 # Business logic
│   ├── middleware/                  # Authentication & validation
│   ├── models/                      # Database schemas
│   ├── routes/                      # API endpoints
│   ├── uploads/                     # File storage
│   ├── server.js                    # Main server file
│   ├── package.json
│   └── .env                        # Environment variables
│
├── .vscode/                         # VS Code configuration
├── startup scripts/                 # Batch files for easy startup
└── README.md                        # This file
```

## 📡 API Documentation

### Authentication Endpoints
```
POST   /api/auth/register    # User registration
POST   /api/auth/login       # User login  
GET    /api/auth/verify      # Token verification
```

### Product Endpoints
```
GET    /api/products         # Get all products
POST   /api/products         # Create product (farmers only)
PUT    /api/products/:id     # Update product (owner only)
DELETE /api/products/:id     # Delete product (owner only)
```

### Order Endpoints  
```
GET    /api/orders           # Get user orders
POST   /api/orders           # Create new order
PUT    /api/orders/:id       # Update order status
```

### Health Check
```
GET    /health               # Server health status
```

## 🔧 Troubleshooting

### Common Issues

#### 1. "Unable to connect to server"
**Solution:**
- Ensure server is running on port 5001
- Check MongoDB connection string in `.env`
- Verify no firewall is blocking the ports

#### 2. "Module not found" errors
**Solution:**
```bash
# Delete node_modules and reinstall
cd client && rm -rf node_modules && npm install
cd ../server && rm -rf node_modules && npm install
```

#### 3. MongoDB connection fails
**Solution:**
- Verify MongoDB Atlas credentials
- Check IP whitelist in MongoDB Atlas (add 0.0.0.0/0 for development)
- Ensure network connectivity

#### 4. Port already in use
**Solution:**
```bash
# Kill processes on ports
npx kill-port 3000 5001

# Or change ports in configuration
```

#### 5. Images not loading
**Solution:**
- Check `server/uploads` directory permissions
- Verify image upload paths in product creation
- Ensure CORS is properly configured

### Development Tips

1. **Auto-reconnection:** The client automatically reconnects when the server restarts
2. **Hot reload:** Both client and server support hot reloading for development  
3. **Debugging:** Check browser console and server logs for detailed error messages
4. **Database:** Use MongoDB Compass to visually inspect your database

## 🚀 Production Deployment

### Environment Setup
1. Set `NODE_ENV=production` in server `.env`
2. Build the client: `cd client && npm run build`
3. Configure production MongoDB instance
4. Set up proper SSL certificates
5. Use process manager like PM2 for server

### Recommended Hosting
- **Frontend:** Netlify, Vercel, or AWS S3
- **Backend:** Heroku, DigitalOcean, or AWS EC2
- **Database:** MongoDB Atlas (production cluster)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

If you encounter any issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Search existing [GitHub Issues](https://github.com/aadhithyafullfur/FarmConnect/issues)
3. Create a new issue with detailed description and error logs

## 🎉 Acknowledgments

- React and Node.js communities for excellent documentation
- MongoDB for reliable database services  
- Tailwind CSS for beautiful styling utilities
- All contributors and testers

---

**Happy Farming! 🌾**

*Built with ❤️ for connecting farmers and buyers*
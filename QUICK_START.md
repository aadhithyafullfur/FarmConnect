# FarmConnect - Quick Start Guide

A full-stack agricultural marketplace application with farmer and buyer dashboards.

## Prerequisites
- Node.js v16+ 
- MongoDB (Atlas or local)
- npm or yarn

## Setup & Run

### 1. Server Setup
```bash
cd server
npm install
# Update .env with your MongoDB URI if needed
node server.js
```
Server runs on: **http://localhost:5004**

### 2. Client Setup
```bash
cd client
npm install
npm start
```
Client runs on: **http://localhost:3000**

## Features
- ✅ User authentication (Farmer/Buyer/Driver)
- ✅ Product listings and management
- ✅ Real-time chat messaging
- ✅ Order management with status tracking
- ✅ Shopping cart functionality
- ✅ Driver location tracking
- ✅ Notifications system

## Project Structure
```
farmconnect/
├── client/              # React frontend
│   ├── src/
│   ├── public/
│   └── package.json
├── server/              # Node.js backend
│   ├── controllers/     # API logic
│   ├── routes/          # API endpoints
│   ├── models/          # MongoDB schemas
│   ├── middleware/      # Auth middleware
│   └── server.js
└── driver-app/          # React Native app (mobile)
```

## Environment Variables

### Server (.env)
```
MONGODB_URI=your_mongodb_connection_string
PORT=5004
JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

### Client (.env)
```
REACT_APP_API_URL=http://localhost:5004
REACT_APP_API_BASE=http://localhost:5004
```

## API Base URL
All API calls use: `http://localhost:5004/api`

## Key Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET/POST /api/products` - Product management
- `GET/POST /api/orders` - Order management
- `GET/POST /api/messages` - Chat messages

## Troubleshooting

### Server won't start
- Check MongoDB connection string in `.env`
- Verify port 5004 is available
- Check Node.js version: `node --version`

### Client won't connect
- Ensure server is running on port 5004
- Hard refresh browser: `Ctrl+Shift+R`
- Check browser console for errors

### Port already in use
- Find process: `lsof -i :5004` (Mac/Linux) or `netstat -ano | findstr :5004` (Windows)
- Kill process and restart server

## Database
MongoDB collections created automatically on first run:
- users
- products
- orders
- messages
- carts
- notifications

## Support
For issues, check error logs in browser console and server terminal.

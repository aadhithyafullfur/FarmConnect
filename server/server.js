require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const driverRoutes = require('./routes/driverRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 200
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/crops', express.static(path.join(__dirname, '../client/public/crops')));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`\n=== INCOMING REQUEST ===`);
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log(`========================\n`);
  next();
});

// Make io instance available to routes
app.set('io', io);

// Health check endpoints (both with and without /api prefix)
app.get('/health', (req, res) => {
  res.json({ status: 'Server is running', port: server.address()?.port || 'unknown', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', port: server.address()?.port || 'unknown', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler for unmatched API routes (must be AFTER routes)
app.use('/api', (req, res) => {
  console.log(`\n=== 404 ERROR ===`);
  console.log(`Route not found: ${req.method} ${req.url}`);
  console.log(`Full path: ${req.originalUrl}`);
  console.log(`=================\n`);
  res.status(404).json({ msg: 'API route not found', path: req.originalUrl, method: req.method });
});

// Error handling middleware (MUST be last)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4 // Use IPv4, skip trying IPv6
}).then(() => {
  console.log('MongoDB connected successfully 💡');
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Socket.IO events
const connectedUsers = new Map(); // Track connected users

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User joins their personal room
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    connectedUsers.set(userId, socket.id);
    console.log(`User ${userId} joined room user_${userId}`);
  });

  // Handle messages
  socket.on('sendMessage', (data) => {
    io.emit('receiveMessage', data);
  });

  // Handle notification acknowledgment
  socket.on('notificationRead', (notificationId) => {
    // Could emit to other relevant users if needed
    console.log(`Notification ${notificationId} marked as read`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    // Remove user from connected users map
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

// Make io and connectedUsers available globally
global.io = io;
global.connectedUsers = connectedUsers;

// Auto-increment port logic
let port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
function tryStart(p) {
  server.listen(p, '127.0.0.1')  // Force IPv4 binding
    .on('listening', () => {
      const actualPort = server.address().port;
      console.log(`Server running on port 🚀 ${actualPort}`);
      console.log(`Server address:`, server.address());
      console.log(`Health endpoint: http://127.0.0.1:${actualPort}/health`);
    })
    .on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`Port ${p} in use, trying ${p + 1}...`);
        tryStart(p + 1);
      } else {
        console.error('Server error:', err);
        process.exit(1);
      }
    });
}
tryStart(port);

// Error handlers
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

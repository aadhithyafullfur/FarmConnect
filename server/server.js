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

// MongoDB connection with retry logic
let mongoConnected = false;

function connectMongoDB() {
  mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4
  })
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    mongoConnected = true;
  })
  .catch(err => {
    console.error('⚠️  MongoDB connection error:', err.message);
    mongoConnected = false;
    console.log('📝 Retrying MongoDB connection in 5 seconds...');
    setTimeout(connectMongoDB, 5000);
  });
}

connectMongoDB();

// Socket.IO events
const connectedUsers = new Map(); // Track connected users

io.on('connection', (socket) => {
  console.log('🔗 User connected:', socket.id);

  // User joins their personal room
  socket.on('userConnected', (data) => {
    const userId = data.userId;
    socket.join(`user_${userId}`);
    connectedUsers.set(userId, { socketId: socket.id, connected: true });
    console.log(`✅ User ${userId} connected - Room: user_${userId}`);
    
    // Broadcast user online status
    io.emit('userOnline', { userId, timestamp: new Date() });
  });

  // Handle sending messages - real-time delivery
  socket.on('sendMessage', (data) => {
    const { senderId, recipientId, content, createdAt } = data;
    
    // Send to specific recipient
    io.to(`user_${recipientId}`).emit('newMessage', {
      senderId,
      recipientId,
      content,
      createdAt,
      delivered: true
    });
    
    console.log(`💬 Message from ${senderId} to ${recipientId}: ${content.substring(0, 30)}...`);
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    const { recipientId } = data;
    io.to(`user_${recipientId}`).emit('userTyping', { userId: data.senderId || socket.userId });
  });

  // Handle stopped typing
  socket.on('stoppedTyping', (data) => {
    const { recipientId } = data;
    io.to(`user_${recipientId}`).emit('userStoppedTyping', { userId: data.senderId || socket.userId });
  });

  // Handle notification acknowledgment
  socket.on('notificationRead', (notificationId) => {
    console.log(`📬 Notification ${notificationId} marked as read`);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    let userId = null;
    
    // Find and remove user from connected users map
    for (const [id, userData] of connectedUsers.entries()) {
      if (userData.socketId === socket.id) {
        userId = id;
        connectedUsers.delete(id);
        console.log(`❌ User ${id} disconnected`);
        
        // Broadcast user offline status
        io.emit('userOffline', { userId: id, timestamp: new Date() });
        break;
      }
    }
    
    console.log(`Disconnected socket: ${socket.id}`);
  });
});

// Make io and connectedUsers available globally
global.io = io;
global.connectedUsers = connectedUsers;

// Auto-increment port logic
let port = process.env.PORT ? parseInt(process.env.PORT) : 5002;
function tryStart(p) {
  server.listen(p, '127.0.0.1')  // Force IPv4 binding
    .on('listening', () => {
      const actualPort = server.address().port;
      console.log(`✅ Server running on port 🚀 ${actualPort}`);
      console.log(`Server address:`, server.address());
      console.log(`Health endpoint: http://127.0.0.1:${actualPort}/health`);
      console.log(`Chat API: http://127.0.0.1:${actualPort}/api/messages`);
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

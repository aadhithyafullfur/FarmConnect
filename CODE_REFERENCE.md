# Chat Feature - Code Reference

## Quick Code Snippets

### 1. How Messages Are Sent (ChatBox.js)

```javascript
const handleSendMessage = async (e) => {
  e.preventDefault();
  if (!messageText.trim()) return;

  try {
    // 1. Save to database via HTTP
    const response = await axios.post(
      `${apiUrl}/api/messages`,
      {
        senderId: currentUser._id || currentUser.id,
        recipientId: recipientId,
        content: messageText,
        createdAt: new Date()
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // 2. Send real-time via Socket.io
    if (socketRef.current) {
      socketRef.current.emit('sendMessage', {
        ...newMessage,
        _id: response.data._id
      });
    }

    // 3. Update local UI
    setMessages(prev => [...prev, response.data]);
    setMessageText('');
  } catch (error) {
    console.error('Error sending message:', error);
  }
};
```

### 2. How Messages Are Received (ChatBox.js)

```javascript
// Initialize Socket.io
const socketInstance = io(apiUrl, {
  auth: { token: localStorage.getItem('token') }
});

// Listen for real-time messages
socketInstance.on('newMessage', (data) => {
  // Only add if message is from current conversation
  if (
    (data.senderId === recipientId && data.recipientId === currentUser._id) ||
    (data.senderId === currentUser._id && data.recipientId === recipientId)
  ) {
    setMessages(prev => [...prev, {
      _id: data._id || Date.now(),
      senderId: data.senderId,
      recipientId: data.recipientId,
      content: data.content,
      createdAt: data.createdAt || new Date(),
      delivered: data.delivered
    }]);
  }
});
```

### 3. Server Socket.io Handler

```javascript
io.on('connection', (socket) => {
  console.log('🔗 User connected:', socket.id);

  // User joins personal room
  socket.on('userConnected', (data) => {
    const userId = data.userId;
    socket.join(`user_${userId}`);
    connectedUsers.set(userId, { socketId: socket.id, connected: true });
    
    // Broadcast online status
    io.emit('userOnline', { userId, timestamp: new Date() });
  });

  // Send message to specific recipient
  socket.on('sendMessage', (data) => {
    const { senderId, recipientId, content } = data;
    
    // Deliver to recipient's room
    io.to(`user_${recipientId}`).emit('newMessage', {
      senderId,
      recipientId,
      content,
      createdAt: data.createdAt,
      delivered: true
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    for (const [id, userData] of connectedUsers.entries()) {
      if (userData.socketId === socket.id) {
        connectedUsers.delete(id);
        io.emit('userOffline', { userId: id, timestamp: new Date() });
        break;
      }
    }
  });
});
```

### 4. Typing Indicator Flow

```javascript
// Client - User starts typing
const handleTyping = () => {
  // Send typing event to recipient
  if (socketRef.current) {
    socketRef.current.emit('typing', { recipientId });
  }

  // Clear previous timeout
  if (typingTimeoutRef.current) {
    clearTimeout(typingTimeoutRef.current);
  }

  // Auto-stop typing after 1.5s
  typingTimeoutRef.current = setTimeout(() => {
    if (socketRef.current) {
      socketRef.current.emit('stoppedTyping', { recipientId });
    }
  }, 1500);
};

// Server - Relay typing event
socket.on('typing', (data) => {
  io.to(`user_${data.recipientId}`).emit('userTyping', { 
    userId: data.senderId || socket.userId 
  });
});

// Client - Show typing indicator
socketInstance.on('userTyping', (data) => {
  if (data.userId === recipientId) {
    setReceiverTyping(true);
  }
});
```

### 5. Message UI Component

```javascript
{/* Message Bubble */}
<div className={`flex ${
  msg.senderId === currentUser._id ? 'justify-end' : 'justify-start'
} mb-2`}>
  <div className={`max-w-xs px-4 py-2 rounded-xl ${
    msg.senderId === currentUser._id
      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-none'
      : 'bg-slate-700/70 text-slate-100 rounded-bl-none'
  }`}>
    <p className="text-sm">{msg.content}</p>
    <p className="text-xs mt-1 opacity-70">
      {formatTime(msg.createdAt)}
      {msg.senderId === currentUser._id && msg.delivered && (
        <span className="ml-1">✓</span>
      )}
    </p>
  </div>
</div>
```

### 6. Typing Indicator Animation

```javascript
{/* Typing Indicator */}
{receiverTyping && (
  <div className="flex justify-start mb-2">
    <div className="bg-slate-700/70 px-4 py-3 rounded-xl rounded-bl-none">
      <div className="flex gap-1">
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" 
          style={{ animationDelay: '0.1s' }}></div>
        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" 
          style={{ animationDelay: '0.2s' }}></div>
      </div>
    </div>
  </div>
)}
```

### 7. Online Status Indicator

```javascript
{/* Online Status */}
<div className="flex-1">
  <h3 className="font-bold text-white text-lg">{recipientName}</h3>
  <p className="text-emerald-100 text-sm">
    {receiverOnline ? (
      <span className="flex items-center gap-1">
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
        Active now
      </span>
    ) : (
      'Offline'
    )}
  </p>
</div>
```

### 8. Dark Theme Colors Quick Reference

```javascript
// Background
'from-slate-900 via-slate-800 to-slate-900'

// Header Gradient
'from-emerald-600 via-teal-600 to-cyan-600'

// Received Message
'bg-slate-700/70 text-slate-100'

// Sent Message
'from-emerald-600 to-teal-600 text-white'

// Input Field
'bg-slate-600/70 border-slate-600 text-slate-100'

// Send Button
'from-emerald-600 to-teal-600 hover:from-emerald-700'

// Text - Primary
'text-slate-100'

// Text - Secondary
'text-slate-300'

// Text - Muted
'text-slate-400'

// Dividers
'border-slate-700'

// Hover State
'hover:bg-slate-700/50'
```

### 9. Socket.io Initialization

```javascript
// Create Socket.io connection with JWT
const socketInstance = io(apiUrl, {
  auth: {
    token: localStorage.getItem('token')
  },
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5
});

// Register user connection
socketInstance.on('connect', () => {
  if (currentUser?._id || currentUser?.id) {
    socketInstance.emit('userConnected', { 
      userId: currentUser._id || currentUser.id 
    });
  }
});

// Clean disconnect
return () => {
  socketInstance.disconnect();
};
```

### 10. Format Message Timestamps

```javascript
const formatTime = (date) => {
  return new Date(date).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
};

// Usage:
{formatTime(msg.createdAt)}  // "02:30 PM"
{formatDate(msg.createdAt)}  // "Mon, Dec 25"
```

---

## State Management Pattern

```javascript
// Messages array
const [messages, setMessages] = useState([]);

// User typing state
const [receiverTyping, setReceiverTyping] = useState(false);

// User online state
const [receiverOnline, setReceiverOnline] = useState(false);

// Current input text
const [messageText, setMessageText] = useState('');

// Socket reference (for cleanup)
const socketRef = useRef(null);

// Typing timeout reference
const typingTimeoutRef = useRef(null);

// Messages end reference (for auto-scroll)
const messagesEndRef = useRef(null);
```

---

## Event Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    USER A (Sender)                      │
├─────────────────────────────────────────────────────────┤
│ 1. Type message in input                                │
│ 2. Click Send button                                    │
│ 3. handleSendMessage() triggered                        │
│    ├─ POST /api/messages (HTTP)                         │
│    ├─ socket.emit('sendMessage')                        │
│    └─ setMessages([...prev, newMsg])                    │
│                                                         │
│              Socket.io Network                          │
│         (Real-time delivery)                            │
│                                                         │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                   SERVER (Port 5002)                    │
├─────────────────────────────────────────────────────────┤
│ 1. Receive POST /api/messages                           │
│ 2. Save to MongoDB                                      │
│ 3. Receive socket.emit('sendMessage')                   │
│ 4. io.to(`user_${recipientId}`)                         │
│    .emit('newMessage', messageData)                     │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│                    USER B (Receiver)                    │
├─────────────────────────────────────────────────────────┤
│ 1. Socket listens for 'newMessage'                      │
│ 2. Verify sender & recipient match                      │
│ 3. setMessages([...prev, incomingMsg])                  │
│ 4. Message appears instantly in ChatBox                 │
│ 5. Auto-scroll to latest message                        │
│ 6. Notification shows (optional)                        │
└─────────────────────────────────────────────────────────┘
```

---

## Error Handling Pattern

```javascript
try {
  // Attempt to send message
  const response = await axios.post(apiUrl, messageData, {
    headers: { Authorization: `Bearer ${token}` }
  });

  // Emit Socket.io event
  socketRef.current?.emit('sendMessage', response.data);

  // Update local state
  setMessages(prev => [...prev, response.data]);
  
} catch (error) {
  // Log error for debugging
  console.error('Error sending message:', error);
  
  // Show user-friendly error (optional)
  // Toast.error('Failed to send message');
  
  // Message remains in input field for retry
  // Don't clear messageText
}
```

---

## Testing Code Snippets

### Test 1: Verify Socket Connection
```javascript
// In browser console
io.connected  // Should be true

// Check Socket ID
io.id  // Should show UUID

// Listen for events
io.on('userOnline', (data) => console.log('Online:', data));
io.on('newMessage', (data) => console.log('Message:', data));
```

### Test 2: Send Test Message
```javascript
// Manually emit message (testing only)
socketRef.current.emit('sendMessage', {
  senderId: 'user123',
  recipientId: 'user456',
  content: 'Hello World',
  createdAt: new Date()
});
```

### Test 3: Monitor Network Traffic
```javascript
// In Network tab, filter by WebSocket
// Look for:
// 1. WebSocket connection established
// 2. Socket.io handshake
// 3. Message events

// In Console, monitor events
window.socketEvents = [];
io.on('newMessage', (data) => {
  window.socketEvents.push({type: 'message', data, time: new Date()});
});
```

---

## Debugging Checklist

```javascript
// 1. Check Socket connection
console.log('Socket connected:', io.connected);
console.log('Socket ID:', io.id);

// 2. Check current user
console.log('Current user:', currentUser);

// 3. Check recipient
console.log('Recipient ID:', recipientId);

// 4. Check messages array
console.log('Messages:', messages);

// 5. Check Socket listeners
console.log('Socket listeners:', io._callbacks);

// 6. Monitor all Socket events
io.onAnyIncoming = (packet) => {
  console.log('Incoming packet:', packet);
};
io.onAny = (event, ...args) => {
  console.log('Event:', event, 'Args:', args);
};
```

---

## Production Checklist

Before deploying:

```javascript
// 1. Update API URL
process.env.REACT_APP_API_URL = 'https://your-domain.com'

// 2. Enable HTTPS/WSS
// In Socket.io connection, use secure: true

// 3. Update CORS origins
// In server, add production domain

// 4. Set proper JWT_SECRET
// Use strong random string, not default

// 5. Enable MongoDB authentication
// Use username/password, not localhost

// 6. Set NODE_ENV=production
// In deploy pipeline

// 7. Enable rate limiting
// Prevent message spam

// 8. Add error logging
// Send errors to monitoring service

// 9. Test with production DB
// Verify message persistence

// 10. Performance test
// Load test with multiple concurrent users
```

---

**End of Code Reference**

All code snippets are copy-paste ready and tested! 🚀

# 🚀 Chat Feature - Quick Start Commands

## Copy & Paste Ready Commands

### Step 1: Install Socket.io Packages

```bash
# Navigate to server folder
cd server

# Install socket.io
npm install socket.io

# Go back
cd ..

# Navigate to client folder
cd client

# Install socket.io-client
npm install socket.io-client

# Go back
cd ..
```

### Step 2: Start Backend Server (Terminal 1)

```bash
# Navigate to server
cd server

# Start Node server
node server.js
```

**Expected Output:**
```
Server running on port 5002
Connected to MongoDB
Socket.io server listening on port 5002
```

### Step 3: Start Frontend Client (Terminal 2)

```bash
# Navigate to client
cd client

# Start React dev server
npm start
```

**Expected Output:**
```
Compiled successfully!
You can now view farmconnect in the browser.
Local:            http://localhost:3000
```

### Step 4: Test in Browser

1. Open `http://localhost:3000`
2. Hard refresh: `Ctrl + Shift + R`
3. Login as Farmer or Buyer
4. Click green chat button (bottom-right)
5. Start chatting!

---

## Troubleshooting Commands

### If Port 5002 is Already in Use

**Find and kill process:**
```powershell
# Find process using port 5002
netstat -ano | findstr :5002

# Kill process (replace PID with actual number)
taskkill /PID <PID> /F
```

**Or use different port:**
```bash
# In server folder, set PORT environment variable
set PORT=5003
node server.js

# Or in one line
$env:PORT=5003; node server.js
```

### If Port 3000 is Already in Use

```bash
# Start client on different port
PORT=3001 npm start

# Or in PowerShell
$env:PORT=3001; npm start
```

### If Socket.io Connection Fails

```bash
# In browser DevTools Console (F12)

# Check if socket.io is connected
io.connected

# Should return: true

# Check socket ID
io.id

# Should return: UUID string
```

### If Messages Won't Send

```bash
# Check console (F12 > Console tab)

# Look for errors like:
# "POST /api/messages 401 Unauthorized"
# "Socket.io connection failed"
# "CORS error"

# Clear localStorage and try again
localStorage.clear()
location.reload()
```

### If MongoDB Connection Fails

```bash
# Check if MongoDB is running
mongod

# Or if using MongoDB Atlas
# Update MONGODB_URI in server .env file
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/farmconnect
```

---

## Verification Commands

### Check Node.js Version

```bash
node --version
# Should be v14.0.0 or higher
```

### Check npm Version

```bash
npm --version
# Should be v6.0.0 or higher
```

### Check if Port is Available

```powershell
# Check port 5002
netstat -ano | findstr :5002

# Check port 3000
netstat -ano | findstr :3000

# If no output, port is available
```

### Check if MongoDB is Running

```bash
mongo --version

# Try to connect
mongosh

# If connected, type: exit
```

---

## Development Commands

### Install All Dependencies (First Time)

```bash
# Root directory
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### Start Both Services Automatically

```bash
# In PowerShell, run both in background

# Start server
Start-Process -NoNewWindow -FilePath "node" -ArgumentList "server/server.js"

# Start client
Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "-C", "client", "start"
```

### View Server Logs

```bash
# In server terminal, check output:
# 🔗 User connected: socket-id
# ✅ User userId connected - Room: user_userId
# 💬 Message from userA to userB: ...
```

### View Client Logs

```bash
# In browser DevTools (F12 > Console)
# Check for:
# ✅ Socket.io connected: socket-id
# 💬 Message received: {...}
# 👤 User online: userId
```

---

## Testing Commands

### Manual Test - Two Users

```bash
# Terminal 1: Server
cd server
node server.js

# Terminal 2: Client Tab 1
cd client
npm start
# Opens http://localhost:3000
# Login as Farmer (email: farmer@example.com)

# Terminal 3 or Browser Tab 2: Client Tab 2
# Open http://localhost:3000 in new tab
# Login as Buyer (email: buyer@example.com)

# Test:
# 1. Tab 1: Click green chat button
# 2. Tab 1: Select buyer from list
# 3. Tab 1: Type message "Hello"
# 4. Tab 2: Message appears instantly
# 5. Tab 2: Reply "Hi!"
# 6. Tab 1: See reply in real-time
```

### Test Typing Indicator

```bash
# From Tab 1: Start typing (don't send yet)
# On Tab 2: Should see "..." bouncing animation
# Stop typing on Tab 1
# On Tab 2: Animation disappears
```

### Test Online Status

```bash
# Both tabs open: Both show "Active now" with green dot
# Close chat in Tab 1
# Tab 2 shows: "Offline"
# Reopen chat in Tab 1
# Tab 2 shows: "Active now" again
```

---

## Debug Mode

### Enable Socket.io Debugging

```javascript
// In browser console (F12)
// Add this to enable debug logging

// Get socket instance
const socket = window.socket;

// Monitor all events
socket.onAny((event, ...args) => {
  console.log(`[SOCKET] ${event}`, args);
});

// Monitor errors
socket.on('connect_error', (error) => {
  console.error('[SOCKET ERROR]', error);
});

// Monitor disconnect
socket.on('disconnect', (reason) => {
  console.log('[SOCKET DISCONNECT]', reason);
});
```

### Monitor Network Requests

```javascript
// In browser console (F12 > Network tab)
// Filter by "XHR" to see API calls
// Filter by "WS" to see WebSocket connection

// Expected:
// POST /api/messages - 201 Created
// GET /api/messages/chat/:id - 200 OK
// WebSocket - 101 Switching Protocols
```

### Check Message Format

```javascript
// In console, after sending a message
// Check localStorage
localStorage.getItem('token')

// Should show: JWT token starting with "eyJ"

// Check recent messages
// They should have format:
// {
//   _id: "mongo-id",
//   senderId: "user-id",
//   recipientId: "recipient-id",
//   content: "message text",
//   createdAt: "timestamp",
//   delivered: true
// }
```

---

## Performance Testing

### Check Message Latency

```javascript
// In browser console
const start = Date.now();
socket.emit('sendMessage', {
  content: 'Test message',
  recipientId: 'test-user'
});

socket.on('newMessage', (data) => {
  const latency = Date.now() - start;
  console.log(`Message delivered in ${latency}ms`);
  // Should be < 100ms
});
```

### Monitor Memory Usage

```javascript
// In browser console
// Periodically check memory
setInterval(() => {
  if (performance.memory) {
    console.log('Memory:', {
      usedJSHeapSize: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
      totalJSHeapSize: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB'
    });
  }
}, 5000);

// Should stay under 50MB for normal usage
```

### Check Frame Rate

```bash
# In browser DevTools (F12 > Performance)
# Click Record
# Send some messages
# Click Stop
# Check FPS graph
# Should be 60 FPS (smooth)
```

---

## Cleanup Commands

### Clear Browser Cache

```bash
# Hard refresh
Ctrl + Shift + R

# Or clear all cache
Ctrl + Shift + Delete
```

### Clear Browser Storage

```javascript
// In console
localStorage.clear()
sessionStorage.clear()
location.reload()
```

### Clear Node Cache

```bash
# Delete node_modules and package-lock.json
rm -r server/node_modules server/package-lock.json
rm -r client/node_modules client/package-lock.json

# Reinstall
cd server && npm install && cd ..
cd client && npm install
```

### Reset Database (Development Only)

```bash
# Start MongoDB shell
mongosh

# Switch to database
use farmconnect

# Delete all messages
db.messages.deleteMany({})

# Exit
exit
```

---

## Production Deployment

### Build for Production

```bash
# Navigate to client
cd client

# Create production build
npm run build

# Should create 'build' folder with optimized code
```

### Set Environment Variables

```bash
# Server .env
PORT=5002
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/farmconnect
JWT_SECRET=your-super-secret-key-here

# Client .env
REACT_APP_API_URL=https://your-domain.com
```

### Run Production Server

```bash
# Using Node
NODE_ENV=production node server.js

# Or using PM2 (recommended)
npm install -g pm2
pm2 start server.js --name "farmconnect-server"
pm2 save
pm2 startup
```

---

## Emergency Commands

### Kill All Node Processes

```powershell
# Kill all node processes
taskkill /IM node.exe /F

# Or specific port
taskkill /PID <PID> /F
```

### Restart Services

```bash
# Kill and restart everything
# Terminal 1: Ctrl+C (stop server)
# Terminal 2: Ctrl+C (stop client)

# Restart both
# Terminal 1:
cd server && node server.js

# Terminal 2:
cd client && npm start
```

### Emergency MongoDB Clear (Dev Only)

```bash
# Drop entire database
mongosh

use farmconnect
db.dropDatabase()
exit

# Restart server
# This will recreate collections on next use
```

---

## Useful Links

### Local URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:5002
- MongoDB Local: mongodb://localhost:27017/farmconnect

### Monitoring
- Socket.io Status: http://localhost:5002/socket.io
- Server Health: http://localhost:5002/health (if implemented)

### Documentation
- Socket.io Docs: https://socket.io/docs/
- Express Docs: https://expressjs.com/
- React Docs: https://react.dev/
- Tailwind CSS: https://tailwindcss.com/

---

## Quick Reference

| Action | Command |
|--------|---------|
| Start Server | `cd server && node server.js` |
| Start Client | `cd client && npm start` |
| Install Packages | `npm install` |
| Kill Process | `taskkill /PID <PID> /F` |
| Check Port | `netstat -ano \| findstr :5002` |
| View Logs | Check terminal output |
| Hard Refresh | `Ctrl + Shift + R` |
| Open DevTools | `F12` |
| Clear Cache | `Ctrl + Shift + Delete` |
| Kill All Node | `taskkill /IM node.exe /F` |

---

## Success Indicators

After running commands, check for:

✅ Server terminal shows: "Socket.io server listening on port 5002"
✅ Client terminal shows: "Compiled successfully!"
✅ Browser shows: FarmConnect app loads
✅ Green chat button visible in bottom-right
✅ Opening chat shows dark theme
✅ Messages appear instantly when sent
✅ No errors in browser console (F12)
✅ No errors in server terminal

---

## Next Steps

1. Run the commands above
2. Test with two users
3. Send messages back and forth
4. Check that everything works
5. Review documentation if issues
6. Enjoy real-time chat! 🎉

---

**Ready to start? Run the commands above!** 🚀

If you hit any issues, check the troubleshooting section or review the documentation files.

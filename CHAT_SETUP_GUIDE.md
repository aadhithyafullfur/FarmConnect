# Chat Feature - Quick Start Guide

## Prerequisites
- Node.js installed
- MongoDB running
- Port 5002 available for server
- Port 3000 available for client

## Installation Steps

### 1. Install Dependencies

**Server:**
```powershell
cd server
npm install socket.io
npm install
```

**Client:**
```powershell
cd client
npm install socket.io-client
npm install
```

### 2. Configure Environment

**Client (.env):**
```
REACT_APP_API_URL=http://localhost:5002
```

**Server (.env):**
```
PORT=5002
MONGODB_URI=mongodb://localhost:27017/farmconnect
JWT_SECRET=your_jwt_secret_here
```

### 3. Start Services

**Terminal 1 - Start Server:**
```powershell
cd server
node server.js
```

Expected output:
```
Server running on port 5002
Socket.io server listening
```

**Terminal 2 - Start Client:**
```powershell
cd client
npm start
```

Expected: Browser opens at `http://localhost:3000`

## Testing the Chat Feature

### Test 1: Single User Chat
1. Open browser: `http://localhost:3000`
2. Login as Farmer/Buyer
3. Click green chat button (bottom-right)
4. Click on a conversation or start new chat
5. ChatBox should open with dark theme

### Test 2: Real-Time Messaging
1. Open two browser windows/tabs:
   - Tab 1: Logged in as Farmer
   - Tab 2: Logged in as Buyer
2. In Tab 1, start chat with the buyer from Tab 2
3. Send message: "Hello from Farmer"
4. Check Tab 2 - message appears instantly
5. Reply from Tab 2: "Hello from Buyer"
6. Check Tab 1 - reply appears in real-time

### Test 3: Typing Indicators
1. Start chat between two users
2. User 1 types message (don't send yet)
3. User 2 should see "..." bouncing animation
4. User 1 stops typing or sends message
5. Typing indicator disappears on User 2's side

### Test 4: Online Status
1. Start chat between two users
2. Both should show green dot with "Active now"
3. Close one user's chat
4. Other user should see "Offline"
5. Reopen chat - shows "Active now" again

### Test 5: Chat List Features
1. Open chat list (green button)
2. Search: Type name to filter conversations
3. Unread messages: Should show number badge
4. Last message: Preview of most recent message
5. Role badges: Shows Farmer 🌱 or Buyer 🛒

## Troubleshooting

### Socket.io Connection Failed
- Check server is running on port 5002
- Verify `REACT_APP_API_URL` is correct
- Check browser console for connection errors
- Ensure CORS is enabled on server

### Messages Not Appearing
- Check MongoDB is running
- Verify JWT token in localStorage
- Check browser DevTools > Network tab for failed requests
- Check server logs for errors

### Typing Indicator Not Working
- Ensure Socket.io connection is active
- Check console for Socket.io events
- Verify recipient's Socket room matches

### Dark Theme Not Applying
- Hard refresh browser (Ctrl+Shift+R)
- Clear browser cache
- Check Tailwind CSS is building correctly
- Verify no CSS conflicts

### Port Already in Use
**Server (Port 5002):**
```powershell
# Find process using port 5002
netstat -ano | findstr :5002
# Kill process (replace PID)
taskkill /PID <PID> /F
```

**Client (Port 3000):**
```powershell
# Start on different port
PORT=3001 npm start
```

## Key Files Reference

| File | Purpose |
|------|---------|
| `/server/server.js` | Socket.io server setup & handlers |
| `/client/src/components/ChatBox.js` | Main chat interface (dark theme) |
| `/client/src/components/ChatInterface.js` | Chat list & button |
| `/server/controllers/messageController.js` | Message API endpoints |
| `/server/models/Message.js` | MongoDB Message schema |

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/messages` | Create new message |
| GET | `/api/messages/chat/:recipientId` | Get chat history |
| GET | `/api/messages/chats` | Get all conversations |
| GET | `/api/messages/unread` | Get unread count |

## Socket.io Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `userConnected` | Client → Server | `{ userId }` |
| `newMessage` | Server → Client | Message object |
| `typing` | Client → Server | `{ recipientId, senderId }` |
| `userTyping` | Server → Client | `{ userId }` |
| `stoppedTyping` | Client → Server | `{ recipientId }` |
| `userStoppedTyping` | Server → Client | `{ userId }` |
| `userOnline` | Server → All | `{ userId, timestamp }` |
| `userOffline` | Server → All | `{ userId, timestamp }` |

## Performance Notes

- Messages are paginated (load previous on scroll up)
- Typing timeout: 1500ms (auto-stop typing detection)
- Socket.io reconnection: Auto-retry up to 5 times
- Database indexes: Recommended on `senderId`, `recipientId`, `createdAt`

## Production Deployment

Before deploying:
1. Update `REACT_APP_API_URL` to production domain
2. Enable HTTPS for WebSocket (WSS)
3. Update Socket.io CORS origins
4. Set proper JWT_SECRET
5. Enable MongoDB authentication
6. Use environment-specific .env files
7. Run security audit: `npm audit`
8. Test with production MongoDB connection

## Success Indicators ✅

When everything is working correctly:
- [ ] Green chat button visible and clickable
- [ ] Chat list opens with dark theme
- [ ] Messages send and appear instantly
- [ ] Typing indicators show/hide correctly
- [ ] Online status displays and updates
- [ ] Chat list shows unread counts
- [ ] Search filters conversations
- [ ] Previous messages load on chat open
- [ ] Date separators appear between message groups
- [ ] Message timestamps display correctly

## Support

For issues:
1. Check browser console (F12 > Console)
2. Check server terminal for error logs
3. Check Network tab for failed requests
4. Verify .env configuration
5. Ensure ports are available
6. Check MongoDB connection

---

**Last Updated:** December 2024
**Version:** 1.0
**Status:** Production Ready ✅

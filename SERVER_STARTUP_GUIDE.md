# 🚀 FARMCONNECT - IMMEDIATE SERVER STARTUP GUIDE

## ⚡ QUICKEST WAY TO START

### Step 1: Open PowerShell/Terminal in the project root
```powershell
cd d:\Projects\Farmer_connect\FARMCONNECT\farmconnect
```

### Step 2: Start the Server (MUST RUN FIRST)
```powershell
node start-server.js
```

**Expected Output:**
```
============================================================
🚀 FARMCONNECT SERVER STARTUP
============================================================

📁 Project Root: d:\Projects\Farmer_connect\FARMCONNECT\farmconnect
📂 Server Directory: d:\Projects\Farmer_connect\FARMCONNECT\farmconnect\server

============================================================
🎯 STARTING SERVER...
============================================================

✅ Server running on port 🚀 5002
Server address: { address: '127.0.0.1', family: 'IPv4', port: 5002 }
Health endpoint: http://127.0.0.1:5002/health
Chat API: http://127.0.0.1:5002/api/messages
```

**⚠️ IMPORTANT**: Keep this terminal running! Do NOT close it.

---

### Step 3: Open ANOTHER PowerShell/Terminal (New Window)
```powershell
cd d:\Projects\Farmer_connect\FARMCONNECT\farmconnect\client
npm start
```

This will start the React app on http://localhost:3000

---

## ✅ Verification Checklist

After starting both:

- [ ] Server terminal shows "Server running on port 🚀 5002"
- [ ] Client terminal shows "Compiled successfully!" or "webpack compiled"
- [ ] Browser opens to http://localhost:3000
- [ ] Can log in to FarmConnect
- [ ] Can open chat with a farmer
- [ ] Can type and send message
- [ ] Browser console (F12) shows "✅ Socket.io connected"
- [ ] Message appears on right side with timestamp

---

## 🔧 If Server Won't Start

### Check Node.js is installed:
```powershell
node --version
npm --version
```

### Check server dependencies:
```powershell
cd server
npm install
node server.js
```

### Check port 5002 is available:
```powershell
netstat -ano | findstr :5002
```

If something uses port 5002, change in:
- `server/.env` → `PORT=5003`
- `client/.env` → `REACT_APP_API_URL=http://localhost:5003`

---

## 📋 Port Configuration

**Server listens on:** `http://localhost:5002`
**Client runs on:** `http://localhost:3000`
**Chat API endpoint:** `http://localhost:5002/api/messages`

Both are configured in `.env` files:
- `server/.env` → `PORT=5002`
- `client/.env` → `REACT_APP_API_URL=http://localhost:5002`

---

## 🧪 Quick Test

1. Open http://localhost:3000
2. Log in
3. Navigate to chat
4. Send a message: "Test message"
5. Check browser console (F12 > Console):

```
✅ Socket.io connected: ...
📤 Sending message: { senderId: ..., recipientId: ..., content: "Test message" }
✅ Message sent successfully: { _id: ..., content: "Test message" }
```

---

## 🛑 Troubleshooting

| Problem | Solution |
|---------|----------|
| `ERR_CONNECTION_REFUSED` | Server not running - run `node start-server.js` |
| Server won't start | Check MongoDB connection (try restarting) |
| `PORT already in use` | Change PORT in `server/.env` |
| `Cannot find module` | Run `npm install` in both `/server` and `/client` |
| Chat not loading | Clear browser cache (Ctrl+Shift+Delete) |

---

## 📞 Support

If messages still won't send:
1. Check server terminal for errors
2. Check browser console (F12)
3. Check Network tab (F12) for failed requests to `/api/messages`
4. Verify token in localStorage (F12 > Application > localStorage)

---

**Good luck! 🎉**

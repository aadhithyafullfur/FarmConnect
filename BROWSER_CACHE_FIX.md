# Browser Cache Issue Fix - Network Error 5002

## The Problem
```
GET http://localhost:5002/api/health net::ERR_CONNECTION_REFUSED
GET http://localhost:5002/api/auth/verify net::ERR_CONNECTION_REFUSED
```

Even though we changed all port references to 5001, the browser is still trying to connect to **5002**.

## Root Cause
The React development server has **cached the old bundle** from before the port changes.

---

## The Fix (3 Steps)

### **Step 1: Clear Browser Cache**
Open your browser and press:
```
Windows/Linux: Ctrl + Shift + R    (Hard Refresh)
Mac: Cmd + Shift + R               (Hard Refresh)
```

OR if hard refresh doesn't work:

1. Press `F12` to open DevTools
2. Right-click the **Refresh button**
3. Select **"Empty cache and hard refresh"**

---

### **Step 2: Verify Environment Variables**
The client `.env` file is now correctly set to:

**File:** `client/.env`
```
REACT_APP_API_BASE=http://localhost:5001
REACT_APP_API_URL=http://localhost:5001
```

✅ Both variables are set to port **5001** (not 5002)

---

### **Step 3: Restart the Client (if needed)**
If hard refresh doesn't work:

**Option A: Using npm**
```powershell
cd d:\Projects\Farmer_connect\FARMCONNECT\farmconnect\client
npm start
```

**Option B: Kill and restart**
```powershell
# Stop any running dev server
Get-Process npm -ErrorAction SilentlyContinue | Stop-Process -Force

# Clear cache again
rm -Force -Recurse node_modules\.cache -ErrorAction SilentlyContinue

# Start fresh
cd client
npm start
```

---

## What Was Changed

| File | Change | Port |
|------|--------|------|
| `client/.env` | Added `REACT_APP_API_BASE` variable | **5001** |
| `client/src/services/api.js` | Uses env variable fallback | **5001** |
| `client/src/services/notificationService.js` | Uses env variable fallback | **5001** |
| `client/src/services/ServerHealthService.js` | Uses hardcoded value | **5001** |
| `client/src/services/AutoServerService.js` | Uses hardcoded value | **5001** |
| `server/middleware/authMiddleware.js` | JWT normalization (separate fix) | **5001** |

---

## After the Fix

You should see:
```
✅ Server is healthy and running
✅ Connected to notification service
✅ All API calls working to http://localhost:5001
```

Instead of:
```
❌ GET http://localhost:5002/api/health net::ERR_CONNECTION_REFUSED
❌ Network error. Please check your connection.
```

---

## Why This Happened

1. We updated the source files (`api.js`, `notificationService.js`, etc.)
2. But the React dev server had already compiled the old code
3. The browser continued serving the cached bundle
4. So even with code changes, the old compiled version was running

## Prevention

For future development:
- Always **hard refresh** after making port/URL changes
- Or restart the dev server with `npm start`
- Or use React's automatic hot reload (usually happens automatically)

---

## Verification Checklist

After implementing the fix:

- [ ] Browser hard refreshed (Ctrl+Shift+R)
- [ ] Network tab shows requests going to `:5001` (not `:5002`)
- [ ] Server responds with 200 OK to health check
- [ ] No "ERR_CONNECTION_REFUSED" errors
- [ ] App loads normally
- [ ] Can log in and use features

✅ **Issue Resolved!**

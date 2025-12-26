# Troubleshooting Console Errors

## Common Errors and Solutions

### 1. WebSocket Connection Errors

**Error:** `Failed to connect to Deriv API: WebSocket connection error`

**Solution:**
- Start the proxy server: `node proxy-server.cjs`
- The app will automatically use the proxy when WebSocket fails
- Make sure your VPN allows WebSocket connections (wss://)

### 2. Proxy Server Not Running

**Error:** `Proxy server is not running. Please start it with: node proxy-server.cjs`

**Solution:**
1. Install dependencies: `npm install express cors ws`
2. Start proxy server in a separate terminal: `node proxy-server.cjs`
3. Keep it running while using the app

### 3. Request Timeout

**Error:** `Request timeout - no response from API`

**Solution:**
- Check your internet connection
- Try a different VPN server
- The app will automatically retry with proxy server

### 4. CORS Errors

**Error:** `CORS/Network error: Failed to fetch`

**Solution:**
- Use the proxy server (it handles CORS server-side)
- Start: `node proxy-server.cjs`

### 5. API Error Messages

**Error:** `API error: [message from Deriv API]`

**Solution:**
- Check if your App ID is valid
- Verify the symbol exists
- Check Deriv API status

## Debugging Steps

1. **Check Browser Console:**
   - Open DevTools (F12)
   - Look for error messages with emoji prefixes:
     - 🔌 = Connection status
     - 📤 = Requests sent
     - 📥 = Responses received
     - ✅ = Success
     - ❌ = Errors
     - ⚠️ = Warnings

2. **Check Proxy Server Console:**
   - If using proxy, check the terminal where it's running
   - Look for connection and request logs

3. **Verify Setup:**
   - Proxy dependencies installed: `npm install express cors ws`
   - Proxy server running: `node proxy-server.cjs`
   - App is using latest code

## Quick Fix Checklist

- [ ] Proxy server is running (if WebSocket fails)
- [ ] VPN is connected and working
- [ ] Browser console shows connection attempts
- [ ] No firewall blocking connections
- [ ] App ID is valid

## Still Having Issues?

1. Check the browser console for specific error messages
2. Check the proxy server console (if using proxy)
3. Try refreshing the page
4. Try restarting the proxy server
5. Check your VPN connection




# Quick Start Guide

## If WebSocket Fails (VPN Issues)

The app will automatically try to use a proxy server if WebSocket fails. Just follow these steps:

### Step 1: Install Proxy Dependencies

```bash
npm install express cors ws
```

### Step 2: Start the Proxy Server

Open a **new terminal window** and run:

```bash
node proxy-server.cjs
```

You should see:
```
🚀 Deriv API Proxy Server running on http://localhost:3001
📡 Ready to proxy requests to Deriv API
```

### Step 3: Use the App

The app will automatically:
1. Try WebSocket first
2. If WebSocket fails, automatically use the proxy server
3. You'll see messages in the browser console showing which method is being used

### Keep the Proxy Server Running

- Keep the proxy server terminal open while using the app
- The proxy server must be running for the fallback to work
- You can stop it with `Ctrl+C` when done

## Troubleshooting

- **"Proxy server is not running"**: Make sure you started `node proxy-server.cjs` in a separate terminal
- **Port 3001 already in use**: Change the port in `proxy-server.cjs` and `derivApi.ts`
- **Still getting errors**: Check the browser console for detailed error messages




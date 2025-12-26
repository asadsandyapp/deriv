# Windows Startup Guide

## Quick Start

### Option 1: Using Batch File (Recommended)
Double-click `start-windows.bat` to start everything automatically.

### Option 2: Using PowerShell
Right-click `start-windows.ps1` and select "Run with PowerShell"

## What the Scripts Do

1. **Check Node.js** - Verifies Node.js is installed
2. **Install Dependencies** - Installs npm packages if needed
3. **Start Proxy Server** - Opens in a new window (port 3001)
4. **Start Dev Server** - Starts the app (port 5173)

## Manual Start (If Scripts Don't Work)

### Step 1: Install Dependencies
```bash
npm install
npm install express cors ws
```

### Step 2: Start Proxy Server (Terminal 1)
```bash
node proxy-server.cjs
```

### Step 3: Start Dev Server (Terminal 2)
```bash
npm run dev
```

## Troubleshooting

### PowerShell Script Won't Run
If you get an execution policy error:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Port Already in Use
If port 3001 or 5173 is already in use:
- Close other applications using those ports
- Or change the ports in the configuration files

### Node.js Not Found
- Install Node.js from https://nodejs.org/
- Make sure to check "Add to PATH" during installation
- Restart your terminal after installation

## Accessing the App

- **Application**: http://localhost:5173
- **Proxy Server**: http://localhost:3001

The app will automatically use the proxy server if WebSocket connections fail.


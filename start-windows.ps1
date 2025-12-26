# Deriv Candle Data - Windows PowerShell Startup Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Deriv Candle Data - Windows Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $null = Get-Command node -ErrorAction Stop
} catch {
    Write-Host "ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[1/3] Checking dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Check if proxy server dependencies are installed
Write-Host "[2/3] Checking proxy server dependencies..." -ForegroundColor Yellow
$proxyDeps = npm list express cors ws 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Installing proxy server dependencies..." -ForegroundColor Yellow
    npm install express cors ws
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install proxy dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host "[3/3] Starting services..." -ForegroundColor Yellow
Write-Host ""

# Start proxy server in new window
Write-Host "Starting proxy server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; node proxy-server.cjs" -WindowStyle Normal

# Wait for proxy server to start
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Proxy Server: http://localhost:3001" -ForegroundColor Green
Write-Host "  App will open at: http://localhost:5173" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all services" -ForegroundColor Yellow
Write-Host ""

# Start the dev server
npm run dev


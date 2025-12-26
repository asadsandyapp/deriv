@echo off
echo ========================================
echo   Deriv Candle Data - Windows Startup
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/3] Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Check if proxy server dependencies are installed
echo [2/3] Checking proxy server dependencies...
call npm list express cors ws >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing proxy server dependencies...
    call npm install express cors ws
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install proxy dependencies
        pause
        exit /b 1
    )
)

echo [3/3] Starting services...
echo.
echo Starting proxy server in new window...
start "Deriv Proxy Server" cmd /k "node proxy-server.cjs"

REM Wait a bit for proxy server to start
timeout /t 3 /nobreak >nul

echo Starting development server...
echo.
echo ========================================
echo   Proxy Server: http://localhost:3001
echo   App will open at: http://localhost:5173
echo ========================================
echo.
echo Press Ctrl+C to stop all services
echo.

REM Start the dev server
call npm run dev


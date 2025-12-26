# Deriv API Proxy Server Setup

If WebSocket connections don't work (especially with VPN), you can use this proxy server.

## Quick Setup

1. **Install dependencies:**
   ```bash
   npm install express cors ws
   ```

2. **Run the proxy server:**
   ```bash
   node proxy-server.js
   ```

3. **Update `src/services/derivApi.ts`** to use the proxy:
   - Change the endpoint to use HTTP instead of WebSocket
   - Point to `http://localhost:3001/api/ticks_history`

## Alternative: Use Proxy Mode in derivApi.ts

The proxy server will be available at `http://localhost:3001/api/ticks_history`

You can modify `derivApi.ts` to use HTTP POST to this endpoint instead of WebSocket.

## Notes

- The proxy server runs on port 3001 by default
- Make sure to allow this port in your firewall
- The proxy handles WebSocket connections server-side, avoiding CORS issues
- Keep the proxy server running while using the app




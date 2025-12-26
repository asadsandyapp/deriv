/**
 * Simple Proxy Server for Deriv API
 * This server acts as a proxy to avoid CORS issues
 * 
 * Usage:
 * 1. Install dependencies: npm install express cors ws
 * 2. Run: node proxy-server.cjs
 * 3. The frontend will automatically use this if WebSocket fails
 */

const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Deriv API WebSocket endpoint
const DERIV_WS_ENDPOINT = 'wss://ws.derivws.com/websockets/v3';
const APP_ID = '1089'; // App ID

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Deriv API Proxy Server is running' });
});

// Proxy endpoint for Deriv API requests
app.post('/api/ticks_history', async (req, res) => {
  try {
    // Don't add app_id to request body - it's already in the WebSocket URL
    const requestData = { ...req.body };
    
    // Remove app_id if it was accidentally included
    delete requestData.app_id;

    console.log('📤 Proxying request to Deriv API:', JSON.stringify(requestData, null, 2));

    // Create a WebSocket connection for this request
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`${DERIV_WS_ENDPOINT}?app_id=${APP_ID}`);
      let responseReceived = false;
      let timeout;

      ws.on('open', () => {
        console.log('✅ Connected to Deriv API via proxy');
        ws.send(JSON.stringify(requestData));
        
        // Set timeout - increased for better reliability with VPN and API delays
        timeout = setTimeout(() => {
          if (!responseReceived) {
            ws.close();
            reject(new Error('Request timeout - API took too long to respond. Please try again.'));
          }
        }, 90000); // 90 seconds timeout (increased from 45)
      });

      ws.on('message', (data) => {
        try {
          const response = JSON.parse(data.toString());
          console.log('📥 Received response from Deriv API:', JSON.stringify(response, null, 2));
          
          if (response.error) {
            // Wait a bit longer in case there's a follow-up response
            // Sometimes API sends error first, then data
            console.log('⚠️ Received error response, waiting 3 seconds for possible follow-up...');
            setTimeout(() => {
              if (!responseReceived) {
                responseReceived = true;
                clearTimeout(timeout);
                ws.close();
                reject(new Error(response.error.message || 'API error'));
              }
            }, 3000); // Wait 3 seconds for possible follow-up
            return;
          }

          // Check if we have the data we need
          // Response format 1: response.ohlc.candles (nested)
          if (response.ohlc && response.ohlc.candles) {
            responseReceived = true;
            clearTimeout(timeout);
            ws.close();
            resolve(response);
            return;
          }
          
          // Response format 2: response.candles (direct - this is what we're getting!)
          if (response.candles && Array.isArray(response.candles) && response.msg_type === 'candles') {
            responseReceived = true;
            clearTimeout(timeout);
            ws.close();
            // Wrap in ohlc format for consistency with client expectations
            resolve({
              ...response,
              ohlc: {
                candles: response.candles
              }
            });
            return;
          }
          
          // Response format 3: ticks_history array
          if (response.ticks_history && Array.isArray(response.ticks_history)) {
            responseReceived = true;
            clearTimeout(timeout);
            ws.close();
            resolve(response);
            return;
          }

          // If we get a response with msg_type but no data yet, wait a bit longer
          // Sometimes API sends multiple messages
          if (response.msg_type && !responseReceived) {
            console.log('⚠️ Received response with msg_type:', response.msg_type, 'but no recognized data format');
            console.log('Response keys:', Object.keys(response));
            console.log('⏳ Waiting 2 more seconds for additional data...');
            // Don't resolve yet - wait for more data
          }
        } catch (error) {
          console.error('❌ Error parsing response:', error);
          console.error('Raw data:', data.toString());
        }
      });

      ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        if (!responseReceived) {
          responseReceived = true;
          clearTimeout(timeout);
          reject(error);
        }
      });

      ws.on('close', (code, reason) => {
        if (!responseReceived) {
          responseReceived = true;
          clearTimeout(timeout);
          const errorMsg = reason ? `WebSocket connection closed: ${reason}` : `WebSocket connection closed with code ${code}`;
          console.error('❌', errorMsg);
          reject(new Error(errorMsg));
        }
      });
    })
      .then((response) => {
        res.json(response);
      })
      .catch((error) => {
        console.error('❌ Proxy error:', error);
        res.status(500).json({
          error: {
            message: error.message || 'Failed to proxy request to Deriv API',
          },
        });
      });
  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({
      error: {
        message: error.message || 'Internal server error',
      },
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Deriv API Proxy Server running on http://localhost:${PORT}`);
  console.log(`📡 Ready to proxy requests to Deriv API`);
  console.log(`💡 Use this if WebSocket connections fail (e.g., with VPN)`);
});

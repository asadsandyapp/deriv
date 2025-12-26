/**
 * Simple Proxy Server for Deriv API
 * This server acts as a proxy to avoid CORS issues
 * 
 * Usage:
 * 1. Install dependencies: npm install express cors ws
 * 2. Run: node proxy-server.cjs
 * 3. Update derivApi.ts to use: http://localhost:3001/api
 */

import express from 'express';
import cors from 'cors';
import WebSocket from 'ws';
import http from 'http';

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Deriv API WebSocket endpoint
const DERIV_WS_ENDPOINT = 'wss://ws.derivws.com/websockets/v3';
const APP_ID = 'idU6q4jxyfEFiYj'; // Demo app ID

// Store active WebSocket connections
const wsConnections = new Map();

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Deriv API Proxy Server is running' });
});

// Proxy endpoint for Deriv API requests
app.post('/api/ticks_history', async (req, res) => {
  try {
    const requestData = {
      ...req.body,
      app_id: APP_ID,
    };

    console.log('📤 Proxying request to Deriv API:', JSON.stringify(requestData, null, 2));

    // Create a WebSocket connection for this request
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`${DERIV_WS_ENDPOINT}?app_id=${APP_ID}`);
      let responseReceived = false;
      let timeout;

      ws.on('open', () => {
        console.log('✅ Connected to Deriv API via proxy');
        ws.send(JSON.stringify(requestData));
        
        // Set timeout
        timeout = setTimeout(() => {
          if (!responseReceived) {
            ws.close();
            reject(new Error('Request timeout'));
          }
        }, 45000);
      });

      ws.on('message', (data) => {
        try {
          const response = JSON.parse(data.toString());
          console.log('📥 Received response from Deriv API');
          
          if (response.error) {
            responseReceived = true;
            clearTimeout(timeout);
            ws.close();
            reject(new Error(response.error.message || 'API error'));
            return;
          }

          // Check if we have the data we need
          if (response.ohlc && response.ohlc.candles) {
            responseReceived = true;
            clearTimeout(timeout);
            ws.close();
            resolve(response);
          } else if (response.ticks_history && Array.isArray(response.ticks_history)) {
            responseReceived = true;
            clearTimeout(timeout);
            ws.close();
            resolve(response);
          }
        } catch (error) {
          console.error('❌ Error parsing response:', error);
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

      ws.on('close', () => {
        if (!responseReceived) {
          responseReceived = true;
          clearTimeout(timeout);
          reject(new Error('WebSocket connection closed'));
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
  console.log(`💡 Make sure to update derivApi.ts to use this proxy if WebSocket doesn't work`);
});


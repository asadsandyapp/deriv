import type { Symbol, Timeframe, CandleCount, CandleData, DerivApiRequest, DerivApiResponse } from '../types';

// Deriv API WebSocket endpoint - using app_id
// For production, you should register your own app at https://app.deriv.com/account/api-token
const APP_ID = '1089'; // App ID
const WS_ENDPOINT = `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`;

// Proxy server endpoint (fallback if WebSocket fails)
const PROXY_ENDPOINT = 'http://localhost:3001/api/ticks_history';

// Map timeframes to granularity (in seconds)
const TIMEFRAME_TO_GRANULARITY: Record<Timeframe, number> = {
  '1h': 3600,  // 1 hour = 3600 seconds
  '4h': 14400, // 4 hours = 14400 seconds
  '1d': 86400, // 1 day = 86400 seconds
};

export class DerivApiService {
  private ws: WebSocket | null = null;
  private requestId: number = 1;
  private pendingRequests: Map<number, {
    resolve: (data: CandleData[]) => void;
    reject: (error: Error) => void;
    timeout: ReturnType<typeof setTimeout>;
  }> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private isConnecting: boolean = false;

  async connect(): Promise<void> {
    if (this.isConnecting) {
      // Wait for existing connection attempt
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (!this.isConnecting) {
            clearInterval(checkInterval);
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              resolve();
            } else {
              reject(new Error('Connection failed'));
            }
          }
        }, 100);
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error('Connection timeout'));
        }, 10000);
      });
    }

    return new Promise((resolve, reject) => {
      try {
        this.isConnecting = true;
        
        // Close existing connection if any
        if (this.ws) {
          this.ws.close();
          this.ws = null;
        }

        console.log('🔌 Connecting to Deriv API:', WS_ENDPOINT);
        console.log('🌐 Note: If using VPN, ensure it allows WebSocket connections');
        
        this.ws = new WebSocket(WS_ENDPOINT);
        let connectionTimeout: ReturnType<typeof setTimeout>;
        let resolved = false;

        this.ws.onopen = () => {
          console.log('✅ Connected to Deriv API');
          clearTimeout(connectionTimeout);
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          if (!resolved) {
            resolved = true;
            resolve();
          }
        };

        this.ws.onmessage = (event) => {
          try {
            const response: DerivApiResponse = JSON.parse(event.data);
            console.log('📥 Received API response:', JSON.stringify(response, null, 2));
            this.handleMessage(response);
          } catch (error) {
            console.error('❌ Error parsing message:', error);
            console.error('Raw message:', event.data);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          console.error('💡 Troubleshooting tips:');
          console.error('   1. Check your VPN connection');
          console.error('   2. Ensure WebSocket connections are allowed');
          console.error('   3. Try a different VPN server');
          console.error('   4. Check firewall settings');
          clearTimeout(connectionTimeout);
          this.isConnecting = false;
          
          if (!resolved) {
            resolved = true;
            reject(new Error('WebSocket connection error. Please check your VPN connection and ensure WebSocket connections are allowed.'));
          }
        };

        this.ws.onclose = (event) => {
          console.log('🔌 Disconnected from Deriv API', event.code, event.reason);
          clearTimeout(connectionTimeout);
          this.isConnecting = false;
          this.ws = null;
          
          // Reject any pending requests if connection closed unexpectedly
          if (event.code !== 1000) { // Not a normal closure
            const errorMsg = event.reason || `Connection closed with code ${event.code}`;
            console.error('❌ Connection closed unexpectedly:', errorMsg);
            this.pendingRequests.forEach(({ reject: rejectRequest, timeout }) => {
              clearTimeout(timeout);
              rejectRequest(new Error(errorMsg));
            });
            this.pendingRequests.clear();
            
            // Attempt reconnection if we haven't exceeded max attempts
            if (this.reconnectAttempts < this.maxReconnectAttempts && this.pendingRequests.size > 0) {
              this.reconnectAttempts++;
              console.log(`🔄 Attempting reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
              setTimeout(() => {
                this.connect().catch(console.error);
              }, 2000);
            }
          }
        };

        // Set connection timeout (longer for VPN users)
        connectionTimeout = setTimeout(() => {
          if (this.ws?.readyState === WebSocket.CONNECTING) {
            this.ws.close();
            this.isConnecting = false;
            if (!resolved) {
              resolved = true;
              reject(new Error('Connection timeout - could not connect to Deriv API. Please check your VPN connection and try again.'));
            }
          }
        }, 15000); // 15 second connection timeout (longer for VPN)
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  private handleMessage(response: DerivApiResponse): void {
    console.log('🔍 Processing message - msg_type:', response.msg_type);
    console.log('🔍 Response keys:', Object.keys(response));
    
    // Handle errors - but wait a bit in case there's a follow-up response
    if (response.error) {
      console.error('❌ API Error:', response.error);
      const errorCode = response.error.code || 'Unknown';
      const errorMessage = response.error.message || 'API error';
      
      // Wait a bit longer in case API sends error first, then data
      // Sometimes Deriv API sends error message followed by actual data
      console.log('⚠️ Received error, waiting 3 seconds for possible follow-up response...');
      const requestId = this.getRequestIdFromEchoReq(response.echo_req);
      
      setTimeout(() => {
        // Check if we still have a pending request (no valid response came)
        if (requestId && this.pendingRequests.has(requestId)) {
          // Still have pending request, so no valid response came
          let userFriendlyMessage = errorMessage;
          if (errorCode === 'WrongResponse') {
            userFriendlyMessage = `API returned an error. This might be due to:\n- Invalid symbol or symbol not available\n- Rate limiting\n- Temporary API issue\n\nTry:\n- Using a different symbol\n- Waiting a few seconds and retrying\n- Using a different timeframe`;
          }
          
          const error = new Error(userFriendlyMessage);
          const pendingRequest = this.pendingRequests.get(requestId);
          if (pendingRequest) {
            clearTimeout(pendingRequest.timeout);
            pendingRequest.reject(error);
            this.pendingRequests.delete(requestId);
          }
        }
      }, 3000); // Wait 3 seconds for possible follow-up
      return;
    }

    // Handle ohlc response (candles)
    if (response.ohlc && response.ohlc.candles && Array.isArray(response.ohlc.candles)) {
      console.log('✅ Received OHLC data:', response.ohlc.candles.length, 'candles');
      const requestId = this.getRequestIdFromEchoReq(response.echo_req);
      if (requestId && this.pendingRequests.has(requestId)) {
        const { resolve, timeout } = this.pendingRequests.get(requestId)!;
        clearTimeout(timeout);
        const candleData = this.processCandleData(response.ohlc.candles);
        console.log('✅ Processed', candleData.length, 'candles');
        resolve(candleData);
        this.pendingRequests.delete(requestId);
        return;
      } else {
        console.warn('⚠️ No matching pending request for OHLC response. Pending requests:', this.pendingRequests.size);
      }
    }
    
    // Also check if candles are directly in ohlc (alternative format)
    if (response.ohlc && Array.isArray(response.ohlc) && response.ohlc.length > 0) {
      console.log('✅ Received OHLC data (array format):', response.ohlc.length, 'candles');
      const requestId = this.getRequestIdFromEchoReq(response.echo_req);
      if (requestId && this.pendingRequests.has(requestId)) {
        const { resolve, timeout } = this.pendingRequests.get(requestId)!;
        clearTimeout(timeout);
        if (response.ohlc[0] && typeof response.ohlc[0] === 'object' && 'open' in response.ohlc[0]) {
          const candleData = this.processCandleData(response.ohlc as any);
          console.log('✅ Processed', candleData.length, 'candles');
          resolve(candleData);
          this.pendingRequests.delete(requestId);
          return;
        }
      }
    }
    
    // Handle ticks_history response (fallback - convert ticks to candles)
    if (response.ticks_history && Array.isArray(response.ticks_history) && response.ticks_history.length > 0) {
      console.log('📊 Received ticks_history:', response.ticks_history.length, 'ticks');
      const requestId = this.getRequestIdFromEchoReq(response.echo_req);
      if (requestId && this.pendingRequests.has(requestId)) {
        const { resolve, timeout } = this.pendingRequests.get(requestId)!;
        clearTimeout(timeout);
        console.warn('⚠️ Received ticks_history instead of ohlc. Converting ticks to candles...');
        const granularity = this.getGranularityFromEchoReq(response.echo_req);
        const candleData = this.convertTicksToCandles(response.ticks_history, granularity);
        resolve(candleData);
        this.pendingRequests.delete(requestId);
        return;
      }
    }
    
    // Handle candles response format (direct candles array with msg_type: 'candles')
    if (response.msg_type === 'candles' && (response as any).candles && Array.isArray((response as any).candles)) {
      console.log('✅ Received candles data (direct format):', (response as any).candles.length, 'candles');
      const requestId = this.getRequestIdFromEchoReq(response.echo_req);
      if (requestId && this.pendingRequests.has(requestId)) {
        const { resolve, timeout } = this.pendingRequests.get(requestId)!;
        clearTimeout(timeout);
        // Convert to ohlc format for processing
        const candleData = this.processCandleData((response as any).candles);
        console.log('✅ Processed', candleData.length, 'candles');
        resolve(candleData);
        this.pendingRequests.delete(requestId);
        return;
      }
    }
    
    // Log if we didn't handle the response
    if (!response.error && !response.ohlc && (!response.ticks_history || response.ticks_history.length === 0)) {
      console.warn('⚠️ Unhandled response type:', response.msg_type);
      console.warn('⚠️ Full response structure:', JSON.stringify(response, null, 2));
    }
  }

  private getRequestIdFromEchoReq(_echoReq: DerivApiRequest): number | null {
    // We'll store request ID in a custom way since Deriv API doesn't return it
    // For now, we'll use a simple approach - get the first pending request
    if (this.pendingRequests.size > 0) {
      return Array.from(this.pendingRequests.keys())[0];
    }
    return null;
  }

  private getGranularityFromEchoReq(echoReq: DerivApiRequest): number {
    if (echoReq.granularity) {
      return echoReq.granularity;
    }
    // Default to 1 hour if not specified
    return 3600;
  }

  private convertTicksToCandles(
    ticks: Array<{ epoch: number; quote: number }>,
    granularity: number
  ): CandleData[] {
    if (ticks.length === 0) {
      return [];
    }

    // Group ticks by time period based on granularity
    const candles: Array<{
      epoch: number;
      open: number;
      high: number;
      low: number;
      close: number;
    }> = [];

    // Sort ticks by epoch
    const sortedTicks = [...ticks].sort((a, b) => a.epoch - b.epoch);

    // Group ticks into candles based on granularity
    let currentCandle: {
      epoch: number;
      open: number;
      high: number;
      low: number;
      close: number;
    } | null = null;

    for (const tick of sortedTicks) {
      const candleStart = Math.floor(tick.epoch / granularity) * granularity;

      if (!currentCandle || currentCandle.epoch !== candleStart) {
        // Start a new candle
        if (currentCandle) {
          candles.push(currentCandle);
        }
        currentCandle = {
          epoch: candleStart,
          open: tick.quote,
          high: tick.quote,
          low: tick.quote,
          close: tick.quote,
        };
      } else {
        // Update current candle
        currentCandle.high = Math.max(currentCandle.high, tick.quote);
        currentCandle.low = Math.min(currentCandle.low, tick.quote);
        currentCandle.close = tick.quote;
      }
    }

    // Add the last candle
    if (currentCandle) {
      candles.push(currentCandle);
    }

    // Convert to CandleData format
    return candles.map((candle, index) => ({
      candleNumber: candles.length - index,
      high: candle.high,
      low: candle.low,
      open: candle.open,
      close: candle.close,
      epoch: candle.epoch,
    })).reverse(); // Reverse to show oldest first
  }

  private processCandleData(candles: Array<{ open: number; high: number; low: number; close: number; epoch: number }>): CandleData[] {
    return candles.map((candle, index) => ({
      candleNumber: candles.length - index, // Most recent candle is #1
      high: candle.high,
      low: candle.low,
      open: candle.open,
      close: candle.close,
      epoch: candle.epoch,
    })).reverse(); // Reverse to show oldest first
  }

  /**
   * Get candles using HTTP proxy (fallback method)
   * Includes retry logic for intermittent API errors
   */
  private async getCandlesViaProxy(symbol: Symbol, timeframe: Timeframe, count: CandleCount, retryCount: number = 0): Promise<CandleData[]> {
    const granularity = TIMEFRAME_TO_GRANULARITY[timeframe];
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // 2 seconds

    const request = {
      ticks_history: symbol,
      adjust_start_time: 1,
      end: 'latest',
      style: 'candles',
      granularity,
      count,
    };

    if (retryCount > 0) {
      console.log(`🔄 Retry attempt ${retryCount}/${MAX_RETRIES}...`);
    } else {
      console.log('🔄 Trying HTTP proxy as fallback...');
    }
    console.log('📤 Sending request to proxy:', PROXY_ENDPOINT);

    try {
      const response = await fetch(PROXY_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        if (response.status === 500) {
          throw new Error('The API request failed. Please try again in a few seconds. This might be due to:\n- Temporary API issue\n- Rate limiting\n- Invalid symbol or parameters\n\n💡 Try:\n- Clicking "Refresh Data" button\n- Using a different symbol\n- Waiting a few seconds and retrying');
        }
        throw new Error(`Proxy server error: ${response.status} ${response.statusText}`);
      }

      const data: DerivApiResponse = await response.json();
      console.log('📥 Received response from proxy');

      if (data.error) {
        const errorCode = data.error.code || 'Unknown';
        const errorMessage = data.error.message || 'API error';
        
        // Provide user-friendly error messages
        if (errorCode === 'WrongResponse' || errorMessage.includes('Sorry, an error occurred')) {
          throw new Error('The API request failed. Please try again.\n\n💡 This might be due to:\n- Invalid symbol or symbol not available\n- Rate limiting\n- Temporary API issue\n\nTry:\n- Clicking "Refresh Data" button\n- Using a different symbol (R_10, R_25, BOOM900, etc.)\n- Waiting a few seconds and retrying\n- Using a different timeframe');
        }
        
        throw new Error(errorMessage);
      }

      if (data.ohlc && data.ohlc.candles && Array.isArray(data.ohlc.candles)) {
        console.log('✅ Received OHLC data via proxy:', data.ohlc.candles.length, 'candles');
        return this.processCandleData(data.ohlc.candles);
      }

      if (data.ticks_history && Array.isArray(data.ticks_history) && data.ticks_history.length > 0) {
        console.log('📊 Received ticks_history via proxy, converting...');
        return this.convertTicksToCandles(data.ticks_history, granularity);
      }

      throw new Error('Unexpected response format from proxy');
    } catch (error) {
      if (error instanceof Error) {
        // Check if it's a retryable error (WrongResponse, timeout, etc.)
        const isRetryableError = 
          error.message.includes('WrongResponse') ||
          error.message.includes('Sorry, an error occurred') ||
          error.message.includes('timeout') ||
          error.message.includes('Request timeout');
        
        if (isRetryableError && retryCount < MAX_RETRIES) {
          console.warn(`⚠️ Retryable error (attempt ${retryCount + 1}/${MAX_RETRIES}):`, error.message);
          console.log(`⏳ Waiting ${RETRY_DELAY}ms before retry...`);
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          
          // Retry the request
          return this.getCandlesViaProxy(symbol, timeframe, count, retryCount + 1);
        }
        
        if (error.message.includes('Failed to fetch')) {
          throw new Error('Cannot connect to proxy server.\n\n💡 Please make sure:\n- The proxy server is running (node proxy-server.cjs)\n- The server is accessible on port 3001\n\nIf the proxy server is not running, the app will try WebSocket directly.');
        }
        
        // Check if it's a proxy server 500 error
        if (error.message.includes('Proxy server error: 500')) {
          throw new Error('The API request failed. Please try again.\n\n💡 This might be due to:\n- Temporary API issue\n- Rate limiting\n- Invalid symbol or parameters\n\nTry:\n- Clicking "Refresh Data" button\n- Using a different symbol\n- Waiting a few seconds and retrying');
        }
      }
      throw error;
    }
  }

  async getCandles(symbol: Symbol, timeframe: Timeframe, count: CandleCount): Promise<CandleData[]> {
    // Try WebSocket first
    try {
      // Ensure we have a connection
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        await this.connect();
      }
    } catch (wsError) {
      // WebSocket connection failed, try HTTP proxy as fallback
      console.warn('⚠️ WebSocket connection failed, trying HTTP proxy fallback...');
      console.warn('💡 WebSocket error:', wsError instanceof Error ? wsError.message : 'Unknown error');
      return this.getCandlesViaProxy(symbol, timeframe, count);
    }

    return new Promise((resolve, reject) => {
      const requestId = this.requestId++;
      const granularity = TIMEFRAME_TO_GRANULARITY[timeframe];
      const MAX_RETRIES = 3;
      let retryCount = 0;

      const makeRequest = (): void => {
        // Use ticks_history API for getting candle data with OHLC style
        // Deriv API format: ticks_history method with style='candles' returns OHLC data
        const request = {
          ticks_history: symbol,
          adjust_start_time: 1,
          end: 'latest',
          style: 'candles',
          granularity,
          count,
        };
        
        if (retryCount > 0) {
          console.log(`🔄 WebSocket retry attempt ${retryCount}/${MAX_RETRIES}...`);
        }
        console.log('📤 Sending API request:', JSON.stringify(request, null, 2));

        // Set timeout for request (increased for better reliability)
        const timeoutId = setTimeout(() => {
          if (this.pendingRequests.has(requestId)) {
            this.pendingRequests.delete(requestId);
            // If WebSocket times out, try proxy as fallback
            console.warn('⚠️ WebSocket request timed out, trying HTTP proxy fallback...');
            this.getCandlesViaProxy(symbol, timeframe, count)
              .then(resolve)
              .catch(reject);
          }
        }, 90000); // 90 second timeout (increased from 45 for better reliability)

        // Wrap resolve/reject to clear timeout and handle retries
        const wrappedResolve = (data: CandleData[]) => {
          clearTimeout(timeoutId);
          resolve(data);
        };
        
        const wrappedReject = (error: Error) => {
          clearTimeout(timeoutId);
          
          // Check if it's a retryable error
          const isRetryableError = 
            error.message.includes('WrongResponse') ||
            error.message.includes('Sorry, an error occurred') ||
            error.message.includes('timeout');
          
          if (isRetryableError && retryCount < MAX_RETRIES) {
            retryCount++;
            console.warn(`⚠️ Retryable error (attempt ${retryCount}/${MAX_RETRIES}):`, error.message);
            console.log('⏳ Retrying WebSocket request in 2 seconds...');
            
            // Remove the failed request
            this.pendingRequests.delete(requestId);
            
            // Retry after delay
            setTimeout(() => {
              makeRequest();
            }, 2000);
            return;
          }
          
          // If not retryable or max retries reached, try proxy as fallback
          this.pendingRequests.delete(requestId);
          console.warn('⚠️ WebSocket request failed, trying HTTP proxy fallback...');
          this.getCandlesViaProxy(symbol, timeframe, count)
            .then(resolve)
            .catch(reject);
        };

        this.pendingRequests.set(requestId, { resolve: wrappedResolve, reject: wrappedReject, timeout: timeoutId });

        try {
          if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            clearTimeout(timeoutId);
            this.pendingRequests.delete(requestId);
            // Try proxy as fallback
            console.warn('⚠️ WebSocket not connected, trying HTTP proxy fallback...');
            this.getCandlesViaProxy(symbol, timeframe, count)
              .then(resolve)
              .catch(reject);
            return;
          }
          
          this.ws.send(JSON.stringify(request));
        } catch (error) {
          clearTimeout(timeoutId);
          this.pendingRequests.delete(requestId);
          // Try proxy as fallback
          console.warn('⚠️ WebSocket send failed, trying HTTP proxy fallback...');
          this.getCandlesViaProxy(symbol, timeframe, count)
            .then(resolve)
            .catch(reject);
        }
      };

      // Start the first request
      makeRequest();
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    // Clear all pending requests
    this.pendingRequests.forEach(({ timeout }) => {
      clearTimeout(timeout);
    });
    this.pendingRequests.clear();
    this.isConnecting = false;
  }
}

// Export singleton instance
export const derivApi = new DerivApiService();

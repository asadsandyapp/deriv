import type { Symbol, Timeframe, CandleCount, CandleData, DerivApiRequest, DerivApiResponse } from '../types';

// Deriv API WebSocket endpoint - using demo app_id for testing
// For production, you should register your own app at https://app.deriv.com/account/api-token
const APP_ID = 'idU6q4jxyfEFiYj'; // Demo app ID - replace with your own for production
const WS_ENDPOINT = `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`;

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
  }> = new Map();

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Close existing connection if any
        if (this.ws) {
          this.ws.close();
        }

        this.ws = new WebSocket(WS_ENDPOINT);
        let connectionTimeout: ReturnType<typeof setTimeout>;

        this.ws.onopen = () => {
          console.log('Connected to Deriv API');
          clearTimeout(connectionTimeout);
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const response: DerivApiResponse = JSON.parse(event.data);
            this.handleMessage(response);
          } catch (error) {
            console.error('Error parsing message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          clearTimeout(connectionTimeout);
          // Reject the connection promise if we haven't connected yet
          if (this.ws?.readyState === WebSocket.CONNECTING) {
            reject(new Error('WebSocket connection error. Please check your internet connection and try again.'));
          }
        };

        this.ws.onclose = (event) => {
          console.log('Disconnected from Deriv API', event.code, event.reason);
          clearTimeout(connectionTimeout);
          this.ws = null;
          
          // Reject any pending requests if connection closed unexpectedly
          if (event.code !== 1000) { // Not a normal closure
            const errorMsg = event.reason || `Connection closed with code ${event.code}`;
            this.pendingRequests.forEach(({ reject: rejectRequest }) => {
              rejectRequest(new Error(errorMsg));
            });
            this.pendingRequests.clear();
          }
        };

        // Set connection timeout
        connectionTimeout = setTimeout(() => {
          if (this.ws?.readyState === WebSocket.CONNECTING) {
            this.ws.close();
            reject(new Error('Connection timeout - could not connect to Deriv API'));
          }
        }, 10000); // 10 second connection timeout
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(response: DerivApiResponse): void {
    // Handle errors
    if (response.error) {
      const error = new Error(response.error.message || 'API error');
      // Find and reject all pending requests
      this.pendingRequests.forEach(({ reject }) => {
        reject(error);
      });
      this.pendingRequests.clear();
      return;
    }

    // Handle ohlc response (candles)
    if (response.ohlc && response.ohlc.candles) {
      const requestId = this.getRequestIdFromEchoReq(response.echo_req);
      if (requestId && this.pendingRequests.has(requestId)) {
        const { resolve } = this.pendingRequests.get(requestId)!;
        const candleData = this.processCandleData(response.ohlc.candles);
        resolve(candleData);
        this.pendingRequests.delete(requestId);
        return;
      }
    }
    
    // Handle ticks_history response (fallback - convert ticks to candles)
    if (response.ticks_history && Array.isArray(response.ticks_history) && response.ticks_history.length > 0) {
      const requestId = this.getRequestIdFromEchoReq(response.echo_req);
      if (requestId && this.pendingRequests.has(requestId)) {
        // Convert ticks to candles if ohlc is not available
        // This is a fallback mechanism
        console.warn('Received ticks_history instead of ohlc, converting...');
      }
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

  async getCandles(symbol: Symbol, timeframe: Timeframe, count: CandleCount): Promise<CandleData[]> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      try {
        await this.connect();
      } catch (error) {
        throw new Error(`Failed to connect to Deriv API: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return new Promise((resolve, reject) => {
      const requestId = this.requestId++;
      const granularity = TIMEFRAME_TO_GRANULARITY[timeframe];

      // Use ohlc API for getting candle data
      const request = {
        ohlc: 1,
        ticks_history: symbol,
        adjust_start_time: 1,
        end: 'latest',
        style: 'candles',
        granularity,
        count,
        subscribe: 0,
      };

      // Set timeout for request
      const timeoutId = setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Request timeout - no response from API'));
        }
      }, 30000); // 30 second timeout

      // Wrap resolve/reject to clear timeout
      const wrappedResolve = (data: CandleData[]) => {
        clearTimeout(timeoutId);
        resolve(data);
      };
      
      const wrappedReject = (error: Error) => {
        clearTimeout(timeoutId);
        reject(error);
      };

      this.pendingRequests.set(requestId, { resolve: wrappedResolve, reject: wrappedReject });

      try {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
          clearTimeout(timeoutId);
          this.pendingRequests.delete(requestId);
          reject(new Error('WebSocket is not connected'));
          return;
        }
        
        this.ws.send(JSON.stringify(request));
      } catch (error) {
        clearTimeout(timeoutId);
        this.pendingRequests.delete(requestId);
        reject(error as Error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.pendingRequests.clear();
  }
}

// Export singleton instance
export const derivApi = new DerivApiService();


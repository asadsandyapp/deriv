export type Symbol = string; // Allow any symbol string
export type Timeframe = '1h' | '4h' | '1d';
export type CandleCount = 50 | 100;

export interface CandleData {
  candleNumber: number;
  high: number;
  low: number;
  open?: number;
  close?: number;
  epoch?: number;
}

export interface DerivCandleResponse {
  candles: Array<{
    open: number;
    high: number;
    low: number;
    close: number;
    epoch: number;
  }>;
}

export interface DerivApiRequest {
  ohlc?: number;
  ticks_history?: string;
  adjust_start_time?: number;
  end?: string;
  start?: number;
  style?: string;
  granularity?: number;
  count?: number;
  subscribe?: number;
}

export interface DerivApiResponse {
  echo_req: DerivApiRequest;
  msg_type: string;
  ticks_history?: Array<{
    epoch: number;
    quote: number;
  }>;
  ohlc?: DerivCandleResponse;
  error?: {
    code: string;
    message: string;
  };
}


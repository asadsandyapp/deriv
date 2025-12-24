import type { Symbol, Timeframe, CandleData } from '../types';

export function exportToCSV(symbol: Symbol, timeframe: Timeframe, data: CandleData[]): void {
  if (data.length === 0) {
    alert('No data to export');
    return;
  }

  // Create CSV header
  const headers = ['Symbol', 'Timeframe', 'Candle Number', 'High', 'Low'];
  
  // Create CSV rows
  const rows = data.map((candle) => [
    symbol,
    timeframe,
    candle.candleNumber.toString(),
    candle.high.toFixed(2),
    candle.low.toFixed(2),
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `deriv_candles_${symbol}_${timeframe}_${data.length}_candles.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
}



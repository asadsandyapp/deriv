import type { Symbol, Timeframe, CandleData } from '../types';

// Helper function to format epoch timestamp to readable date/time for CSV (no commas)
function formatCandleTime(epoch?: number): string {
  if (!epoch) return 'N/A';
  const date = new Date(epoch * 1000); // Convert Unix timestamp to milliseconds
  // Format without commas to avoid CSV column splitting
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
}

export function exportToCSV(symbol: Symbol, timeframe: Timeframe, data: CandleData[]): void {
  console.log('📊 Exporting CSV with', data.length, 'candles');
  
  if (data.length === 0) {
    alert('No data to export. Please fetch data first.');
    return;
  }
  
  // Validate data has required fields
  if (!data[0] || typeof data[0].high !== 'number' || typeof data[0].low !== 'number') {
    console.error('❌ Invalid data format:', data);
    alert('Data format is invalid. Please refresh and try again.');
    return;
  }

  // Create CSV header - wrap in quotes for consistency
  const headers = ['"Symbol"', '"Timeframe"', '"Candle Number"', '"Time"', '"Open"', '"High"', '"Low"', '"Close"'];
  
  // Create CSV rows - wrap values in quotes to handle commas in data
  const rows = data.map((candle) => [
    `"${symbol}"`,
    `"${timeframe}"`,
    candle.candleNumber.toString(),
    `"${formatCandleTime(candle.epoch)}"`,
    candle.open?.toFixed(2) || 'N/A',
    candle.high.toFixed(2),
    candle.low.toFixed(2),
    candle.close?.toFixed(2) || 'N/A',
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



import type { Symbol, Timeframe, CandleData } from '../types';
import { exportToCSV } from '../utils/csvExport';

interface ExportButtonProps {
  symbol: Symbol;
  timeframe: Timeframe;
  data: CandleData[];
  disabled?: boolean;
}

export default function ExportButton({ symbol, timeframe, data, disabled }: ExportButtonProps) {
  const handleExport = () => {
    // Use the data that's already loaded - no API call needed
    console.log('📥 Export button clicked - using existing data:', data.length, 'candles');
    if (data.length === 0) {
      alert('No data available to export. Please wait for data to load.');
      return;
    }
    exportToCSV(symbol, timeframe, data);
  };

  return (
    <button
      onClick={handleExport}
      disabled={disabled || data.length === 0}
      className={`
        px-6 py-3 rounded-lg font-semibold text-white
        transition-all duration-200 transform
        ${disabled || data.length === 0
          ? 'bg-gray-400 cursor-not-allowed'
          : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl'
        }
      `}
    >
      Export to CSV
    </button>
  );
}



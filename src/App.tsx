import { useState, useEffect, useCallback } from 'react';
import type { Symbol, Timeframe, CandleCount, CandleData } from './types';
import { derivApi } from './services/derivApi';
import SymbolSelector from './components/SymbolSelector';
import TimeframeSelector from './components/TimeframeSelector';
import CandleCountSelector from './components/CandleCountSelector';
import DataTable from './components/DataTable';
import ExportButton from './components/ExportButton';
import AddSymbolForm from './components/AddSymbolForm';

const STORAGE_KEY = 'deriv_custom_symbols';

function App() {
  const [symbol, setSymbol] = useState<Symbol>('C600');
  const [timeframe, setTimeframe] = useState<Timeframe>('1h');
  const [candleCount, setCandleCount] = useState<CandleCount>(50);
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customSymbols, setCustomSymbols] = useState<string[]>(() => {
    // Load custom symbols from localStorage on mount
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const fetchCandleData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await derivApi.getCandles(symbol, timeframe, candleCount);
      setCandleData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch candle data';
      setError(errorMessage);
      setCandleData([]);
      console.error('Error fetching candle data:', err);
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe, candleCount]);

  // Fetch data when parameters change
  useEffect(() => {
    fetchCandleData();
  }, [fetchCandleData]);

  // Save custom symbols to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customSymbols));
    } catch (error) {
      console.error('Failed to save custom symbols to localStorage:', error);
    }
  }, [customSymbols]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      derivApi.disconnect();
    };
  }, []);

  const handleAddSymbol = (newSymbol: string) => {
    setCustomSymbols((prev) => {
      if (!prev.includes(newSymbol)) {
        return [...prev, newSymbol];
      }
      return prev;
    });
    // Optionally switch to the newly added symbol
    setSymbol(newSymbol);
  };

  const handleRemoveSymbol = (symbolToRemove: string) => {
    setCustomSymbols((prev) => prev.filter((s) => s !== symbolToRemove));
    // If the removed symbol was selected, switch to default
    if (symbol === symbolToRemove) {
      setSymbol('C600');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Deriv Candle Data Interface
          </h1>
          <p className="text-gray-600">
            Select symbol, timeframe, and candle count to view historical data
          </p>
        </div>

        {/* Controls Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <SymbolSelector 
              value={symbol} 
              onChange={setSymbol} 
              availableSymbols={customSymbols}
            />
            <TimeframeSelector value={timeframe} onChange={setTimeframe} />
            <CandleCountSelector value={candleCount} onChange={setCandleCount} />
          </div>

          {/* Add Symbol Section */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Add Custom Symbol</h3>
            <AddSymbolForm 
              onAddSymbol={handleAddSymbol} 
              existingSymbols={customSymbols}
            />
          </div>

          {/* Custom Symbols List */}
          {customSymbols.length > 0 && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Custom Symbols</h3>
              <div className="flex flex-wrap gap-2">
                {customSymbols.map((customSymbol) => (
                  <span
                    key={customSymbol}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {customSymbol}
                    <button
                      onClick={() => handleRemoveSymbol(customSymbol)}
                      className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                      aria-label={`Remove ${customSymbol}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-center mt-4">
            <button
              onClick={fetchCandleData}
              disabled={loading}
              className={`
                px-6 py-3 rounded-lg font-semibold text-white
                transition-all duration-200 transform
                ${loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl'
                }
              `}
            >
              {loading ? 'Loading...' : 'Refresh Data'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded">
            <p className="font-semibold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Export Button */}
        {candleData.length > 0 && !loading && (
          <div className="flex justify-end mb-4">
            <ExportButton
              symbol={symbol}
              timeframe={timeframe}
              data={candleData}
              disabled={loading}
            />
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Candle Data ({candleData.length} candles)
          </h2>
          <DataTable data={candleData} loading={loading} />
        </div>
      </div>
    </div>
  );
}

export default App;


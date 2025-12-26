import type { Symbol } from '../types';

interface SymbolSelectorProps {
  value: Symbol;
  onChange: (symbol: Symbol) => void;
  availableSymbols: string[];
}

// Valid Deriv API symbols - Volatility indices and Boom/Crash indices
// Removed invalid symbols: 1CRASH600, 1CRASH900, 1BOOM600 (causing WrongResponse errors)
const DEFAULT_SYMBOLS: string[] = [
  'R_10', 
  'R_25', 
  'R_50', 
  'R_75', 
  'R_100',
  'CRASH500',
  'BOOM500',
  'BOOM900',
  'CRASH900',
  'BOOM1000',
  'CRASH1000'
];

export default function SymbolSelector({ value, onChange, availableSymbols }: SymbolSelectorProps) {
  // Combine default and custom symbols, remove duplicates, and sort
  const allSymbols = Array.from(new Set([...DEFAULT_SYMBOLS, ...availableSymbols])).sort();

  return (
    <div className="flex flex-col">
      <label htmlFor="symbol" className="text-sm font-medium text-gray-700 mb-2">
        Symbol
      </label>
      <select
        id="symbol"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
      >
        {allSymbols.map((symbol) => (
          <option key={symbol} value={symbol}>
            {symbol}
          </option>
        ))}
      </select>
    </div>
  );
}


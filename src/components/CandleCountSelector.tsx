import type { CandleCount } from '../types';

interface CandleCountSelectorProps {
  value: CandleCount;
  onChange: (count: CandleCount) => void;
}

const COUNTS: CandleCount[] = [1, 10, 25, 50, 100];

export default function CandleCountSelector({ value, onChange }: CandleCountSelectorProps) {
  return (
    <div className="flex flex-col">
      <label htmlFor="candleCount" className="text-sm font-medium text-gray-700 mb-2">
        Number of Candles
      </label>
      <select
        id="candleCount"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) as CandleCount)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
      >
        {COUNTS.map((count) => (
          <option key={count} value={count}>
            {count}
          </option>
        ))}
      </select>
    </div>
  );
}



import type { Timeframe } from '../types';

interface TimeframeSelectorProps {
  value: Timeframe;
  onChange: (timeframe: Timeframe) => void;
}

const TIMEFRAMES: Timeframe[] = ['1h', '4h', '1d'];

export default function TimeframeSelector({ value, onChange }: TimeframeSelectorProps) {
  return (
    <div className="flex flex-col">
      <label htmlFor="timeframe" className="text-sm font-medium text-gray-700 mb-2">
        Timeframe
      </label>
      <select
        id="timeframe"
        value={value}
        onChange={(e) => onChange(e.target.value as Timeframe)}
        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
      >
        {TIMEFRAMES.map((timeframe) => (
          <option key={timeframe} value={timeframe}>
            {timeframe}
          </option>
        ))}
      </select>
    </div>
  );
}



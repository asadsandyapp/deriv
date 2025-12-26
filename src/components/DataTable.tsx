import type { CandleData } from '../types';

interface DataTableProps {
  data: CandleData[];
  loading?: boolean;
}

// Helper function to format epoch timestamp to readable date/time
function formatCandleTime(epoch?: number): string {
  if (!epoch) return 'N/A';
  const date = new Date(epoch * 1000); // Convert Unix timestamp to milliseconds
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export default function DataTable({ data, loading }: DataTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading candle data...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No data available. Please select parameters and fetch data.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto shadow-lg rounded-lg">
      <table className="min-w-full bg-white border border-gray-200">
        <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
              Candle #
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
              Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
              Open
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
              High
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
              Low
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
              Close
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((candle, index) => (
            <tr
              key={index}
              className="hover:bg-gray-50 transition-colors"
            >
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {candle.candleNumber}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                {formatCandleTime(candle.epoch)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-semibold">
                {candle.open?.toFixed(2) || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                {candle.high.toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-semibold">
                {candle.low.toFixed(2)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-semibold">
                {candle.close?.toFixed(2) || 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}



import { useState } from 'react';

interface AddSymbolFormProps {
  onAddSymbol: (symbol: string) => void;
  existingSymbols: string[];
}

export default function AddSymbolForm({ onAddSymbol, existingSymbols }: AddSymbolFormProps) {
  const [newSymbol, setNewSymbol] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedSymbol = newSymbol.trim().toUpperCase();

    if (!trimmedSymbol) {
      setError('Symbol cannot be empty');
      return;
    }

    if (existingSymbols.includes(trimmedSymbol)) {
      setError('Symbol already exists');
      return;
    }

    if (trimmedSymbol.length < 2 || trimmedSymbol.length > 10) {
      setError('Symbol must be between 2 and 10 characters');
      return;
    }

    onAddSymbol(trimmedSymbol);
    setNewSymbol('');
    setError(null);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={newSymbol}
          onChange={(e) => {
            setNewSymbol(e.target.value);
            setError(null);
          }}
          placeholder="Enter symbol (e.g., C500)"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
          maxLength={10}
        />
        <button
          type="submit"
          className="px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md hover:shadow-lg"
        >
          Add
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </form>
  );
}



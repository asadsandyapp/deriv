import { useState, useEffect } from 'react';

const APP_ID_STORAGE_KEY = 'deriv_app_id';

interface AppIdConfigProps {
  onAppIdChange?: (appId: string) => void;
}

export default function AppIdConfig({ onAppIdChange }: AppIdConfigProps) {
  const [appId, setAppId] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load saved app_id on mount
    try {
      const stored = localStorage.getItem(APP_ID_STORAGE_KEY);
      if (stored) {
        setAppId(stored);
      }
    } catch (e) {
      console.error('Error loading app_id:', e);
    }
  }, []);

  const handleSave = () => {
    try {
      if (appId.trim()) {
        localStorage.setItem(APP_ID_STORAGE_KEY, appId.trim());
        setSaved(true);
        onAppIdChange?.(appId.trim());
        setTimeout(() => setSaved(false), 2000);
        // Reload page to apply new app_id
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        // Clear app_id
        localStorage.removeItem(APP_ID_STORAGE_KEY);
        setSaved(true);
        onAppIdChange?.('');
        setTimeout(() => setSaved(false), 2000);
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (e) {
      console.error('Error saving app_id:', e);
      alert('Failed to save app_id. Please check browser console.');
    }
  };

  return (
    <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
      <h3 className="text-sm font-semibold text-blue-700 mb-2">Deriv API Configuration</h3>
      <p className="text-xs text-blue-600 mb-3">
        Enter your Deriv App ID from{' '}
        <a 
          href="https://app.deriv.com/account/api-token" 
          target="_blank" 
          rel="noopener noreferrer"
          className="underline font-medium"
        >
          Deriv API Token page
        </a>
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          value={appId}
          onChange={(e) => setAppId(e.target.value)}
          placeholder="Enter your App ID (e.g., 12345 or idU6q4jxyfEFiYj)"
          className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
        />
        <button
          onClick={handleSave}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
            saved
              ? 'bg-green-500 text-white'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {saved ? '✓ Saved' : 'Save'}
        </button>
      </div>
      {appId && (
        <p className="text-xs text-blue-600 mt-2">
          Current: <code className="bg-blue-100 px-1 rounded">{appId}</code>
        </p>
      )}
    </div>
  );
}


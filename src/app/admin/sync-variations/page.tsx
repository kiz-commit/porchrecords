"use client";

import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';

export default function SyncVariationsPage() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    setIsSyncing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/sync/variations', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync variations');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold font-mono mb-6">Sync Product Variations</h1>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold font-mono mb-4">Sync Variations from Square</h2>
          <p className="text-gray-600 mb-4">
            This will automatically sync variations from Square for all merch products.
          </p>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="px-6 py-3 bg-blue-600 text-white font-mono font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {isSyncing ? 'Syncing...' : 'Sync Variations'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold font-mono mb-4">Sync Results</h2>
            <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

"use client";

import { useState } from 'react';
import AdminLayout from '@/components/AdminLayout';

export default function ClearAndSyncPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [log, setLog] = useState<string[]>([]);

  const runClearAndSync = async () => {
    setIsRunning(true);
    setResult(null);
    setLog([]);

    try {
      const response = await fetch('/api/admin/clear-and-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setResult(data);
      setLog(data.log || []);

      if (data.success) {
        // Refresh the page after successful sync to show updated data
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } catch (error) {
      setResult({
        success: false,
        error: `Request failed: ${error}`,
        log: [`❌ Request error: ${error}`]
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Clear & Fresh Sync</h1>
          <p className="mt-2 text-gray-600">
            Clear all products from the database and perform a fresh sync from Square.
            This will remove stale products that are no longer available at your location.
          </p>
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Important</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>This operation will:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Delete ALL products from the local database</li>
                  <li>Re-sync only products available at your configured Square location</li>
                  <li>Preserve your admin field customizations (genre, mood, visibility)</li>
                  <li>Take several minutes to complete due to API rate limiting</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Run Clear & Sync</h2>
              <p className="text-sm text-gray-600">
                This will ensure your admin pages only show products currently available at your location.
              </p>
            </div>
            <button
              onClick={runClearAndSync}
              disabled={isRunning}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                isRunning
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {isRunning ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Running...
                </div>
              ) : (
                'Clear & Sync Now'
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-center mb-4">
                {result.success ? (
                  <div className="flex items-center text-green-600">
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Success
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Failed
                  </div>
                )}
              </div>

              {result.success && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-red-600">{result.clearedCount || 0}</div>
                    <div className="text-sm text-red-700">Products Cleared</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">{result.syncedCount || 0}</div>
                    <div className="text-sm text-green-700">Products Synced</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-yellow-600">{result.errorCount || 0}</div>
                    <div className="text-sm text-yellow-700">Errors</div>
                  </div>
                </div>
              )}

              {result.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-800 font-medium">Error:</p>
                  <p className="text-red-700">{result.error}</p>
                </div>
              )}
            </div>

            {/* Log */}
            {log.length > 0 && (
              <div className="border-t border-gray-200">
                <div className="p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Operation Log</h3>
                  <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <div className="font-mono text-sm space-y-1">
                      {log.map((line, index) => (
                        <div key={index} className="text-gray-300">
                          {line}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Success Message */}
        {result?.success && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Operation Complete</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Your database has been cleared and fresh products have been synced from Square.</p>
                  <p className="mt-1">The page will refresh automatically to show the updated data.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

"use client";

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';

interface SyncStatus {
  lastSync: string | null;
  totalProducts: number;
  localProducts: number;
  squareProducts: number;
  pendingChanges: number;
}

export default function AdminSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    lastSync: null,
    totalProducts: 0,
    localProducts: 0,
    squareProducts: 0,
    pendingChanges: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [syncLog, setSyncLog] = useState<string[]>([]);

  useEffect(() => {
    fetchSyncStatus();
  }, []);

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch('/api/admin/sync/status');
      if (response.ok) {
        const data = await response.json();
        setSyncStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch sync status:', error);
    }
  };

  const performSync = async (direction: 'pull' | 'push' | 'both') => {
    setIsLoading(true);
    setSyncLog([]);
    
    try {
      const response = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ direction }),
      });

      if (response.ok) {
        const data = await response.json();
        const newLog: string[] = [...(data.log || [])];

        // After legacy sync completes, perform robust auto-sync to update store database (pagination + fallback)
        newLog.push('---');
        newLog.push('Starting database auto-sync (paginated, location-aware)...');
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
        const dbSyncRes = await fetch(`${baseUrl}/api/store/sync-and-get-products`, { method: 'GET', cache: 'no-store' });
        let dbSyncJson: any = null;
        try { dbSyncJson = await dbSyncRes.json(); } catch {}
        if (dbSyncRes.ok && dbSyncJson?.success !== false) {
          const synced = typeof dbSyncJson?.syncedCount === 'number' ? dbSyncJson.syncedCount : (Array.isArray(dbSyncJson?.products) ? dbSyncJson.products.length : '?');
          newLog.push(`DB Sync: synced ${synced} items`);
        } else {
          newLog.push(`DB Sync failed: ${dbSyncJson?.error || dbSyncRes.statusText}`);
        }

        // Invalidate all caches so frontend/admin reflect latest data
        newLog.push('Revalidating caches...');
        const invalidateRes = await fetch('/api/admin/cache/invalidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'all' })
        });
        let invalidateJson: any = null;
        try { invalidateJson = await invalidateRes.json(); } catch {}
        if (invalidateRes.ok && invalidateJson?.success) {
          newLog.push(`Caches invalidated: ${invalidateJson?.message || 'all'}`);
        } else {
          newLog.push(`Cache invalidation failed: ${invalidateJson?.error || invalidateRes.statusText}`);
        }

        setSyncLog(newLog);
        await fetchSyncStatus();
      } else {
        const error = await response.json();
        setSyncLog([`Error: ${error.message}`]);
      }
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncLog([`Error: ${error}`]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Square Sync</h1>
        <p className="mt-2 text-gray-600">
          Manage synchronization between your site and Square
        </p>
      </div>

      {/* Sync Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">📦</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{syncStatus.totalProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">🏠</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Local Products</p>
              <p className="text-2xl font-bold text-gray-900">{syncStatus.localProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">🟦</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Square Products</p>
              <p className="text-2xl font-bold text-gray-900">{syncStatus.squareProducts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">⏳</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Changes</p>
              <p className="text-2xl font-bold text-gray-900">{syncStatus.pendingChanges}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sync Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => performSync('pull')}
            disabled={isLoading}
            className="flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
            Pull from Square
          </button>
          <button
            onClick={() => performSync('push')}
            disabled={isLoading}
            className="flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
            Push to Square
          </button>
          <button
            onClick={() => performSync('both')}
            disabled={isLoading}
            className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Full Sync
          </button>
        </div>
        {syncStatus.lastSync && (
          <p className="mt-4 text-sm text-gray-600">
            Last sync: {new Date(syncStatus.lastSync).toISOString().split('T')[0]}
          </p>
        )}
      </div>

      {/* Sync Log */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sync Log</h2>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Syncing...</span>
          </div>
        ) : syncLog.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p>No sync activity yet. Click a sync button above to get started.</p>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            {syncLog.map((log, index) => (
              <div key={index} className="text-sm font-mono text-gray-700 mb-1">
                {log}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sync Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sync Settings</h2>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Auto-sync on changes</h3>
              <p className="text-sm text-gray-500">Automatically sync when products are created or updated</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Sync inventory levels</h3>
              <p className="text-sm text-gray-500">Keep inventory counts synchronized between systems</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Sync pricing</h3>
              <p className="text-sm text-gray-500">Keep product prices synchronized</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 
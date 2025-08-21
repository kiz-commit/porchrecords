"use client";

import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    recentOrders: 0,
    lowStock: 0,
    upcomingShows: 0,
    loading: true,
  });
  const [isRefreshingCache, setIsRefreshingCache] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState<string | null>(null);
  const [isClearingRateLimits, setIsClearingRateLimits] = useState(false);
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [inventoryRes, ordersRes, showsRes] = await Promise.all([
          // Use the same source as the Inventory page for consistency (Square live data)
          fetch('/api/admin/inventory', { cache: 'no-store' }),
          fetch('/api/admin/orders?status=COMPLETED&limit=50', { cache: 'no-store' }),
          fetch('/api/admin/shows', { cache: 'no-store' }),
        ]);

        const [inventoryJson, ordersJson, showsJson] = await Promise.all([
          inventoryRes.ok ? inventoryRes.json() : Promise.resolve({}),
          ordersRes.ok ? ordersRes.json() : Promise.resolve({}),
          showsRes.ok ? showsRes.json() : Promise.resolve({}),
        ]);

        const invProducts = Array.isArray(inventoryJson?.products) ? inventoryJson.products : [];
        const totalProducts = invProducts.length;
        const lowStock = invProducts.filter((p: any) => p.stockStatus === 'low_stock').length;

        const recentOrders = Number(ordersJson?.totalCount || (ordersJson?.orders?.length || 0));

        const shows = Array.isArray(showsJson?.shows) ? showsJson.shows : [];
        const now = new Date();
        const upcomingShows = shows.filter((s: any) => {
          const d = new Date(s.date);
          return (s.isPublished !== false) && !s.isPast && d.getTime() >= now.getTime();
        }).length;

        setStats({
          totalProducts,
          recentOrders,
          lowStock,
          upcomingShows,
          loading: false,
        });
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
        setStats((prev) => ({ ...prev, loading: false }));
      }
    };

    loadStats();
  }, []);

  const refreshStoreCache = async () => {
    try {
      setIsRefreshingCache(true);
      setRefreshMessage(null);
      // 1) Sync products into the local database using the robust auto-sync (handles pagination + location fallback)
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
      const syncRes = await fetch(`${baseUrl}/api/store/sync-and-get-products`, {
        method: 'GET',
        cache: 'no-store'
      });
      let syncInfo: any = null;
      try { syncInfo = await syncRes.json(); } catch {}
      if (!syncRes.ok || syncInfo?.success === false) {
        setRefreshMessage(`Sync failed: ${syncInfo?.error || syncRes.statusText}`);
        return;
      }

      // 2) Invalidate all caches so store/admin reflect the latest DB
      const res = await fetch('/api/admin/cache/invalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'all' })
      });
      const data = await res.json();
      if (!res.ok || data?.success !== true) {
        setRefreshMessage(`Cache refresh failed: ${data?.error || res.statusText}`);
        return;
      }
      const syncedCount = typeof syncInfo?.syncedCount === 'number' ? syncInfo.syncedCount : (Array.isArray(syncInfo?.products) ? syncInfo.products.length : undefined);
      setRefreshMessage(`Synced${syncedCount !== undefined ? ` ${syncedCount}` : ''} and refreshed cache (${data?.message || 'all'}) at ${new Date().toLocaleTimeString()}`);
      // Optionally reload quick stats after cache refresh
      // Trigger the same loader used on mount
      // Note: inventory endpoint is no-store, so this reflects latest
      try {
        const [inventoryRes, ordersRes, showsRes] = await Promise.all([
          fetch('/api/admin/inventory', { cache: 'no-store' }),
          fetch('/api/admin/orders?status=COMPLETED&limit=50', { cache: 'no-store' }),
          fetch('/api/admin/shows', { cache: 'no-store' }),
        ]);
        const [inventoryJson, ordersJson, showsJson] = await Promise.all([
          inventoryRes.ok ? inventoryRes.json() : Promise.resolve({}),
          ordersRes.ok ? ordersRes.json() : Promise.resolve({}),
          showsRes.ok ? showsRes.json() : Promise.resolve({}),
        ]);
        const invProducts = Array.isArray(inventoryJson?.products) ? inventoryJson.products : [];
        const totalProducts = invProducts.length;
        const lowStock = invProducts.filter((p: any) => p.stockStatus === 'low_stock').length;
        const recentOrders = Number(ordersJson?.totalCount || (ordersJson?.orders?.length || 0));
        const shows = Array.isArray(showsJson?.shows) ? showsJson.shows : [];
        const now = new Date();
        const upcomingShows = shows.filter((s: any) => {
          const d = new Date(s.date);
          return (s.isPublished !== false) && !s.isPast && d.getTime() >= now.getTime();
        }).length;
        setStats({ totalProducts, recentOrders, lowStock, upcomingShows, loading: false });
      } catch (e) {
        console.error('Post-refresh stats reload failed:', e);
      }
    } catch (err) {
      console.error('Error refreshing store cache:', err);
      setRefreshMessage('Cache refresh failed: unexpected error');
    } finally {
      setIsRefreshingCache(false);
    }
  };

  const clearRateLimits = async () => {
    try {
      setIsClearingRateLimits(true);
      setRateLimitMessage(null);
      
      const res = await fetch('/api/admin/clear-rate-limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await res.json();
      if (!res.ok || data?.success !== true) {
        setRateLimitMessage(`Failed to clear rate limits: ${data?.error || res.statusText}`);
        return;
      }
      
      setRateLimitMessage(`Rate limits cleared successfully at ${new Date().toLocaleTimeString()}`);
    } catch (error) {
      console.error('Error clearing rate limits:', error);
      setRateLimitMessage('Failed to clear rate limits: unexpected error');
    } finally {
      setIsClearingRateLimits(false);
    }
  };

  const quickStats = [
    { title: "Total Products", value: stats.totalProducts, icon: "📦", color: "bg-blue-500" },
    { title: "Recent Orders", value: stats.recentOrders, icon: "📋", color: "bg-green-500" },
    { title: "Low Stock Items", value: stats.lowStock, icon: "⚠️", color: "bg-orange-500" },
    { title: "Upcoming Shows", value: stats.upcomingShows, icon: "🎵", color: "bg-purple-500" },
  ];

  const quickActions = [
    {
      title: "Sync Products",
      description: "Sync products from Square",
      href: "/admin/products",
      icon: "🔄",
      color: "bg-green-500",
    },
    {
      title: "Manage Orders",
      description: "View and manage orders",
      href: "/admin/orders",
      icon: "📋",
      color: "bg-green-500",
    },
    {
      title: "Discounts",
      description: "Create and manage store discounts",
      href: "/admin/discounts",
      icon: "🎫",
      color: "bg-purple-500",
    },
    {
      title: "Vouchers",
      description: "Manage gift vouchers and codes",
      href: "/admin/vouchers",
      icon: "💳",
      color: "bg-pink-500",
    },
    {
      title: "Sync with Square",
      description: "Update inventory and orders",
      href: "/admin/sync",
      icon: "🔄",
      color: "bg-purple-500",
    },
    {
      title: "Edit Pages",
      description: "Update site content",
      href: "/admin/pages",
      icon: "📝",
      color: "bg-orange-500",
    },
    {
      title: "Insights",
      description: "View analytics and smart suggestions",
      href: "/admin/insights",
      icon: "📈",
      color: "bg-purple-500",
    },
  ];

  const recentActivity = [
    {
      type: "product",
      action: "Product created",
      item: "New Vinyl Release - Summer Vibes",
      time: "2 hours ago",
      icon: "📦",
    },
    {
      type: "order",
      action: "Order received",
      item: "Order #1234 - $45.99",
      time: "4 hours ago",
      icon: "📋",
    },
    {
      type: "sync",
      action: "Square sync completed",
      item: "23 products updated",
      time: "6 hours ago",
      icon: "🔄",
    },
    {
      type: "show",
      action: "Show added",
      item: "Live at The Basement - Next Friday",
      time: "1 day ago",
      icon: "🎵",
    },
  ];

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back! Here&apos;s what&apos;s happening with your store today.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {quickStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-xl`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cache Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8">
        <div className="flex items-center justify-between gap-4 flex-col sm:flex-row">
          <div className="text-sm text-gray-700">
            <span className="font-semibold">Refresh Store Cache</span>
            <span className="text-gray-500"> — revalidates inventory and store pages to match Admin Inventory</span>
          </div>
          <div className="flex items-center gap-3">
            {refreshMessage && (
              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                {refreshMessage}
              </span>
            )}
            <button
              onClick={refreshStoreCache}
              disabled={isRefreshingCache}
              className={`px-4 py-2 rounded-lg text-white flex items-center justify-center ${isRefreshingCache ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {isRefreshingCache ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Cache
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Rate Limit Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8">
        <div className="flex items-center justify-between gap-4 flex-col sm:flex-row">
          <div className="text-sm text-gray-700">
            <span className="font-semibold">Clear Rate Limits</span>
            <span className="text-gray-500"> — clears rate limits for your IP if you're getting "too many requests" errors</span>
          </div>
          <div className="flex items-center gap-3">
            {rateLimitMessage && (
              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                {rateLimitMessage}
              </span>
            )}
            <button
              onClick={clearRateLimits}
              disabled={isClearingRateLimits}
              className={`px-4 py-2 rounded-lg text-white flex items-center justify-center ${isClearingRateLimits ? 'bg-gray-400 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-700'}`}
            >
              {isClearingRateLimits ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  Clearing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear Rate Limits
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all hover:scale-105 group"
            >
              <div className="flex items-center mb-4">
                <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center text-lg mr-3`}>
                  {action.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {action.title}
                </h3>
              </div>
              <p className="text-gray-600 text-sm">
                {action.description}
              </p>
            </Link>
          ))}
        </div>
      </div>

    </AdminLayout>
  );
} 
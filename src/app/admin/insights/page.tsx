"use client";

import AdminLayout from '@/components/AdminLayout';
import { useState, useEffect } from 'react';
import { 
  EyeIcon, 
  ShoppingCartIcon, 
  LightBulbIcon, 
  ArrowTrendingUpIcon,
  CalendarIcon,
  ChartBarIcon,
  TagIcon,
  StarIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

interface ProductView {
  id: string;
  title: string;
  views: number;
  purchases: number;
  lastViewed: string;
  squareId: string;
}

interface BundleSuggestion {
  products: string[];
  confidence: number;
  reason: string;
}

interface ReengagementItem {
  id: string;
  title: string;
  views: number;
  daysSinceLastView: number;
  actions: {
    addDiscount: boolean;
    featureOnHomepage: boolean;
    createEmailPrompt: boolean;
  };
}

export default function InsightsPage() {
  const [timeRange, setTimeRange] = useState<'weekly' | 'monthly'>('weekly');
  const [topViewedProducts, setTopViewedProducts] = useState<ProductView[]>([]);
  const [viewedNotPurchased, setViewedNotPurchased] = useState<ProductView[]>([]);
  const [bundleSuggestions, setBundleSuggestions] = useState<BundleSuggestion[]>([]);
  const [reengagementItems, setReengagementItems] = useState<ReengagementItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsightsData();
  }, [timeRange]);

  const fetchInsightsData = async () => {
    setLoading(true);
    try {
      // Fetch analytics data from API
      const [topViewedRes, viewedNotPurchasedRes, bundlesRes, reengagementRes] = await Promise.all([
        fetch(`/api/admin/insights/top-viewed?range=${timeRange}`),
        fetch(`/api/admin/insights/viewed-not-purchased?range=${timeRange}`),
        fetch(`/api/admin/insights/bundle-suggestions?range=${timeRange}`),
        fetch(`/api/admin/insights/reengagement?range=${timeRange}`)
      ]);

      if (topViewedRes.ok) {
        const data = await topViewedRes.json();
        setTopViewedProducts(data.products);
      }

      if (viewedNotPurchasedRes.ok) {
        const data = await viewedNotPurchasedRes.json();
        setViewedNotPurchased(data.products);
      }

      if (bundlesRes.ok) {
        const data = await bundlesRes.json();
        setBundleSuggestions(data.suggestions);
      }

      if (reengagementRes.ok) {
        const data = await reengagementRes.json();
        setReengagementItems(data.items);
      }
    } catch (error) {
      console.error('Error fetching insights data:', error);
      // Show empty state instead of mock data
      setTopViewedProducts([]);
      setViewedNotPurchased([]);
      setBundleSuggestions([]);
      setReengagementItems([]);
    } finally {
      setLoading(false);
    }
  };



  const handleAddDiscount = async (productId: string, squareId: string) => {
    try {
      const response = await fetch('/api/admin/insights/create-discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, squareId, discountPercent: 10 })
      });
      
      if (response.ok) {
        alert('Discount created successfully!');
      }
    } catch (error) {
      console.error('Error creating discount:', error);
      alert('Failed to create discount');
    }
  };

  const handleFeatureOnHomepage = async (productId: string) => {
    try {
      const response = await fetch('/api/admin/insights/feature-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId })
      });
      
      if (response.ok) {
        alert('Product featured on homepage!');
      }
    } catch (error) {
      console.error('Error featuring product:', error);
      alert('Failed to feature product');
    }
  };

  const handleCreateEmailPrompt = async (productId: string, title: string) => {
    try {
      const response = await fetch('/api/admin/insights/create-email-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, title })
      });
      
      if (response.ok) {
        alert('Email campaign draft created!');
      }
    } catch (error) {
      console.error('Error creating email campaign:', error);
      alert('Failed to create email campaign');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Insights</h1>
            <p className="mt-2 text-gray-600">
              Analytics and smart suggestions to boost your sales
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setTimeRange('weekly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === 'weekly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setTimeRange('monthly')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === 'monthly'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Viewed Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <EyeIcon className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Top Viewed Products</h2>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Most popular products in the past {timeRange === 'weekly' ? '7 days' : '30 days'}
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {topViewedProducts.length > 0 ? (
              topViewedProducts.map((product, index) => (
                <div key={product.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-sm font-semibold text-blue-600 mr-3">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{product.title}</p>
                        <p className="text-sm text-gray-600">
                          {product.views} views • {product.purchases} purchases
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{product.views}</p>
                      <p className="text-xs text-gray-500">views</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <EyeIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No product views recorded yet</p>
                <p className="text-sm text-gray-400 mt-1">Analytics data will appear here once customers start browsing products</p>
              </div>
            )}
          </div>
        </div>

        {/* Viewed But Not Purchased */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <ShoppingCartIcon className="w-5 h-5 text-orange-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Viewed But Not Purchased</h2>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Products with 3+ views and 0 purchases in 14 days
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {viewedNotPurchased.length > 0 ? (
              viewedNotPurchased.map((product) => (
                <div key={product.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{product.title}</p>
                      <p className="text-sm text-gray-600">
                        {product.views} views • Last viewed {new Date(product.lastViewed).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-orange-600">{product.views}</p>
                      <p className="text-xs text-gray-500">views</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <ShoppingCartIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No conversion opportunities found</p>
                <p className="text-sm text-gray-400 mt-1">Products that need attention will appear here</p>
              </div>
            )}
          </div>
        </div>

        {/* Smart Bundle Suggestions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <LightBulbIcon className="w-5 h-5 text-yellow-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Smart Bundle Suggestions</h2>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Product combinations based on customer behavior
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {bundleSuggestions.length > 0 ? (
              bundleSuggestions.map((bundle, index) => (
                <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <TagIcon className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">Bundle {index + 1}</span>
                    </div>
                    <span className="text-sm font-medium text-green-600">
                      {Math.round(bundle.confidence * 100)}% confidence
                    </span>
                  </div>
                  <div className="mb-2">
                    <p className="text-sm text-gray-700">
                      {bundle.products.join(' + ')}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500">{bundle.reason}</p>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <LightBulbIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No bundle suggestions available</p>
                <p className="text-sm text-gray-400 mt-1">Suggestions will appear based on customer viewing patterns</p>
              </div>
            )}
          </div>
        </div>

        {/* Re-engagement Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <ArrowTrendingUpIcon className="w-5 h-5 text-green-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Re-engagement Actions</h2>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Quick actions to boost engagement for viewed items
            </p>
          </div>
          <div className="divide-y divide-gray-200">
            {reengagementItems.length > 0 ? (
              reengagementItems.map((item) => (
                <div key={item.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div className="mb-3">
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-600">
                      {item.views} views • {item.daysSinceLastView} days ago
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAddDiscount(item.id, item.id)}
                      className="flex items-center px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                    >
                      <TagIcon className="w-3 h-3 mr-1" />
                      Add Discount
                    </button>
                    <button
                      onClick={() => handleFeatureOnHomepage(item.id)}
                      className="flex items-center px-3 py-1 text-xs font-medium text-purple-600 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors"
                    >
                      <StarIcon className="w-3 h-3 mr-1" />
                      Feature
                    </button>
                    <button
                      onClick={() => handleCreateEmailPrompt(item.id, item.title)}
                      className="flex items-center px-3 py-1 text-xs font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
                    >
                      <EnvelopeIcon className="w-3 h-3 mr-1" />
                      Email
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-12 text-center">
                <ArrowTrendingUpIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No re-engagement opportunities</p>
                <p className="text-sm text-gray-400 mt-1">Items needing attention will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{topViewedProducts.length}</p>
            <p className="text-sm text-gray-600">Top Products</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-600">{viewedNotPurchased.length}</p>
            <p className="text-sm text-gray-600">Need Attention</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">{bundleSuggestions.length}</p>
            <p className="text-sm text-gray-600">Bundle Ideas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{reengagementItems.length}</p>
            <p className="text-sm text-gray-600">Re-engagement</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 
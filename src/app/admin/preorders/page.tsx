"use client";

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';

interface PreorderProduct {
  productId: string;
  productName: string;
  isPreorder: boolean;
  preorderReleaseDate: string;
  preorderQuantity: number;
  preorderMaxQuantity: number;
  preorderStatus?: 'upcoming' | 'active' | 'released' | 'cancelled';
  daysUntilRelease?: number;
  title?: string;
  artist?: string;
  price?: number;
  stockQuantity?: number;
}

interface PreorderStats {
  totalPreorders: number;
  activePreorders: number;
  upcomingReleases: number;
  totalPreorderedItems: number;
  totalCapacity: number;
  capacityUtilization: number;
  estimatedRevenue: number;
  revenueByStatus: Record<string, number>;
}

interface Product {
  id: string;
  title: string;
  artist?: string;
  price: number;
  isPreorder?: boolean;
  preorderReleaseDate?: string;
  preorderQuantity?: number;
  preorderMaxQuantity?: number;
}

export default function PreordersAdmin() {
  const [preorders, setPreorders] = useState<PreorderProduct[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<PreorderStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [maxQuantity, setMaxQuantity] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPreorder, setEditingPreorder] = useState<string | null>(null);
  const [editMaxQuantity, setEditMaxQuantity] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('releaseDate');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const [preordersResponse, productsResponse] = await Promise.all([
        fetch('/api/admin/preorders'),
        fetch('/api/admin/inventory')
      ]);

      const preordersData = await preordersResponse.json();
      const productsData = await productsResponse.json();

      if (preordersData.preorders) {
        setPreorders(preordersData.preorders);
      }
      
      if (preordersData.stats) {
        setStats(preordersData.stats);
      }

      if (productsData.products) {
        setProducts(productsData.products);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load data:', error);
      setIsLoading(false);
    }
  };

  const handleCreatePreorder = async () => {
    if (!selectedProduct || !releaseDate || !maxQuantity) return;

    try {
      const response = await fetch('/api/admin/preorders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: selectedProduct,
          preorderReleaseDate: releaseDate,
          preorderMaxQuantity: parseInt(maxQuantity),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Reload all data to get updated preorders and stats
        await loadData();
        
        // Clear form
        setSelectedProduct('');
        setReleaseDate('');
        setMaxQuantity('');
        setSearchTerm('');
        
        console.log('Preorder created successfully');
      } else {
        console.error('Failed to create preorder:', data.error);
        if (data.details) {
          console.error('Validation errors:', data.details);
        }
      }
    } catch (error) {
      console.error('Failed to create preorder:', error);
    }
  };

  const handleRemovePreorder = async (productId: string) => {
    try {
      const response = await fetch(`/api/admin/preorders/${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Reload all data to get updated preorders and stats
        await loadData();
        console.log('Preorder removed successfully');
      } else {
        const data = await response.json();
        console.error('Failed to remove preorder:', data.error);
      }
    } catch (error) {
      console.error('Failed to remove preorder:', error);
    }
  };

  const handleUpdatePreorderQuantity = async (productId: string) => {
    if (!editMaxQuantity) return;

    try {
      const response = await fetch(`/api/admin/preorders/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preorderMaxQuantity: parseInt(editMaxQuantity),
        }),
      });

      if (response.ok) {
        // Reload all data to get updated preorders and stats
        await loadData();
        setEditingPreorder(null);
        setEditMaxQuantity('');
        console.log('Preorder updated successfully');
      } else {
        const data = await response.json();
        console.error('Failed to update preorder:', data.error);
        if (data.details) {
          console.error('Validation errors:', data.details);
        }
      }
    } catch (error) {
      console.error('Failed to update preorder quantity:', error);
    }
  };

  const startEditing = (preorder: PreorderProduct) => {
    setEditingPreorder(preorder.productId);
    setEditMaxQuantity(preorder.preorderMaxQuantity.toString());
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  // Filter and sort preorders
  const filteredAndSortedPreorders = preorders
    .filter(preorder => {
      if (statusFilter !== 'all' && preorder.preorderStatus !== statusFilter) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'releaseDate':
          return new Date(a.preorderReleaseDate).getTime() - new Date(b.preorderReleaseDate).getTime();
        case 'capacity':
          return (b.preorderQuantity / b.preorderMaxQuantity) - (a.preorderQuantity / a.preorderMaxQuantity);
        case 'title':
          return (a.title || a.productName).localeCompare(b.title || b.productName);
        case 'daysUntilRelease':
          return (a.daysUntilRelease || 0) - (b.daysUntilRelease || 0);
        default:
          return 0;
      }
    });

  const filteredProducts = products.filter(product => 
    product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.artist || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? product.title : 'Unknown Product';
  };

  const getStatusBadge = (status?: string, daysUntilRelease?: number) => {
    let colorClass = 'bg-gray-100 text-gray-800';
    let displayText = status || 'unknown';

    switch (status) {
      case 'active':
        colorClass = 'bg-green-100 text-green-800';
        displayText = `Active (${daysUntilRelease}d)`;
        break;
      case 'upcoming':
        colorClass = 'bg-blue-100 text-blue-800';
        displayText = `Upcoming (${daysUntilRelease}d)`;
        break;
      case 'released':
        colorClass = 'bg-yellow-100 text-yellow-800';
        displayText = 'Released';
        break;
      case 'cancelled':
        colorClass = 'bg-red-100 text-red-800';
        displayText = 'Cancelled';
        break;
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
        {displayText}
      </span>
    );
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <div className="text-center text-gray-600 text-lg">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Preorders Management</h1>
        <p className="mt-2 text-gray-600">
          Manage preorder products and their release dates
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Preorders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPreorders}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-sm">📋</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Active Preorders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activePreorders}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-sm">🎯</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPreorderedItems}</p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 text-sm">📦</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Capacity Used</p>
                <p className="text-2xl font-bold text-gray-900">{stats.capacityUtilization.toFixed(1)}%</p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 text-sm">📊</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Est. Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${stats.estimatedRevenue.toFixed(0)}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Active: ${stats.revenueByStatus.active?.toFixed(0) || '0'}
                </p>
              </div>
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                <span className="text-emerald-600 text-sm">💰</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add New Preorder */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Preorder</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchTerm && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => {
                        setSelectedProduct(product.id);
                        setSearchTerm(product.title);
                      }}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium">{product.title}</div>
                      <div className="text-sm text-gray-600">
                        {product.artist} • ${product.price.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Release Date
            </label>
            <input
              type="date"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Quantity
            </label>
            <input
              type="number"
              value={maxQuantity}
              onChange={(e) => setMaxQuantity(e.target.value)}
              placeholder="50"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleCreatePreorder}
              disabled={!selectedProduct || !releaseDate || !maxQuantity}
              className="w-full bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {selectedProduct ? `Create Preorder for ${getProductName(selectedProduct)}` : 'Create Preorder'}
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="upcoming">Upcoming</option>
                <option value="released">Released</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="releaseDate">Release Date</option>
                <option value="daysUntilRelease">Days Until Release</option>
                <option value="capacity">Capacity Used</option>
                <option value="title">Product Name</option>
              </select>
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            Showing {filteredAndSortedPreorders.length} of {preorders.length} preorders
          </div>
        </div>
      </div>

      {/* Current Preorders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Current Preorders</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Release Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Preorders
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Max Quantity
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedPreorders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <div className="text-lg font-medium">No preorders found</div>
                      <div className="text-sm mt-1">
                        {statusFilter !== 'all' 
                          ? `No preorders match the "${statusFilter}" status filter.`
                          : 'Create your first preorder to get started.'
                        }
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedPreorders.map((preorder) => (
                <tr key={preorder.productId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {preorder.title || preorder.productName}
                    </div>
                    <div className="text-sm text-gray-500">
                      {preorder.artist || 'Unknown Artist'}
                    </div>
                    <div className="text-xs text-gray-400">
                      ${preorder.price?.toFixed(2) || '0.00'} • ID: {preorder.productId.slice(-8)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(preorder.preorderStatus, preorder.daysUntilRelease)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{preorder.preorderReleaseDate ? formatDate(preorder.preorderReleaseDate) : 'Not set'}</div>
                    {preorder.daysUntilRelease !== undefined && preorder.daysUntilRelease > 0 && (
                      <div className="text-xs text-gray-400">
                        {preorder.daysUntilRelease} days remaining
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      preorder.preorderQuantity >= preorder.preorderMaxQuantity 
                        ? 'bg-red-100 text-red-800' 
                        : preorder.preorderQuantity > preorder.preorderMaxQuantity * 0.8
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {preorder.preorderQuantity} / {preorder.preorderMaxQuantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          preorder.preorderQuantity >= preorder.preorderMaxQuantity 
                            ? 'bg-red-500' 
                            : preorder.preorderQuantity > preorder.preorderMaxQuantity * 0.8
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ 
                          width: `${Math.min(100, (preorder.preorderQuantity / preorder.preorderMaxQuantity) * 100)}%` 
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {((preorder.preorderQuantity / preorder.preorderMaxQuantity) * 100).toFixed(1)}% full
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingPreorder === preorder.productId ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={editMaxQuantity}
                          onChange={(e) => setEditMaxQuantity(e.target.value)}
                          className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          min="1"
                        />
                        <button
                          onClick={() => handleUpdatePreorderQuantity(preorder.productId)}
                          className="text-blue-600 hover:text-blue-900 text-xs"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingPreorder(null);
                            setEditMaxQuantity('');
                          }}
                          className="text-gray-600 hover:text-gray-900 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <span>{preorder.preorderMaxQuantity}</span>
                        <button
                          onClick={() => startEditing(preorder)}
                          className="text-blue-600 hover:text-blue-900 text-xs"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleRemovePreorder(preorder.productId)}
                        className="text-red-600 hover:text-red-900 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
} 
"use client";

import AdminLayout from '@/components/AdminLayout';
import { useState, useEffect } from 'react';

interface Voucher {
  id: string;
  code: string;
  amount: number;
  balance: number;
  status: 'ACTIVE' | 'USED' | 'EXPIRED' | 'CANCELLED';
  customerEmail?: string;
  customerName?: string;
  purchasedAt: string;
  expiresAt?: string;
  usageHistory: {
    orderId: string;
    amount: number;
    date: string;
  }[];
  createdAt: string;
}

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newVoucher, setNewVoucher] = useState({
    amount: '',
    customerEmail: '',
    customerName: '',
    expiresAt: ''
  });
  const [showRedeemForm, setShowRedeemForm] = useState(false);
  const [redeemForm, setRedeemForm] = useState({
    voucherCode: '',
    amount: '',
    orderId: ''
  });
  const [redeemStatus, setRedeemStatus] = useState<string | null>(null);

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      const response = await fetch('/api/admin/vouchers');
      if (response.ok) {
        const data = await response.json();
        setVouchers(data.vouchers || []);
      }
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    } finally {
      setLoading(false);
    }
  };

  const redeemVoucher = async () => {
    if (!redeemForm.voucherCode || !redeemForm.amount) {
      setRedeemStatus('Please enter voucher code and amount');
      return;
    }

    try {
      const response = await fetch('/api/checkout/redeem-voucher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voucherCode: redeemForm.voucherCode.toUpperCase(),
          amount: parseFloat(redeemForm.amount),
          orderId: redeemForm.orderId || `in-store-${Date.now()}`,
          isInStore: true,
          adminUser: 'Admin' // In a real app, this would be the logged-in admin user
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setRedeemStatus(`Success! ${data.message}`);
        setRedeemForm({ voucherCode: '', amount: '', orderId: '' });
        fetchVouchers(); // Refresh the vouchers list
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          setRedeemStatus(null);
          setShowRedeemForm(false);
        }, 5000);
      } else {
        setRedeemStatus(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error redeeming voucher:', error);
      setRedeemStatus('Error redeeming voucher. Please try again.');
    }
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVoucher)
      });

      if (response.ok) {
        setShowCreateForm(false);
        setNewVoucher({
          amount: '',
          customerEmail: '',
          customerName: '',
          expiresAt: ''
        });
        fetchVouchers();
      }
    } catch (error) {
      console.error('Error creating voucher:', error);
    }
  };

  const generateVoucherCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'USED': return 'bg-blue-100 text-blue-800';
      case 'EXPIRED': return 'bg-red-100 text-red-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD'
    }).format(amount);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading vouchers...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vouchers</h1>
            <p className="mt-2 text-gray-600">
              Manage gift vouchers, track usage, and create promotional codes.
            </p>
          </div>
          <div className="space-x-3">
            <button
              onClick={() => setShowRedeemForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Redeem In-Store
            </button>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
            >
              Create Voucher
            </button>
          </div>
        </div>
      </div>

      {/* Create Voucher Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Create New Voucher</h2>
            <form onSubmit={handleCreateVoucher}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Voucher Amount ($)
                  </label>
                  <select
                    value={newVoucher.amount}
                    onChange={(e) => setNewVoucher({...newVoucher, amount: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  >
                    <option value="">Select amount</option>
                    <option value="10">$10.00</option>
                    <option value="20">$20.00</option>
                    <option value="30">$30.00</option>
                    <option value="50">$50.00</option>
                    <option value="100">$100.00</option>
                    <option value="200">$200.00</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Email (optional)
                  </label>
                  <input
                    type="email"
                    value={newVoucher.customerEmail}
                    onChange={(e) => setNewVoucher({...newVoucher, customerEmail: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="customer@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name (optional)
                  </label>
                  <input
                    type="text"
                    value={newVoucher.customerName}
                    onChange={(e) => setNewVoucher({...newVoucher, customerName: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date (optional)
                  </label>
                  <input
                    type="date"
                    value={newVoucher.expiresAt}
                    onChange={(e) => setNewVoucher({...newVoucher, expiresAt: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700"
                >
                  Create Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Redeem Voucher Modal */}
      {showRedeemForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Redeem Voucher In-Store</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Voucher Code
                </label>
                <input
                  type="text"
                  value={redeemForm.voucherCode}
                  onChange={(e) => setRedeemForm({...redeemForm, voucherCode: e.target.value.toUpperCase()})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 font-mono"
                  placeholder="Enter voucher code"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount to Redeem ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={redeemForm.amount}
                  onChange={(e) => setRedeemForm({...redeemForm, amount: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order ID (optional)
                </label>
                <input
                  type="text"
                  value={redeemForm.orderId}
                  onChange={(e) => setRedeemForm({...redeemForm, orderId: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Auto-generated if left blank"
                />
              </div>

              {redeemStatus && (
                <div className={`p-3 rounded-md text-sm ${redeemStatus.startsWith('Success') 
                  ? 'bg-green-100 text-green-700 border border-green-200' 
                  : 'bg-red-100 text-red-700 border border-red-200'
                }`}>
                  {redeemStatus}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowRedeemForm(false);
                  setRedeemStatus(null);
                  setRedeemForm({ voucherCode: '', amount: '', orderId: '' });
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={redeemVoucher}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Redeem Voucher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vouchers List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">All Vouchers</h2>
        </div>
        
        {vouchers.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            <div className="text-4xl mb-4">💳</div>
            <p>No vouchers created yet.</p>
            <p className="text-sm">Create your first voucher to start offering gift cards to customers.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {vouchers.map((voucher) => (
              <div key={voucher.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900 font-mono">
                        {voucher.code}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(voucher.status)}`}>
                        {voucher.status}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      <span className="font-medium">
                        {formatCurrency(voucher.amount)} voucher
                      </span>
                      <span className="mx-2">•</span>
                      <span>Balance: {formatCurrency(voucher.balance)}</span>
                      <span className="mx-2">•</span>
                      <span>Created {new Date(voucher.createdAt).toLocaleDateString()}</span>
                    </div>
                    {voucher.customerEmail && (
                      <div className="mt-1 text-sm text-gray-500">
                        Customer: {voucher.customerName || 'N/A'} ({voucher.customerEmail})
                      </div>
                    )}
                    {voucher.expiresAt && (
                      <div className="mt-1 text-xs text-gray-500">
                        Expires: {new Date(voucher.expiresAt).toLocaleDateString()}
                      </div>
                    )}
                    {voucher.usageHistory.length > 0 && (
                      <div className="mt-2">
                        <details className="text-sm">
                          <summary className="cursor-pointer text-blue-600 hover:text-blue-700">
                            Usage History ({voucher.usageHistory.length} transactions)
                          </summary>
                          <div className="mt-2 space-y-1">
                            {voucher.usageHistory.map((usage, index) => (
                              <div key={index} className="text-xs text-gray-600">
                                {new Date(usage.date).toLocaleDateString()}: {formatCurrency(usage.amount)} 
                                (Order: {usage.orderId})
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Edit
                    </button>
                    <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-xl mr-4">
              💳
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Vouchers</p>
              <p className="text-2xl font-bold text-gray-900">
                {vouchers.filter(v => v.status === 'ACTIVE').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-xl mr-4">
              💰
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(vouchers.reduce((sum, v) => sum + v.amount, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-xl mr-4">
              📊
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Remaining Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(vouchers.reduce((sum, v) => sum + v.balance, 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-xl mr-4">
              🎯
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Used Vouchers</p>
              <p className="text-2xl font-bold text-gray-900">
                {vouchers.filter(v => v.status === 'USED').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 
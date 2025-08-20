"use client";

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

interface Order {
  id: string;
  orderNumber: string;
  state: string;
  totalMoney: { amount: bigint; currency: string };
  totalTaxMoney: { amount: bigint; currency: string };
  totalDiscountMoney: { amount: bigint; currency: string };
  totalTipMoney: { amount: bigint; currency: string };
  lineItems: Array<{
    name: string;
    quantity: string;
    basePriceMoney: { amount: bigint; currency: string };
  }>;
  createdAt: string;
  updatedAt: string;
  customerId: string;
  fulfillment: any[];
  payment: {
    id: string;
    status: string;
    amount: { amount: bigint; currency: string };
    createdAt: string;
    receiptUrl: string;
  } | null;
  // Calculated fields
  totalAmount: number;
  itemCount: number;
  status: string;
  isPaid: boolean;
  isFulfilled: boolean;
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
        setNewStatus(data.order?.state || '');
      } else {
        console.error('Failed to fetch order');
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleStatusUpdate = async () => {
    if (!order || !newStatus) return;

    try {
      setIsUpdating(true);
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus,
          notes: notes 
        }),
      });

      if (response.ok) {
        const responseData = await response.json();
        
        // Check if this was a virtual update
        if (responseData.isVirtualUpdate) {
          alert(`${responseData.message}\n\n${responseData.note}`);
          // Update local state to reflect the virtual status change
          setOrder(prev => prev ? { ...prev, status: responseData.newStatus, state: responseData.newStatus } : null);
        } else {
          // Regular update - refresh order data
          await fetchOrder();
        }
        setNotes('');
      } else {
        const errorData = await response.json();
        console.error('Failed to update order status:', errorData);
        alert(`Failed to update order status: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = date.toLocaleTimeString('en-AU', { 
      hour12: true, 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    return `${dateStr} ${timeStr}`;
  };

  const formatCurrency = (amount: bigint, currency: string) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency
    }).format(Number(amount) / 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-orange-100 text-black">
        <Navigation />
        <div>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 font-mono">Loading order details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-orange-100 text-black">
        <Navigation />
        <div>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <p className="text-gray-600 font-mono">Order not found.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-100 text-black">
      <Navigation />
      <div>
        {/* Orange header bar */}
        <div className="bg-orange-400 py-3">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold text-black font-mono">
                ORDER #{order.orderNumber}
              </h1>
              <Link
                href="/admin/orders"
                className="text-black hover:text-gray-800 font-semibold font-mono"
              >
                ← Back to Orders
              </Link>
            </div>
          </div>
        </div>

        {/* Order Content */}
        <div className="px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Order Header */}
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2 font-mono">Order Details</h2>
                  <p className="text-gray-600 font-mono">Order ID: {order.id}</p>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(order.status)} font-mono`}>
                      {order.status}
                    </span>
                    {order.payment && (
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                        order.isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      } font-mono`}>
                        {order.isPaid ? 'Paid' : 'Pending'}
                      </span>
                    )}
                  </div>
                  {/* Quick Pay indicator */}
                  {(!order.orderNumber || order.orderNumber.startsWith('ORD-')) && (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800 font-mono">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Quick Pay Order
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-700 font-mono">Order Date</h3>
                  <p className="text-gray-900 font-mono">{formatDate(order.createdAt)}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700 font-mono">Last Updated</h3>
                  <p className="text-gray-900 font-mono">{formatDate(order.updatedAt)}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700 font-mono">Total Amount</h3>
                  <p className="text-gray-900 font-bold font-mono">
                    {formatCurrency(order.totalMoney.amount, order.totalMoney.currency)}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <h3 className="text-xl font-semibold mb-4 font-mono">Order Items</h3>
              <div className="space-y-4">
                {order.lineItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 font-mono">{item.name}</h4>
                      <p className="text-sm text-gray-600 font-mono">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 font-mono">
                        {formatCurrency(item.basePriceMoney.amount, item.basePriceMoney.currency)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Information */}
            {order.payment && (
              <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
                <h3 className="text-xl font-semibold mb-4 font-mono">Payment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-700 font-mono">Payment ID</h4>
                    <p className="text-gray-900 font-mono">{order.payment.id}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 font-mono">Payment Status</h4>
                    <p className="text-gray-900 font-mono">{order.payment.status}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 font-mono">Payment Date</h4>
                    <p className="text-gray-900 font-mono">{formatDate(order.payment.createdAt)}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 font-mono">Amount</h4>
                    <p className="text-gray-900 font-mono">
                      {formatCurrency(order.payment.amount.amount, order.payment.amount.currency)}
                    </p>
                  </div>
                </div>
                {order.payment.receiptUrl && (
                  <div className="mt-4">
                    <a
                      href={order.payment.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-mono"
                    >
                      View Receipt
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Status Update */}
            <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
              <h3 className="text-xl font-semibold mb-4 font-mono">Update Order Status</h3>
              <div className="space-y-4">
                <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2 font-mono">
                      New Status
                    </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono"
                  >
                    <option value="">Select Status</option>
                    <option value="OPEN">Open</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELED">Canceled</option>
                  </select>
                </div>
                <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2 font-mono">
                      Notes (Optional)
                    </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono"
                    placeholder="Add any notes about this status update..."
                  />
                </div>
                <button
                  onClick={handleStatusUpdate}
                  disabled={!newStatus || isUpdating}
                  className={`px-6 py-2 rounded-lg font-semibold font-mono ${
                    !newStatus || isUpdating
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  {isUpdating ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
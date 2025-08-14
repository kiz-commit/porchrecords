"use client";

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';

interface OrderHistoryItem {
  id: string;
  orderNumber: string;
  totalAmount: number;
  currency: string;
  status: string;
  createdAt: string;
  itemCount: number;
  deliveryMethod: 'pickup' | 'shipping';
}

interface CustomerVerification {
  email: string;
  orderNumber?: string;
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationForm, setVerificationForm] = useState<CustomerVerification>({
    email: '',
    orderNumber: ''
  });

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationForm.email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Process order number - add "order-" prefix if customer entered just a number
    let processedOrderNumber = verificationForm.orderNumber;
    if (processedOrderNumber && !processedOrderNumber.startsWith('order-')) {
      // If it's just numbers, add the prefix
      if (/^\d+$/.test(processedOrderNumber)) {
        processedOrderNumber = `order-${processedOrderNumber}`;
      }
    }

    try {
      const response = await fetch('/api/orders/verify-customer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...verificationForm,
          orderNumber: processedOrderNumber
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.verified) {
          setIsVerified(true);
          setOrders(data.orders || []);
        } else {
          setError('No orders found for this email address. Please check your email or contact us for assistance.');
        }
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Verification failed');
      }
    } catch (error) {
      console.error('Error verifying customer:', error);
      setError('Failed to verify customer. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toISOString().split('T')[0];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-800';
      case 'PENDING':
        return 'text-yellow-800';
      case 'FAILED':
        return 'text-red-800';
      case 'OPEN':
        return 'text-orange-800';
      default:
        return 'text-gray-800';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'rgba(34, 197, 94, 0.1)';
      case 'PENDING':
        return 'rgba(234, 179, 8, 0.1)';
      case 'FAILED':
        return 'rgba(239, 68, 68, 0.1)';
      case 'OPEN':
        return 'rgba(249, 115, 22, 0.1)';
      default:
        return 'rgba(156, 163, 175, 0.1)';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Completed';
      case 'PENDING':
        return 'Processing';
      case 'FAILED':
        return 'Failed';
      case 'OPEN':
        return 'Incomplete';
      case 'UNKNOWN':
        return 'Unknown';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen text-black" style={{ backgroundColor: 'var(--color-offwhite)' }}>
      <Navigation />
      <div>
        {/* Header bar */}
        <div className="py-3" style={{ backgroundColor: 'var(--color-clay)' }}>
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-lg font-bold text-black font-mono">
              ORDER HISTORY
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2 font-mono">Your Orders</h2>
              <p className="text-gray-600 font-mono">Track your orders and view order details</p>
            </div>

            {!isVerified ? (
              /* Customer Verification Form */
              <div className="bg-white rounded-lg shadow-sm p-8">
                <div className="text-center mb-6">
                  <div className="text-blue-600 text-6xl mb-4">🔐</div>
                  <h3 className="text-xl font-semibold mb-2 font-mono">Verify Your Identity</h3>
                  <p className="text-gray-600 font-mono">
                    Enter your email address to view your order history. For security, we'll verify your identity.
                  </p>
                </div>

                <form onSubmit={handleVerification} className="max-w-md mx-auto">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 font-mono">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={verificationForm.email}
                        onChange={(e) => setVerificationForm({ ...verificationForm, email: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none text-base font-mono"
                        style={{ '--tw-ring-color': 'var(--color-clay)' } as React.CSSProperties}
                        placeholder="Enter your email address"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 font-mono">
                        Order Number (Optional)
                      </label>
                      <input
                        type="text"
                        value={verificationForm.orderNumber || ''}
                        onChange={(e) => setVerificationForm({ ...verificationForm, orderNumber: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none text-base font-mono"
                        style={{ '--tw-ring-color': 'var(--color-clay)' } as React.CSSProperties}
                        placeholder="e.g., 1753225211148 (just the number)"
                      />
                      <p className="text-xs text-gray-500 mt-1 font-mono">
                        Just enter the number - we'll add the "order-" prefix automatically
                      </p>
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-600 text-sm font-mono">{error}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full px-6 py-3 text-white rounded-lg disabled:cursor-not-allowed font-semibold font-mono"
                      style={{
                        backgroundColor: isLoading ? 'rgb(156, 163, 175)' : 'var(--color-clay)'
                      }}
                      onMouseEnter={(e) => {
                        if (!isLoading) {
                          e.currentTarget.style.backgroundColor = 'var(--color-mustard)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isLoading) {
                          e.currentTarget.style.backgroundColor = 'var(--color-clay)';
                        }
                      }}
                    >
                      {isLoading ? 'Verifying...' : 'View My Orders'}
                    </button>
                  </div>
                </form>

                <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2 text-blue-900 font-mono">Need Help?</h4>
                  <p className="text-sm text-blue-800 mb-3 font-mono">
                    If you're having trouble accessing your orders, you can:
                  </p>
                  <ul className="text-sm text-blue-800 space-y-1 font-mono">
                    <li>• Contact us at info@porchrecords.com.au</li>
                    <li>• Call us at (08) 1234 5678</li>
                    <li>• Visit our store for in-person assistance</li>
                  </ul>
                </div>
              </div>
            ) : (
              /* Order History Display */
              <>
                {orders.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                    <div className="text-gray-400 text-6xl mb-4">📦</div>
                    <h3 className="text-xl font-semibold mb-2 font-mono">No Orders Found</h3>
                    <p className="text-gray-600 mb-6 font-mono">
                      No orders were found for {verificationForm.email}. Please check your email address or contact us for assistance.
                    </p>
                    <button
                      onClick={() => setIsVerified(false)}
                      className="px-6 py-3 text-white rounded-lg font-mono"
                      style={{ backgroundColor: 'var(--color-clay)' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-mustard)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--color-clay)';
                      }}
                    >
                      Try Different Email
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <p className="text-sm text-gray-600 font-mono">
                        Showing orders for: <span className="font-semibold font-mono">{verificationForm.email}</span>
                      </p>
                      <button
                        onClick={() => setIsVerified(false)}
                        className="text-sm font-mono"
                        style={{ color: 'var(--color-clay)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--color-mustard)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--color-clay)';
                        }}
                      >
                        Change Email
                      </button>
                    </div>
                    
                    {orders.map((order) => (
                      <div key={order.id} className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <h3 className="font-semibold text-lg font-mono">{order.orderNumber}</h3>
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full font-mono`}
                                    style={{
                                      backgroundColor: getStatusBgColor(order.status),
                                      color: getStatusColor(order.status)
                                    }}>
                                {getStatusText(order.status)}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <p className="font-mono">Placed on {formatDate(order.createdAt)}</p>
                              <p className="font-mono">{order.itemCount} item{order.itemCount !== 1 ? 's' : ''} • {order.deliveryMethod}</p>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <div className="text-right">
                              <p className="font-bold text-lg font-mono">
                                {formatCurrency(order.totalAmount, order.currency)}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <a
                                href={`/store/success?orderId=${order.id}`}
                                className="px-4 py-2 text-white rounded-lg text-sm font-mono"
                                style={{ backgroundColor: 'var(--color-clay)' }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = 'var(--color-mustard)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'var(--color-clay)';
                                }}
                              >
                                View Details
                              </a>
                              <a
                                href={`https://squareup.com/dashboard/orders/${order.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-mono"
                              >
                                Square Portal
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Square Customer Portal Info */}
            <div className="mt-8 bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3 text-blue-900 font-mono">Square Customer Portal</h3>
              <p className="text-blue-800 mb-4 font-mono">
                For detailed order management, receipts, and customer support, visit your Square customer portal.
              </p>
              <a
                href="https://squareup.com/dashboard/customers"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-mono"
              >
                Access Customer Portal
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
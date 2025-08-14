"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { useCartContext } from '@/contexts/CartContext';
import { useAnalytics } from '@/hooks/useAnalytics';

interface OrderConfirmation {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  currency: string;
  status: string;
  createdAt: string;
  lineItems: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  payment: {
    id: string;
    status: string;
    receiptUrl?: string;
  };
  customerInfo: {
    name?: string;
    email?: string;
    deliveryMethod: 'pickup' | 'shipping';
  };
}

function OrderConfirmationContent() {
  const searchParams = useSearchParams();
  const [orderConfirmation, setOrderConfirmation] = useState<OrderConfirmation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const { clearCart, markOrderCompleted } = useCartContext();
  const { trackPurchase, trackPageView } = useAnalytics();

  useEffect(() => {
    // Primary sources: URL params (from Next) and a hard fallback to window.location
    let orderId = searchParams.get('orderId') || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('orderId') : null);
    const paymentId = searchParams.get('paymentId') || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('paymentId') : null);
    const quickPayOrderId = searchParams.get('quickPayOrderId');
    const ref = searchParams.get('ref');

    const recoverFromLocalStorage = () => {
      if (orderId) return;
      try {
        const savedId = localStorage.getItem('lastQuickPayOrderId');
        const savedAt = Number(localStorage.getItem('lastQuickPayOrderSavedAt') || '0');
        if (savedId && Date.now() - savedAt < 30 * 60 * 1000) {
          orderId = savedId;
        }
        // Also recover by reference id if present
        if (!orderId && !ref) {
          const lastRef = localStorage.getItem('lastOrderReferenceId');
          if (lastRef) {
            // Use the recovered ref for downstream lookup
            (ref as any) = lastRef; // type escape in client code
          }
        }
      } catch {}
    };

    const lookupByRef = async () => {
      if (!orderId && ref) {
        try {
          const resp = await fetch(`/api/orders/lookup-by-ref?ref=${encodeURIComponent(ref)}`);
          if (resp.ok) {
            const data = await resp.json();
            if (data?.orderId) orderId = data.orderId;
          }
        } catch {}
      }
    };

    const init = async () => {
      if (hasInitialized) return;
      recoverFromLocalStorage();
      if (!orderId && ref) {
        await lookupByRef();
      }
      if (orderId) {
        setError(null);
        setHasInitialized(true);
        processPreorderUpdatesForOrder(orderId);
        const orderIdToFetch = quickPayOrderId || orderId;
        fetchOrderConfirmation(orderIdToFetch, paymentId);
        clearCart();
        markOrderCompleted();
      }
    };

    init();
  }, [searchParams, hasInitialized]);

  // If after a short delay no orderId is present, show a friendly error
  useEffect(() => {
    if (hasInitialized) return;
    const timer = setTimeout(() => {
      let orderId = searchParams.get('orderId') || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('orderId') : null);
      const ref = searchParams.get('ref') || (typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('ref') : null);
      if (!orderId) {
        try {
          orderId = localStorage.getItem('lastQuickPayOrderId') || null;
        } catch {}
      }
      if (!orderId && ref) {
        // A lookup may still be in-flight; keep spinner until main effect resolves
        return;
      }
      if (!orderId && !ref) {
        try {
          const lastRef = localStorage.getItem('lastOrderReferenceId');
          if (lastRef) return; // main effect will attempt lookup
        } catch {}
      }
      if (!orderId) {
        setError('No order ID provided');
        setIsLoading(false);
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [searchParams, hasInitialized]);

  // Track page view and purchases when order confirmation loads
  useEffect(() => {
    if (trackPageView) {
      trackPageView('/store/success', 'Order Success');
    }
    
    if (orderConfirmation && trackPurchase) {
      // Track the purchase
      trackPurchase(
        orderConfirmation.orderId,
        orderConfirmation.totalAmount,
        {
          orderNumber: orderConfirmation.orderNumber,
          lineItems: orderConfirmation.lineItems,
          customerInfo: orderConfirmation.customerInfo
        }
      );
    }
  }, [orderConfirmation, trackPageView, trackPurchase]);

  const processPreorderUpdatesForOrder = async (orderId: string) => {
    try {
      console.log('Processing preorder updates for order:', orderId);
      
      // Get cart items from localStorage before they're cleared
      const cartData = localStorage.getItem('cart');
      if (!cartData) {
        console.log('No cart data found for preorder processing');
        return;
      }
      
      const cart = JSON.parse(cartData);
      const cartItems = cart.items || [];
      
      if (cartItems.length === 0) {
        console.log('No cart items found for preorder processing');
        return;
      }
      
      // Process each cart item for potential preorder updates
      for (const item of cartItems) {
        if (item.product && item.product.id && item.quantity) {
          try {
            const response = await fetch('/api/admin/preorders/update-quantity', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                productId: item.product.id,
                quantityChange: parseInt(item.quantity),
                orderId: orderId
              }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
              console.log('Preorder quantity updated successfully:', {
                orderId: orderId,
                productId: item.product.id,
                productName: item.product.title,
                quantityAdded: item.quantity,
                newQuantity: result.preorder?.preorderQuantity
              });
            } else if (response.status === 404) {
              // Not a preorder item, which is fine
              console.log('Item is not a preorder product:', {
                productId: item.product.id,
                productName: item.product.title
              });
            } else {
              console.warn('Failed to update preorder quantity:', {
                orderId: orderId,
                productId: item.product.id,
                productName: item.product.title,
                error: result.error
              });
            }

          } catch (error) {
            console.error('Error updating preorder quantity for item:', {
              orderId: orderId,
              productId: item.product.id,
              productName: item.product.title,
              error: error
            });
          }
        }
      }
      
    } catch (error) {
      console.error('Error processing preorder updates:', error);
    }
  };

  const fetchOrderConfirmation = async (orderId: string, paymentId?: string | null) => {
    try {
      setIsLoading(true);
      const url = paymentId 
        ? `/api/orders/${orderId}/confirmation?paymentId=${paymentId}`
        : `/api/orders/${orderId}/confirmation`;
      
      console.log('Fetching order confirmation:', { orderId, paymentId, url });
      
      const response = await fetch(url);
      
      console.log('Order confirmation response:', { status: response.status, ok: response.ok });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Order confirmation data received:', data);
        setOrderConfirmation(data.order);
      } else {
        console.warn('Order confirmation API returned error:', response.status);
        // Create a fallback order confirmation for better UX
        const fallbackOrder = {
          orderId: orderId,
          orderNumber: `ORD-${orderId.slice(-6).toUpperCase()}`,
          totalAmount: 0,
          currency: 'AUD',
          status: 'COMPLETED',
          createdAt: new Date().toISOString(),
          lineItems: [],
          payment: {
            id: paymentId || 'unknown',
            status: 'COMPLETED',
            receiptUrl: undefined
          },
          customerInfo: {
            name: '',
            email: '',
            deliveryMethod: 'pickup' as 'pickup' | 'shipping'
          }
        };
        setOrderConfirmation(fallbackOrder);
      }
    } catch (error) {
      console.error('Error fetching order confirmation:', error);
      // Create a fallback order confirmation for better UX
      const fallbackOrder = {
        orderId: orderId,
        orderNumber: `ORD-${orderId.slice(-6).toUpperCase()}`,
        totalAmount: 0,
        currency: 'AUD',
        status: 'COMPLETED',
        createdAt: new Date().toISOString(),
        lineItems: [],
        payment: {
          id: paymentId || 'unknown',
          status: 'COMPLETED',
          receiptUrl: undefined
        },
        customerInfo: {
          name: '',
          email: '',
          deliveryMethod: 'pickup' as 'pickup' | 'shipping'
        }
      };
      setOrderConfirmation(fallbackOrder);
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
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 font-mono">Loading order confirmation...</p>
        </div>
      </div>
    );
  }

  if (error || !orderConfirmation) {
    return (
      <div className="min-h-screen bg-orange-100 text-black">
        <Navigation />
        <div>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="text-red-600 text-6xl mb-4">❌</div>
              <h1 className="text-2xl font-bold mb-2 font-mono">Order Confirmation Error</h1>
              <p className="text-gray-600 mb-4 font-mono">{error || 'Unable to load order confirmation'}</p>
              <a
                href="/store"
                className="inline-flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-mono"
              >
                Return to Store
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Orange header bar */}
      <div className="bg-orange-400 py-3">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-lg font-bold text-black font-mono">
            ORDER CONFIRMED
          </h1>
        </div>
      </div>

      {/* Success Content */}
      <div className="px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="text-green-600 text-6xl mb-4">✅</div>
            <h1 className="text-3xl font-bold mb-2 font-mono">Thank You!</h1>
            <p className="text-gray-600 font-mono">Your order has been successfully placed</p>
          </div>

          {/* Order Details */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h2 className="text-xl font-semibold mb-4 font-mono">Order Details</h2>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600 font-mono">Order Number:</span>
                <span className="font-semibold font-mono">{orderConfirmation.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-mono">Order Date:</span>
                <span className="font-mono">{formatDate(orderConfirmation.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-mono">Status:</span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(orderConfirmation.status)} font-mono`}>
                  {orderConfirmation.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-mono">Delivery Method:</span>
                <span className="capitalize font-mono">{orderConfirmation.customerInfo.deliveryMethod}</span>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h3 className="text-lg font-semibold mb-4 font-mono">Order Items</h3>
            <div className="space-y-3">
              {orderConfirmation.lineItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                  <div>
                    <p className="font-medium font-mono">{item.name}</p>
                    <p className="text-sm text-gray-600 font-mono">Quantity: {item.quantity}</p>
                  </div>
                  <p className="font-semibold font-mono">
                    {formatCurrency(item.price, orderConfirmation.currency)}
                  </p>
                </div>
              ))}
              
              {/* GST Breakdown */}
              <div className="pt-3 border-t border-gray-300">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 font-mono">Subtotal (GST Free):</span>
                  <span className="font-mono">$22.73</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600 font-mono">GST (10%):</span>
                  <span className="font-mono">$2.27</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-300">
                  <span className="text-lg font-semibold font-mono">Total (Including GST)</span>
                  <span className="text-lg font-bold font-mono">
                    {formatCurrency(orderConfirmation.totalAmount, orderConfirmation.currency)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h3 className="text-lg font-semibold mb-4 font-mono">Payment Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600 font-mono">Payment ID:</span>
                <span className="font-mono text-sm">{orderConfirmation.payment.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 font-mono">Payment Status:</span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(orderConfirmation.payment.status)} font-mono`}>
                  {orderConfirmation.payment.status}
                </span>
              </div>
              {orderConfirmation.payment.receiptUrl && (
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex gap-3">
                    <a
                      href={orderConfirmation.payment.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-mono"
                    >
                      📄 Download Receipt
                    </a>
                    <a
                      href={`https://squareup.com/receipt/preview/${orderConfirmation.payment.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-mono"
                    >
                      🔗 View Receipt
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Next Steps */}
          <div className="bg-blue-50 p-6 rounded-lg shadow-sm mb-6">
            <h3 className="text-lg font-semibold mb-4 text-blue-900 font-mono">What's Next?</h3>
            <div className="space-y-3 text-blue-800">
              <div className="flex items-start">
                <span className="text-blue-600 mr-3 font-mono">1.</span>
                <p className="font-mono">You'll receive an email confirmation with your order details</p>
              </div>
              <div className="flex items-start">
                <span className="text-blue-600 mr-3 font-mono">2.</span>
                <p className="font-mono">We'll process your order and update you on the status</p>
              </div>
              <div className="flex items-start">
                <span className="text-blue-600 mr-3 font-mono">3.</span>
                <p className="font-mono">For shipping orders, you'll receive tracking information</p>
              </div>
              <div className="flex items-start">
                <span className="text-blue-600 mr-3 font-mono">4.</span>
                <p className="font-mono">For pickup orders, we'll contact you when ready</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="/store"
              className="flex-1 text-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-semibold font-mono"
            >
              Continue Shopping
            </a>
            <a
              href="/order-history"
              className="flex-1 text-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold font-mono"
            >
              View Order History
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen bg-orange-100 text-black">
      <Navigation />
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 font-mono">Loading order confirmation...</p>
          </div>
        </div>
      }>
        <OrderConfirmationContent />
      </Suspense>
    </div>
  );
} 
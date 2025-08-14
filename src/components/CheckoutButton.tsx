"use client";

import { useState } from 'react';
import { useCartContext } from '@/contexts/CartContext';

interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface CheckoutButtonProps {
  onError: (error: string) => void;
  deliveryMethod?: 'pickup' | 'shipping' | 'email';
  shippingAddress?: ShippingAddress;
  appliedDiscount?: {
    id: string;
    name: string;
    type: 'PERCENTAGE' | 'FIXED_AMOUNT';
    percentage?: string;
    amount?: number;
    discountAmount: number;
  } | null;
  automaticDiscounts?: {
    id: string;
    name: string;
    type: 'PERCENTAGE' | 'FIXED_AMOUNT';
    percentage?: string;
    amount?: number;
    discountAmount: number;
  }[];
  total?: number;
  onValidateShipping?: () => boolean;
}

export default function CheckoutButton({ onError, deliveryMethod = 'pickup', shippingAddress, appliedDiscount, automaticDiscounts, total, onValidateShipping }: CheckoutButtonProps) {
  const { cart } = useCartContext();
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    if (cart.items.length === 0) {
      onError('Your cart is empty');
      return;
    }

    // Validate shipping address if required
    if (deliveryMethod === 'shipping' && onValidateShipping && !onValidateShipping()) {
      return; // Error already set by validation function
    }

    // Check if cart contains voucher products
    const voucherItems = cart.items.filter(item => item.product.productType === 'voucher');
    const hasVouchers = voucherItems.length > 0;

    setIsLoading(true);

    try {
      // Use the calculated total from the parent component
      const finalTotal = total || cart.totalPrice + (deliveryMethod === 'shipping' ? 12.00 : 0);

      // Create payment link
      const response = await fetch('/api/checkout/create-payment-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartItems: cart.items,
          total: finalTotal,
          appliedDiscount: appliedDiscount,
          automaticDiscounts: automaticDiscounts,
          customerInfo: shippingAddress || {
            firstName: '', // Will be collected on Square's checkout
            lastName: '',
            email: '', // Will be collected on Square's checkout
            phone: '', // Will be collected on Square's checkout
            address: '',
            city: '',
            state: '',
            postalCode: '',
            country: 'AU'
          },
          deliveryMethod: deliveryMethod,
          hasVouchers: hasVouchers,
          voucherItems: voucherItems
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const result = await response.json();

      if (result.success && result.checkoutUrl) {
        // Persist identifiers locally so the success page can recover them after redirect
        try {
          if (result.orderId) {
            localStorage.setItem('lastQuickPayOrderId', String(result.orderId));
            localStorage.setItem('lastQuickPayOrderSavedAt', String(Date.now()));
          }
          if (result.paymentLinkId) {
            localStorage.setItem('lastPaymentLinkId', String(result.paymentLinkId));
          }
          if (result.orderNumber) {
            localStorage.setItem('lastOrderReferenceId', String(result.orderNumber));
          }
        } catch {}

        // Redirect to Square Checkout
        window.location.href = result.checkoutUrl;
      } else {
        throw new Error('Invalid response from checkout API');
      }

    } catch (error) {
      console.error('Checkout error:', error);
      onError(error instanceof Error ? error.message : 'Checkout failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={isLoading || cart.items.length === 0}
      className={`w-full py-4 px-6 font-bold text-lg border-2 transition-all duration-200 rounded-xl shadow-sm ${
        isLoading || cart.items.length === 0
          ? 'cursor-not-allowed'
          : ''
      }`}
      style={{
        backgroundColor: isLoading || cart.items.length === 0
          ? 'rgb(229, 231, 235)'
          : 'var(--color-clay)',
        color: isLoading || cart.items.length === 0
          ? 'rgb(156, 163, 175)'
          : 'var(--color-black)',
        borderColor: isLoading || cart.items.length === 0
          ? 'rgb(229, 231, 235)'
          : 'var(--color-clay)'
      }}
      onMouseEnter={(e) => {
        if (!isLoading && cart.items.length > 0) {
          e.currentTarget.style.backgroundColor = 'var(--color-mustard)';
          e.currentTarget.style.transform = 'scale(1.02)';
          e.currentTarget.style.boxShadow = '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isLoading && cart.items.length > 0) {
          e.currentTarget.style.backgroundColor = 'var(--color-clay)';
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
        }
      }}
      onMouseDown={(e) => {
        if (!isLoading && cart.items.length > 0) {
          e.currentTarget.style.transform = 'scale(0.98)';
        }
      }}
      onMouseUp={(e) => {
        if (!isLoading && cart.items.length > 0) {
          e.currentTarget.style.transform = 'scale(1.02)';
        }
      }}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 mr-3" style={{ borderColor: 'var(--color-black)' }}></div>
          <span>Creating Checkout...</span>
        </div>
      ) : (
        <div className="flex items-center justify-center">
          <span>💳 Checkout Securely - ${(total !== undefined ? total : cart.totalPrice + (deliveryMethod === 'shipping' ? 12.00 : 0)).toFixed(2)}</span>
        </div>
      )}
    </button>
  );
} 
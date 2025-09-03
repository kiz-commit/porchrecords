"use client";

import { useEffect, useMemo, useRef, useState } from 'react';

type DeliveryMethod = 'pickup' | 'shipping' | 'email';

interface WebPaymentsCheckoutProps {
  cartItems: any[];
  deliveryMethod: DeliveryMethod;
  customerInfo?: any;
  appliedDiscount?: any;
  automaticDiscounts?: any[];
  onSuccess?: (data: { paymentId: string }) => void;
  onError?: (message: string) => void;
  beforePay?: () => boolean | Promise<boolean>;
}

export default function WebPaymentsCheckout(props: WebPaymentsCheckoutProps) {
  const { cartItems, deliveryMethod, customerInfo, appliedDiscount, automaticDiscounts, onSuccess, onError, beforePay } = props;
  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [cardInstance, setCardInstance] = useState<any>(null);
  const cardRef = useRef<any>(null);
  const attachedRef = useRef(false);
  const attachLockRef = useRef(false);

  const canCheckout = useMemo(() => Array.isArray(cartItems) && cartItems.length > 0, [cartItems]);

  // Pre-initialize the SDK and card element on mount so fields are visible immediately
  useEffect(() => {
    const init = async () => {
      try {
        const appId = (process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID || '') as string;
        const locId = (process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID || '') as string;
        
        console.log('🔍 Square SDK Initialization Debug:', {
          appId: appId ? `${appId.substring(0, 15)}...` : 'MISSING',
          locId: locId || 'MISSING',
          environment: appId.startsWith('sandbox-') ? 'sandbox' : 'production',
          attachedRef: attachedRef.current,
          attachLockRef: attachLockRef.current
        });

        if (!appId || !locId) {
          console.error('❌ Missing Square credentials:', { appId: !!appId, locId: !!locId });
          setSdkError('Square payment configuration is missing. Please contact support.');
          onError?.('Square payment configuration is missing. Please contact support.');
          return;
        }

        if (attachedRef.current) {
          console.log('⏭️ SDK already attached, skipping initialization');
          return;
        }

        const env: 'sandbox' | 'production' = appId.startsWith('sandbox-') ? 'sandbox' : 'production';
        console.log('🔧 Loading Square SDK for environment:', env);
        
        await loadSquareSdk(env);
        console.log('✅ Square SDK loaded successfully');

        const payments = (window as any).Square?.payments(appId, locId, { environment: env });
        if (!payments) {
          console.error('❌ Failed to initialize Square payments object');
          setSdkError('Unable to initialize payment system. Please refresh and try again.');
          onError?.('Unable to initialize payment system. Please refresh and try again.');
          return;
        }
        console.log('✅ Square payments object created');

        const container = document.getElementById('card-container');
        if (!container) {
          console.error('❌ Card container element not found in DOM');
          setSdkError('Payment form container not found. Please refresh and try again.');
          onError?.('Payment form container not found. Please refresh and try again.');
          return;
        }
        console.log('✅ Card container found');

        if (container.querySelector('.sq-card-wrapper') || attachLockRef.current) {
          console.log('⏭️ Card already attached or attachment in progress');
          setSdkReady(true);
          return;
        }

        attachLockRef.current = true;
        console.log('🔧 Attaching card form to container...');
        
        container.innerHTML = '';
        const card = await payments.card({
          style: {
            '.input-container.is-focus': {
              borderColor: '#f97316'
            },
            '.input-container': {
              borderColor: '#d1d5db',
              borderRadius: '8px'
            }
          }
        });
        
        await card.attach('#card-container');
        console.log('✅ Card form attached successfully');
        
        setCardInstance(card);
        cardRef.current = card;
        setSdkReady(true);
        attachedRef.current = true;
        attachLockRef.current = false;
        
        console.log('🎉 Square SDK initialization complete');
      } catch (e) {
        console.error('❌ Preload Web Payments SDK failed:', e);
        attachLockRef.current = false;
        const errorMessage = `Payment system initialization failed: ${e instanceof Error ? e.message : 'Unknown error'}. Please refresh and try again.`;
        setSdkError(errorMessage);
        onError?.(errorMessage);
      }
    };
    init();
    return () => {
      try {
        attachedRef.current = false;
        if (cardRef.current && typeof cardRef.current.destroy === 'function') {
          cardRef.current.destroy();
        }
        const container = document.getElementById('card-container');
        if (container) container.innerHTML = '';
      } catch {}
    };
  }, []);

  const handlePay = async () => {
    if (!canCheckout) return;
    setLoading(true);
    try {
      if (beforePay) {
        const ok = await Promise.resolve(beforePay());
        if (!ok) { setLoading(false); return; }
      }
      // 1) Create order on server
      const orderResp = await fetch('/api/checkout/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cartItems, deliveryMethod, customerInfo, appliedDiscount, automaticDiscounts })
      });
      const orderData = await orderResp.json();
      if (!orderResp.ok || !orderData?.success) throw new Error(orderData?.error || 'Failed to create order');

      const { orderId } = orderData;

      // 2) Get payment token and environment info
      const tokenResp = await fetch('/api/checkout/payments/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      });
      const tokenData = await tokenResp.json();
      if (!tokenResp.ok || !tokenData?.success) throw new Error(tokenData?.error || 'Failed to get payment token');

      const { applicationId, locationId, idempotencyKey, environment } = tokenData;

      // 3) Ensure card element exists (initialize on demand if not ready yet)
      let card = cardInstance || cardRef.current;
      if (!card) {
        const resolvedEnv = (environment || (String(applicationId).startsWith('sandbox-') ? 'sandbox' : 'production')) as 'sandbox' | 'production';
        await loadSquareSdk(resolvedEnv);
        const payments = (window as any).Square?.payments(applicationId, locationId, { environment: resolvedEnv });
        if (!payments) throw new Error('Square payments SDK failed to initialize');
        const container = document.getElementById('card-container');
        if (!container) throw new Error('Missing card container');
        if (!container.querySelector('.sq-card-wrapper')) {
          container.innerHTML = '';
          card = await payments.card();
          await card.attach('#card-container');
        } else {
          card = cardRef.current;
        }
        setCardInstance(card);
        cardRef.current = card;
        setSdkReady(true);
      }

      // 4) Tokenize and charge
      const tokenResult = await card.tokenize();
      if (tokenResult.status !== 'OK') throw new Error('Card tokenization failed');

      const chargeResp = await fetch('/api/checkout/payments/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, sourceId: tokenResult.token, idempotencyKey })
      });
      const chargeData = await chargeResp.json();
      if (!chargeResp.ok || !chargeData?.success) throw new Error(chargeData?.error || 'Payment failed');

      // If cart includes voucher items, trigger voucher creation (best-effort)
      try {
        const voucherItems = Array.isArray(cartItems) ? cartItems.filter((i: any) => i?.product?.productType === 'voucher') : [];
        if (voucherItems.length > 0) {
          const totalVoucherAmount = voucherItems.reduce((sum: number, i: any) => sum + Number(i?.product?.price || 0) * (parseInt(String(i?.quantity ?? 1)) || 1), 0);
          const email = customerInfo?.email || '';
          const customerName = `${customerInfo?.firstName || ''} ${customerInfo?.lastName || ''}`.trim();
          if (email) {
            await fetch('/api/webhooks/voucher-creation', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId, customerEmail: email, voucherAmount: Number(totalVoucherAmount.toFixed(2)), customerName })
            });
          }
        }
      } catch {}

      // Redirect to success page with orderId for confirmation
      const qs = new URLSearchParams({ orderId, paymentId: chargeData.paymentId || '' }).toString();
      window.location.href = `/store/success?${qs}`;
      onSuccess?.({ paymentId: chargeData.paymentId });
    } catch (e: any) {
      onError?.(e?.message || 'Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div id="card-container" className="mb-4" />
      
      {/* Loading indicator */}
      {!sdkReady && !sdkError && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            <span className="text-blue-700 text-sm">Loading secure payment form...</span>
          </div>
        </div>
      )}
      
      {/* Error indicator */}
      {sdkError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <div className="text-red-600 mr-2">⚠️</div>
            <span className="text-red-700 text-sm">{sdkError}</span>
          </div>
          <button
            onClick={() => {
              setSdkError(null);
              window.location.reload();
            }}
            className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-xs rounded"
          >
            Retry
          </button>
        </div>
      )}
      
      <button
        onClick={handlePay}
        disabled={!canCheckout || loading || !sdkReady || !!sdkError}
        className="w-full py-3 rounded-md border disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing…' : 'Pay Now'}
      </button>
    </div>
  );
}

async function loadSquareSdk(env: 'sandbox' | 'production'): Promise<void> {
  if ((window as any).Square) {
    console.log('⏭️ Square SDK already loaded');
    return;
  }
  
  console.log('📦 Loading Square SDK...');
  const sdkUrl = env === 'sandbox'
    ? 'https://sandbox.web.squarecdn.com/v1/square.js'
    : 'https://web.squarecdn.com/v1/square.js';
  
  console.log(`🔗 SDK URL: ${sdkUrl}`);
  
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = sdkUrl;
    script.async = true;
    script.onload = () => {
      console.log('✅ Square SDK script loaded successfully');
      // Give a moment for the SDK to initialize
      setTimeout(() => {
        if ((window as any).Square) {
          console.log('✅ Square SDK object available');
          resolve();
        } else {
          console.error('❌ Square SDK script loaded but Square object not available');
          reject(new Error('Square SDK loaded but not available'));
        }
      }, 100);
    };
    script.onerror = (error) => {
      console.error('❌ Failed to load Square SDK script:', error);
      reject(new Error('Failed to load Square SDK'));
    };
    document.head.appendChild(script);
  });
}



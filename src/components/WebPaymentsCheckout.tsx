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
        if (!appId || !locId || attachedRef.current) return;
        const env: 'sandbox' | 'production' = appId.startsWith('sandbox-') ? 'sandbox' : 'production';
        await loadSquareSdk(env);
        const payments = (window as any).Square?.payments(appId, locId, { environment: env });
        if (!payments) return;
        const container = document.getElementById('card-container');
        if (!container) return;
        if (container.querySelector('.sq-card-wrapper') || attachLockRef.current) {
          setSdkReady(true);
          return;
        }
        attachLockRef.current = true;
        container.innerHTML = '';
        const card = await payments.card();
        await card.attach('#card-container');
        setCardInstance(card);
        cardRef.current = card;
        setSdkReady(true);
        attachedRef.current = true;
        attachLockRef.current = false;
      } catch (e) {
        console.error('Preload Web Payments SDK failed:', e);
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
      <button
        onClick={handlePay}
        disabled={!canCheckout || loading || !sdkReady}
        className="w-full py-3 rounded-md border"
      >
        {loading ? 'Processing…' : 'Pay Now'}
      </button>
    </div>
  );
}

async function loadSquareSdk(env: 'sandbox' | 'production'): Promise<void> {
  if ((window as any).Square) return;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = env === 'sandbox'
      ? 'https://sandbox.web.squarecdn.com/v1/square.js'
      : 'https://web.squarecdn.com/v1/square.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Square SDK'));
    document.head.appendChild(script);
  });
}



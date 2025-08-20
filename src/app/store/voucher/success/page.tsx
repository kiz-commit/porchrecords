"use client";

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface VoucherData {
  code: string;
  amount: number;
  expiresAt: string;
}

function VoucherSuccessContent() {
  const [voucher, setVoucher] = useState<VoucherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const createVoucher = async () => {
      try {
        const orderId = searchParams.get('orderId');
        const customerEmail = searchParams.get('customerEmail');
        const voucherAmount = searchParams.get('voucherAmount');
        const customerName = searchParams.get('customerName');

        if (!orderId || !customerEmail || !voucherAmount) {
          setError('Missing required information for voucher creation');
          setLoading(false);
          return;
        }

        // Create voucher
        const response = await fetch('/api/webhooks/voucher-creation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId,
            customerEmail,
            voucherAmount: parseFloat(voucherAmount),
            customerName
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setVoucher(data.voucher);
        } else {
          setError('Failed to create voucher');
        }
      } catch (error) {
        console.error('Error creating voucher:', error);
        setError('An error occurred while creating your voucher');
      } finally {
        setLoading(false);
      }
    };

    createVoucher();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg">Creating your voucher...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">❌ {error}</div>
          <Link href="/store" className="text-blue-600 hover:text-blue-700">
            Back to Store
          </Link>
        </div>
      </div>
    );
  }

  if (!voucher) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg mb-4">No voucher data available</div>
          <Link href="/store" className="text-blue-600 hover:text-blue-700">
            Back to Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8 text-center">
            {/* Success Icon */}
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <div className="text-3xl">🎉</div>
            </div>

            {/* Success Message */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Voucher Created Successfully!
            </h1>
            <p className="text-gray-600 text-lg mb-8">
              Your gift voucher has been generated and will be sent to your email shortly.
            </p>

            {/* Voucher Details */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Voucher Details</h2>
              <div className="space-y-3 text-left">
                <div className="flex justify-between">
                  <span className="text-gray-600">Voucher Code:</span>
                  <span className="font-mono font-bold text-lg bg-white px-3 py-1 rounded border">
                    {voucher.code}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-bold text-lg">${voucher.amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Expires:</span>
                  <span className="font-medium">
                    {new Date(voucher.expiresAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Use Your Voucher</h3>
              <ul className="text-blue-800 space-y-2 text-left">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">1.</span>
                  <span>Keep this voucher code safe - you&apos;ll need it during checkout</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">2.</span>
                  <span>When making a purchase, enter the voucher code in the discount field</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">3.</span>
                  <span>The voucher amount will be deducted from your total</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">4.</span>
                  <span>You can use the voucher multiple times until the balance is exhausted</span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <Link
                href="/store"
                className="inline-block w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Continue Shopping
              </Link>
              <Link
                href="/order-history"
                className="inline-block w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                View Order History
              </Link>
            </div>

            {/* Email Notice */}
            <p className="text-sm text-gray-500 mt-6">
              A confirmation email with your voucher details has been sent to your email address.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VoucherSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    }>
      <VoucherSuccessContent />
    </Suspense>
  );
} 
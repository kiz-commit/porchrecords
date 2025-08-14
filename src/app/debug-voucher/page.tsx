"use client";

import { useState, useEffect } from 'react';

export default function DebugVoucherPage() {
  const [status, setStatus] = useState('Initializing...');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const testVoucher = async () => {
      try {
        setStatus('Fetching products...');
        const response = await fetch('/api/products/cache');
        
        if (!response.ok) {
          setStatus(`API error: ${response.status}`);
          return;
        }
        
        const result = await response.json();
        setStatus('API call successful');
        setData(result);
        
        const voucher = result.products.find((p: any) => p.id === 'ABW6CPAJEC5OQ7Y2IS25BTFN');
        if (voucher) {
          setStatus(`Found voucher: ${voucher.title}`);
        } else {
          setStatus('Voucher not found');
        }
        
      } catch (error) {
        setStatus(`Error: ${error}`);
      }
    };

    testVoucher();
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Voucher Debug</h1>
      <div className="mb-4">
        <strong>Status:</strong> {status}
      </div>
      {data && (
        <div className="mb-4">
          <strong>API Response:</strong>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
      <div className="mb-4">
        <a 
          href="/store/voucher-product/ABW6CPAJEC5OQ7Y2IS25BTFN"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Test Voucher Page
        </a>
      </div>
    </div>
  );
} 
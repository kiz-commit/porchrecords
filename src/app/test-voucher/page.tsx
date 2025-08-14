"use client";

import { useState, useEffect } from 'react';

export default function TestVoucherPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('/api/products/cache');
        if (response.ok) {
          const data = await response.json();
          console.log('Products data:', data);
          setProducts(data.products || []);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  const voucherProducts = products.filter(p => p.productType === 'voucher');

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Voucher Test Page</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold">All Products ({products.length})</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(products, null, 2)}
        </pre>
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold">Voucher Products ({voucherProducts.length})</h2>
        {voucherProducts.map(product => (
          <div key={product.id} className="border p-4 rounded mb-2">
            <h3 className="font-medium">{product.title}</h3>
            <p>ID: {product.id}</p>
            <p>Price: ${product.price}</p>
            <p>Description: {product.description}</p>
            <p>Type: {product.productType}</p>
            <a 
              href={`/store/voucher/${product.id}`}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              View Voucher Page
            </a>
          </div>
        ))}
      </div>
    </div>
  );
} 
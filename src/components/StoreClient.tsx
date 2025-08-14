"use client";

import ProductCard from './ProductCard';
import { type StoreProduct } from '@/lib/types';

interface StoreClientProps {
  initialProducts: StoreProduct[];
}

export default function StoreClient({ 
  initialProducts
}: StoreClientProps) {
  return (
    <>
      {/* Product Grid - House of Darwin style */}
      {initialProducts.length > 0 ? (
        <div className="min-h-screen" style={{ backgroundColor: 'var(--color-offwhite)' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-l"
               style={{ borderColor: 'var(--color-black)' }}>
            {initialProducts.map((product) => (
              <div key={product.id} className="border-r border-b"
                   style={{ borderColor: 'var(--color-black)' }}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="min-h-screen flex items-center justify-center"
             style={{ backgroundColor: 'var(--color-offwhite)' }}>
          <div className="text-center">
            <p className="text-lg font-mono" style={{ color: 'var(--color-black)' }}>No items found matching your search.</p>
            <p className="text-sm mt-2 font-mono" style={{ color: 'var(--color-black)', opacity: 0.7 }}>Try adjusting your filters or search terms.</p>
          </div>
        </div>
      )}
    </>
  );
} 
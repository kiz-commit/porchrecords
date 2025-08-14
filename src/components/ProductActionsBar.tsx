"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartContext } from '@/contexts/CartContext';
import { type StoreProduct } from '@/lib/types';

interface ProductActionsBarProps {
  product: StoreProduct;
  className?: string;
  selectedVariationId?: string;
}

export default function ProductActionsBar({ 
  product, 
  className = '',
  selectedVariationId
}: ProductActionsBarProps) {
  const { addToCart, isInCart, getItemQuantity } = useCartContext();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const router = useRouter();

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    
    // Simulate a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // If we have a selected variation, create a product with that variation's data
    const productToAdd = selectedVariationId && product.variations ? {
      ...product,
      id: selectedVariationId, // Use variation ID for cart
      price: product.variations.find(v => v.id === selectedVariationId)?.price || product.price,
      size: product.variations.find(v => v.id === selectedVariationId)?.size || product.size,
      title: `${product.title} - ${product.variations.find(v => v.id === selectedVariationId)?.name || 'Selected Size'}`
    } : product;
    
    addToCart(productToAdd, 1);
    setIsAddingToCart(false);
  };

  const handleCheckoutNow = async () => {
    setIsCheckingOut(true);
    
    try {
      // If we have a selected variation, create a product with that variation's data
      const productToAdd = selectedVariationId && product.variations ? {
        ...product,
        id: selectedVariationId, // Use variation ID for cart
        price: product.variations.find(v => v.id === selectedVariationId)?.price || product.price,
        size: product.variations.find(v => v.id === selectedVariationId)?.size || product.size,
        title: `${product.title} - ${product.variations.find(v => v.id === selectedVariationId)?.name || 'Selected Size'}`
      } : product;
      
      // Only add to cart if not already in cart
      if (!isInCart(productToAdd.id)) {
        addToCart(productToAdd, 1);
        // Small delay for cart update
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Navigate to checkout
      router.push('/checkout');
    } catch (error) {
      console.error('Error during checkout now:', error);
      setIsCheckingOut(false);
    }
  };

  // Check if the selected variation is in cart, or fall back to the main product
  const cartItemId = selectedVariationId || product.id;
  const isInCartItem = isInCart(cartItemId);
  const quantity = getItemQuantity(cartItemId);

  // Handle different product states
  const isSoldOut = product.stockStatus === 'out_of_stock';
  const isPreorder = product.isPreorder;
  const isPreorderSoldOut = isPreorder && product.preorderQuantity >= product.preorderMaxQuantity;

  if (isSoldOut) {
    return (
      <div className={`${className}`}>
        <div className="w-full py-4 px-6 text-lg font-bold font-mono uppercase tracking-wide text-center rounded border-2"
          style={{
            backgroundColor: 'rgb(75, 85, 99)',
            borderColor: 'rgb(75, 85, 99)',
            color: 'white'
          }}
        >
          Sold Out
        </div>
      </div>
    );
  }

  if (isPreorderSoldOut) {
    return (
      <div className={`${className}`}>
        <div className="w-full py-4 px-6 text-lg font-bold font-mono uppercase tracking-wide text-center rounded border-2"
          style={{
            backgroundColor: 'rgb(234, 88, 12)',
            borderColor: 'rgb(194, 65, 12)',
            color: 'white'
          }}
        >
          Pre-order Sold Out
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Preorder Visual Indicator */}
      {isPreorder && (
        <div className="bg-gradient-to-r from-orange-400 to-orange-500 text-white p-4 rounded-lg border-2 border-orange-600">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-lg">📅</span>
            <span className="font-bold font-mono text-lg uppercase tracking-wide">Pre-Order</span>
          </div>
          <p className="text-center text-sm font-mono mb-1">
            {product.preorderReleaseDate 
              ? `Ships ${new Date(product.preorderReleaseDate).toLocaleDateString('en-AU', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
              : 'Ships when available'
            }
          </p>
          {product.preorderMaxQuantity > 0 && (
            <p className="text-center text-xs font-mono opacity-90">
              {product.preorderMaxQuantity - product.preorderQuantity} of {product.preorderMaxQuantity} slots remaining
            </p>
          )}
        </div>
      )}

      {/* Dynamic Button - Changes based on cart state */}
      {!isInCartItem ? (
        // Show Add to Cart when not in cart
        <button
          onClick={handleAddToCart}
          disabled={isAddingToCart || isCheckingOut}
          className="w-full py-4 px-6 text-lg font-bold font-mono uppercase tracking-wide transition-all border-2 rounded"
          style={{
            backgroundColor: isAddingToCart || isCheckingOut ? 'rgb(209, 213, 219)' : 'var(--color-clay)',
            borderColor: isAddingToCart || isCheckingOut ? 'rgb(209, 213, 219)' : 'var(--color-clay)',
            color: isAddingToCart || isCheckingOut ? 'rgb(107, 114, 128)' : 'var(--color-black)',
            cursor: isAddingToCart || isCheckingOut ? 'not-allowed' : 'pointer'
          }}
          onMouseEnter={(e) => {
            if (!isAddingToCart && !isCheckingOut) {
              e.currentTarget.style.backgroundColor = 'var(--color-mustard)';
              e.currentTarget.style.borderColor = 'var(--color-mustard)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isAddingToCart && !isCheckingOut) {
              e.currentTarget.style.backgroundColor = 'var(--color-clay)';
              e.currentTarget.style.borderColor = 'var(--color-clay)';
            }
          }}
        >
          {isAddingToCart ? 'Adding...' : isPreorder ? 'Pre-order Now' : 'Add to Cart'}
        </button>
      ) : (
        // Show Checkout Now when in cart, with option to add more
        <div className="space-y-3">
          <button
            onClick={handleCheckoutNow}
            disabled={isAddingToCart || isCheckingOut}
            className="w-full py-4 px-6 text-lg font-bold font-mono uppercase tracking-wide transition-all border-2 rounded"
            style={{
              backgroundColor: isAddingToCart || isCheckingOut ? 'rgb(229, 231, 235)' : 'var(--color-mustard)',
              borderColor: isAddingToCart || isCheckingOut ? 'rgb(209, 213, 219)' : 'var(--color-mustard)',
              color: isAddingToCart || isCheckingOut ? 'rgb(107, 114, 128)' : 'var(--color-black)',
              cursor: isAddingToCart || isCheckingOut ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={(e) => {
              if (!isAddingToCart && !isCheckingOut) {
                e.currentTarget.style.backgroundColor = 'var(--color-black)';
                e.currentTarget.style.borderColor = 'var(--color-black)';
                e.currentTarget.style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (!isAddingToCart && !isCheckingOut) {
                e.currentTarget.style.backgroundColor = 'var(--color-mustard)';
                e.currentTarget.style.borderColor = 'var(--color-mustard)';
                e.currentTarget.style.color = 'var(--color-black)';
              }
            }}
          >
            {isCheckingOut ? 'Going to Checkout...' : '🛒 Checkout Now'}
          </button>

          {/* In Cart Indicator with Add More option */}
          <div className="text-center py-2 border-t border-gray-200">
            <p className="text-sm font-mono mb-2" style={{ color: 'var(--color-clay)' }}>
              ✓ In cart ({quantity})
            </p>
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className="text-sm font-mono underline hover:no-underline transition-all"
              style={{ color: 'var(--color-clay)' }}
            >
              {isAddingToCart ? 'Adding...' : '+ Add another'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
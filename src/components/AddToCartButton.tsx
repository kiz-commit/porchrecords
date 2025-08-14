"use client";

import { useState } from 'react';
import { useCartContext } from '@/contexts/CartContext';
import { type StoreProduct } from '@/lib/types';
import { useAnalytics } from '@/lib/analytics-collector';

interface AddToCartButtonProps {
  product: StoreProduct;
  className?: string;
  variant?: 'primary' | 'secondary';
}

export default function AddToCartButton({ 
  product, 
  className = '', 
  variant = 'primary' 
}: AddToCartButtonProps) {
  const { addToCart, isInCart, getItemQuantity } = useCartContext();
  const [isLoading, setIsLoading] = useState(false);
  const { trackAddToCart } = useAnalytics();

  const handleAddToCart = async () => {
    setIsLoading(true);
    
    // Simulate a small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    addToCart(product, 1);
    
    // Track add to cart event
    if (trackAddToCart) {
      trackAddToCart(
        product.id,
        product.title,
        product.price,
        1,
        product.id
      );
    }
    
    setIsLoading(false);
  };

  const isInCartItem = isInCart(product.id);
  const quantity = getItemQuantity(product.id);

  // Handle different product states
  const isSoldOut = product.stockStatus === 'out_of_stock';
  const isPreorder = product.isPreorder;

  const baseClasses = "font-bold text-lg border transition-colors px-6 py-3";
  const primaryClasses = "text-black";
  const secondaryClasses = "text-gray-700";
  const soldOutClasses = "text-white cursor-not-allowed";
  const preorderClasses = "text-white";
  
  let buttonClasses = `${baseClasses} `;
  
  if (isSoldOut) {
    buttonClasses += soldOutClasses;
  } else if (isPreorder) {
    buttonClasses += preorderClasses;
  } else {
    buttonClasses += variant === 'primary' ? primaryClasses : secondaryClasses;
  }
  
  buttonClasses += ` ${className}`;

  // If sold out, show disabled button
  if (isSoldOut) {
    return (
      <button
        disabled
        className={`${buttonClasses} opacity-75`}
        style={{
          backgroundColor: 'rgb(220, 38, 38)',
          borderColor: 'rgb(185, 28, 28)'
        }}
      >
        SOLD OUT
      </button>
    );
  }

  // If preorder, show preorder button
  if (isPreorder) {
    if (isInCartItem) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            In cart ({quantity})
          </span>
          <button
            onClick={handleAddToCart}
            disabled={isLoading}
            className={`${buttonClasses} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{
              backgroundColor: 'rgb(22, 163, 74)',
              borderColor: 'rgb(21, 128, 61)'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = 'rgb(21, 128, 61)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = 'rgb(22, 163, 74)';
              }
            }}
          >
            {isLoading ? 'Adding...' : '+ Add More'}
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={handleAddToCart}
        disabled={isLoading}
        className={`${buttonClasses} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        style={{
          backgroundColor: 'rgb(22, 163, 74)',
          borderColor: 'rgb(21, 128, 61)'
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.backgroundColor = 'rgb(21, 128, 61)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isLoading) {
            e.currentTarget.style.backgroundColor = 'rgb(22, 163, 74)';
          }
        }}
      >
        {isLoading ? 'Adding...' : 'PRE-ORDER'}
      </button>
    );
  }

  // Regular product (in stock)
  if (isInCartItem) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">
          In cart ({quantity})
        </span>
        <button
          onClick={handleAddToCart}
          disabled={isLoading}
          className={`${buttonClasses} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          style={{
            backgroundColor: variant === 'primary' ? 'var(--color-clay)' : 'rgb(229, 231, 235)',
            borderColor: variant === 'primary' ? 'var(--color-clay)' : 'rgb(209, 213, 219)'
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = variant === 'primary' ? 'var(--color-mustard)' : 'rgb(209, 213, 219)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = variant === 'primary' ? 'var(--color-clay)' : 'rgb(229, 231, 235)';
            }
          }}
        >
          {isLoading ? 'Adding...' : '+ Add More'}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleAddToCart}
      disabled={isLoading}
      className={`${buttonClasses} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={{
        backgroundColor: variant === 'primary' ? 'var(--color-clay)' : 'rgb(229, 231, 235)',
        borderColor: variant === 'primary' ? 'var(--color-clay)' : 'rgb(209, 213, 219)'
      }}
      onMouseEnter={(e) => {
        if (!isLoading) {
          e.currentTarget.style.backgroundColor = variant === 'primary' ? 'var(--color-mustard)' : 'rgb(209, 213, 219)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isLoading) {
          e.currentTarget.style.backgroundColor = variant === 'primary' ? 'var(--color-clay)' : 'rgb(229, 231, 235)';
        }
      }}
    >
      {isLoading ? 'Adding...' : 'Add to Cart'}
    </button>
  );
} 
"use client";

import { useCartContext } from '@/contexts/CartContext';
import { useState, useEffect } from 'react';

export default function CartRecoveryNotification() {
  const { cartRecoveryAvailable, showRecoveryNotification, recoverCart, dismissRecovery } = useCartContext();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (showRecoveryNotification && cartRecoveryAvailable) {
      // Show notification after a brief delay to ensure proper mounting
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [showRecoveryNotification, cartRecoveryAvailable]);

  if (!isVisible || !cartRecoveryAvailable) {
    return null;
  }

  const savedDate = new Date(cartRecoveryAvailable.savedAt).toLocaleDateString();
  const timeAgo = getTimeAgo(cartRecoveryAvailable.savedAt);

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
      <div 
        className="rounded-lg shadow-lg p-6 border-l-4"
        style={{ 
          backgroundColor: 'var(--color-offwhite)', 
          borderColor: 'var(--color-clay)',
          border: '1px solid var(--color-clay)'
        }}
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6" style={{ color: 'var(--color-clay)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-lg font-bold font-mono" style={{ color: 'var(--color-black)' }}>
              Welcome back!
            </h3>
            <p className="text-sm font-mono mt-1" style={{ color: 'var(--color-black)' }}>
              You have {cartRecoveryAvailable.itemCount} item{cartRecoveryAvailable.itemCount !== 1 ? 's' : ''} saved in your cart from {timeAgo}.
            </p>
            <p className="text-xs font-mono mt-1" style={{ color: 'rgba(24, 24, 24, 0.7)' }}>
              Saved on {savedDate}
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={recoverCart}
                className="px-4 py-2 text-sm font-bold font-mono rounded transition-colors"
                style={{ 
                  backgroundColor: 'var(--color-clay)', 
                  color: 'white',
                  border: '1px solid var(--color-clay)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-mustard)';
                  e.currentTarget.style.borderColor = 'var(--color-mustard)';
                  e.currentTarget.style.color = 'var(--color-black)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-clay)';
                  e.currentTarget.style.borderColor = 'var(--color-clay)';
                  e.currentTarget.style.color = 'white';
                }}
              >
                Restore Cart
              </button>
              <button
                onClick={() => dismissRecovery(true)}
                className="px-4 py-2 text-sm font-medium font-mono rounded border transition-colors"
                style={{ 
                  backgroundColor: 'transparent', 
                  color: 'var(--color-black)',
                  borderColor: 'var(--color-black)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(24, 24, 24, 0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Start Fresh
              </button>
            </div>
          </div>
          <button
            onClick={() => dismissRecovery(false)}
            className="flex-shrink-0 ml-3 p-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            <svg className="h-5 w-5" style={{ color: 'var(--color-black)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(dateString: string): string {
  const now = new Date();
  const savedDate = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - savedDate.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  }
}
"use client";

import { useCartContext } from '@/contexts/CartContext';

export default function CartDebug() {
  const { cart, clearCart, clearCartFromStorage, debugCartStorage } = useCartContext();

  const handleClearCart = () => {
    clearCart();
    console.log('Cart cleared via clearCart()');
  };

  const handleClearStorage = () => {
    clearCartFromStorage();
    console.log('Cart cleared from localStorage');
  };

  const handleDebugStorage = () => {
    debugCartStorage();
  };

  return (
    <div className="fixed bottom-4 right-4 rounded-lg p-4 z-50" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
      <h3 className="font-bold mb-2" style={{ color: 'rgb(153, 27, 27)' }}>Cart Debug</h3>
      <div className="text-sm mb-2" style={{ color: 'rgb(185, 28, 28)' }}>
        Items: {cart.totalItems} | Total: ${cart.totalPrice.toFixed(2)}
      </div>
      <div className="space-y-1">
        <button
          onClick={handleClearCart}
          className="block w-full px-2 py-1 rounded text-xs"
          style={{ backgroundColor: 'rgb(239, 68, 68)', color: 'white' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgb(220, 38, 38)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgb(239, 68, 68)';
          }}
        >
          Clear Cart
        </button>
        <button
          onClick={handleClearStorage}
          className="block w-full px-2 py-1 rounded text-xs"
          style={{ backgroundColor: 'var(--color-clay)', color: 'white' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-mustard)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-clay)';
          }}
        >
          Clear Storage
        </button>
        <button
          onClick={handleDebugStorage}
          className="block w-full px-2 py-1 rounded text-xs"
          style={{ backgroundColor: 'rgb(59, 130, 246)', color: 'white' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgb(37, 99, 235)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgb(59, 130, 246)';
          }}
        >
          Debug Storage
        </button>
      </div>
    </div>
  );
} 
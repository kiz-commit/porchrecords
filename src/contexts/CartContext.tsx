"use client";

import { createContext, useContext, ReactNode } from 'react';
import { useCart, type CartItem, type CartState, type CartRecoveryData } from '@/hooks/useCart';

interface CartContextType {
  cart: CartState;
  addToCart: (product: any, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
  isInCart: (productId: string) => boolean;
  clearCartFromStorage: () => void;
  debugCartStorage: () => void;
  markOrderCompleted: () => void;
  // Cart recovery functions
  cartRecoveryAvailable: CartRecoveryData | null;
  showRecoveryNotification: boolean;
  recoverCart: () => void;
  dismissRecovery: (clearCurrentCart?: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const cartHook = useCart();

  return (
    <CartContext.Provider value={cartHook}>
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
} 
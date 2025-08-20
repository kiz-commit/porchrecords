"use client";

import { useState, useEffect, useCallback } from 'react';
import { type StoreProduct } from '@/lib/types';

export interface CartItem {
  id: string;
  product: StoreProduct;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
}

export interface CartRecoveryData {
  cart: CartState;
  savedAt: string;
  expiresAt: string;
  sessionId: string;
  itemCount: number;
}

export function useCart() {
  const [cart, setCart] = useState<CartState>({
    items: [],
    totalItems: 0,
    totalPrice: 0,
  });
  const [cartRecoveryAvailable, setCartRecoveryAvailable] = useState<CartRecoveryData | null>(null);
  const [showRecoveryNotification, setShowRecoveryNotification] = useState(false);

  // Generate a simple session ID for this browser session
  const getSessionId = () => {
    let sessionId = sessionStorage.getItem('porch-session-id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('porch-session-id', sessionId);
    }
    return sessionId;
  };

  // Enhanced cart saving with recovery data
  const saveCartWithRecovery = useCallback((cartData: CartState) => {
    if (cartData.items.length === 0) {
      localStorage.removeItem('porch-cart-recovery');
      return;
    }

    const recoveryData: CartRecoveryData = {
      cart: cartData,
      savedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      sessionId: getSessionId(),
      itemCount: cartData.items.length
    };

    try {
      localStorage.setItem('porch-cart-recovery', JSON.stringify(recoveryData));
    } catch (error) {
      console.error('Error saving cart recovery data:', error);
    }
  }, []);

  // Check for recoverable cart
  const checkForRecoverableCart = useCallback((currentCart: CartState) => {
    try {
      const recoveryData = localStorage.getItem('porch-cart-recovery');
      if (!recoveryData) return null;

      const parsed: CartRecoveryData = JSON.parse(recoveryData);
      const now = new Date();
      const expiresAt = new Date(parsed.expiresAt);

      // Check if cart has expired
      if (now > expiresAt) {
        localStorage.removeItem('porch-cart-recovery');
        return null;
      }

      // Only show recovery if:
      // 1. Cart is from a different session
      // 2. Recovery cart has items
      // 3. Current cart is empty (don't interfere with existing items)
      const currentSessionId = getSessionId();
      if (parsed.sessionId !== currentSessionId && 
          parsed.cart.items.length > 0 && 
          currentCart.items.length === 0) {
        return parsed;
      }

      return null;
    } catch (error) {
      console.error('Error checking recoverable cart:', error);
      localStorage.removeItem('porch-cart-recovery');
      return null;
    }
  }, []);

  // Recover cart from recovery data
  const recoverCart = () => {
    if (cartRecoveryAvailable) {
      setCart(cartRecoveryAvailable.cart);
      setCartRecoveryAvailable(null);
      setShowRecoveryNotification(false);
      console.log('Cart recovered successfully');
    }
  };

  // Dismiss recovery notification and optionally clear current cart
  const dismissRecovery = (clearCurrentCart: boolean = false) => {
    setCartRecoveryAvailable(null);
    setShowRecoveryNotification(false);
    localStorage.removeItem('porch-cart-recovery');
    
    if (clearCurrentCart) {
      clearCart();
    }
  };

  // Debug function to clear cart data from localStorage
  const clearCartFromStorage = () => {
    try {
      localStorage.removeItem('porch-cart');
      localStorage.removeItem('porch-cart-recovery');
      console.log('Cart data cleared from localStorage');
    } catch (error) {
      console.error('Error clearing cart from localStorage:', error);
    }
  };

  // Debug function to check cart data in localStorage
  const debugCartStorage = () => {
    try {
      const savedCart = localStorage.getItem('porch-cart');
      const recoveryCart = localStorage.getItem('porch-cart-recovery');
      console.log('Current cart data in localStorage:', savedCart);
      console.log('Recovery cart data in localStorage:', recoveryCart);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        console.log('Parsed cart data:', parsed);
      }
      if (recoveryCart) {
        const parsedRecovery = JSON.parse(recoveryCart);
        console.log('Parsed recovery data:', parsedRecovery);
      }
    } catch (error) {
      console.error('Error reading cart from localStorage:', error);
    }
  };

  // Clear cart function
  const clearCart = useCallback(() => {
    setCart({
      items: [],
      totalItems: 0,
      totalPrice: 0,
    });
  }, []);

  // Check if we should clear cart based on URL or recent order
  const checkAndClearCartIfNeeded = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    // Check if we're on a success page
    if (window.location.pathname.includes('/success')) {
      clearCart();
      console.log('Cart cleared due to success page');
      return;
    }
    
    // Check if there's a recent order in sessionStorage
    const lastOrderTime = sessionStorage.getItem('last-order-time');
    if (lastOrderTime) {
      const orderTime = parseInt(lastOrderTime);
      const now = Date.now();
      const timeDiff = now - orderTime;
      
      // If order was within last 5 minutes, clear cart
      if (timeDiff < 5 * 60 * 1000) {
        clearCart();
        sessionStorage.removeItem('last-order-time');
        console.log('Cart cleared due to recent order');
      }
    }
  }, [clearCart]);

  // Load cart and check for recovery on mount
  useEffect(() => {
    // First load current session cart
    let currentCart = { items: [], totalItems: 0, totalPrice: 0 };
    const savedCart = localStorage.getItem('porch-cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        console.log('Loading cart from localStorage:', parsedCart);
        currentCart = parsedCart;
        setCart(parsedCart);
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        localStorage.removeItem('porch-cart');
      }
    }

    // Then check for cart recovery (only if current cart is empty)
    const recoverableCart = checkForRecoverableCart(currentCart);
    if (recoverableCart) {
      setCartRecoveryAvailable(recoverableCart);
      setShowRecoveryNotification(true);
      console.log('Cart recovery available:', recoverableCart);
    }

    // Check and clear cart if needed (success page, recent order)
    checkAndClearCartIfNeeded();
  }, [checkAndClearCartIfNeeded, checkForRecoverableCart]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    console.log('Saving cart to localStorage:', cart);
    localStorage.setItem('porch-cart', JSON.stringify(cart));
    // Also save recovery data
    saveCartWithRecovery(cart);
  }, [cart, saveCartWithRecovery]);

  // Calculate totals whenever items change
  useEffect(() => {
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    
    // Only update if totals have actually changed to avoid infinite loops
    if (totalItems !== cart.totalItems || totalPrice !== cart.totalPrice) {
      setCart(prev => ({
        ...prev,
        totalItems,
        totalPrice,
      }));
    }
  }, [cart.items, cart.totalItems, cart.totalPrice]);

  const addToCart = (product: StoreProduct, quantity: number = 1) => {
    setCart(prev => {
      const existingItem = prev.items.find(item => item.id === product.id);
      
      if (existingItem) {
        // Update existing item quantity
        const updatedItems = prev.items.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
        return { ...prev, items: updatedItems };
      } else {
        // Add new item
        const newItem: CartItem = {
          id: product.id,
          product,
          quantity,
        };
        return { ...prev, items: [...prev.items, newItem] };
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== productId),
    }));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === productId
          ? { ...item, quantity }
          : item
      ),
    }));
  };

  const markOrderCompleted = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('last-order-time', Date.now().toString());
      console.log('Order completion marked');
    }
  };

  const getItemQuantity = (productId: string) => {
    const item = cart.items.find(item => item.id === productId);
    return item ? item.quantity : 0;
  };

  const isInCart = (productId: string) => {
    return cart.items.some(item => item.id === productId);
  };

  return {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getItemQuantity,
    isInCart,
    clearCartFromStorage,
    debugCartStorage,
    markOrderCompleted,
    // Cart recovery functions
    cartRecoveryAvailable,
    showRecoveryNotification,
    recoverCart,
    dismissRecovery,
  };
} 
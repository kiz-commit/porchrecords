"use client";

import { useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import { useCartContext } from '@/contexts/CartContext';
import { CompactErrorDisplay } from '@/components/ErrorDisplay';
import InventoryAlert, { InventorySummary } from '@/components/InventoryAlert';
import { useInventoryValidation } from '@/hooks/useInventoryValidation';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCartContext();
  const router = useRouter();
  const [automaticDiscounts, setAutomaticDiscounts] = useState<any[]>([]);
  
  // Enhanced inventory validation
  const {
    issues: inventoryIssues,
    isValidating: isCheckingInventory,
    validateInventory,
    getIssueForItem,
    hasBlockingIssues,
    canProceedToCheckout,
    summary: inventorySummary
  } = useInventoryValidation();




  // GST calculation (GST is included in displayed prices in Australia)
  const GST_RATE = 0.10;
  const subtotal = cart.totalPrice; // This already includes GST
  const automaticDiscountAmount = automaticDiscounts.reduce((sum, discount) => sum + discount.discountAmount, 0);
  const finalTotal = Math.max(0, subtotal - automaticDiscountAmount);
  const subtotalExcludingGST = subtotal / (1 + GST_RATE);
  const gstAmount = subtotal - subtotalExcludingGST;



  const fetchAutomaticDiscounts = useCallback(async () => {
    if (cart.items.length === 0) {
      setAutomaticDiscounts([]);
      return;
    }

    try {
      const productData = cart.items.map(item => ({
        id: item.product.id,
        price: item.product.price,
        quantity: item.quantity,
        productType: item.product.productType || 'record',
        merchCategory: item.product.merchCategory || ''
      }));
      
      const response = await fetch('/api/checkout/get-automatic-discounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          products: productData
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAutomaticDiscounts(data.automaticDiscounts || []);
      }
    } catch (error) {
      console.error('Error fetching automatic discounts:', error);
    }
  }, [cart.items]);

  // Check inventory and fetch automatic discounts when cart changes
  useEffect(() => {
    if (cart.items.length > 0) {
      validateInventory(cart.items);
      fetchAutomaticDiscounts();
    } else {
      setAutomaticDiscounts([]);
    }
  }, [cart.items, validateInventory, fetchAutomaticDiscounts]);

  // Handle inventory alert actions
  const handleInventoryUpdate = async (itemId: string, newQuantity: number) => {
    try {
      await updateQuantity(itemId, newQuantity);
      // Validation will be triggered by the useEffect
    } catch (error) {
      console.error('Failed to update quantity:', error);
    }
  };

  const handleInventoryRemove = async (itemId: string) => {
    try {
      await removeFromCart(itemId);
      // Validation will be triggered by the useEffect
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const handleFixAllInventoryIssues = async () => {
    try {
      // Remove out of stock items and update quantities for others
      const promises = inventoryIssues.map(issue => {
        if (issue.issue === 'out_of_stock' || issue.availableQuantity === 0) {
          return removeFromCart(issue.itemId);
        } else if (issue.availableQuantity > 0) {
          return updateQuantity(issue.itemId, issue.availableQuantity);
        }
        return Promise.resolve();
      });
      
      await Promise.all(promises);
    } catch (error) {
      console.error('Failed to fix inventory issues:', error);
    }
  };

  const handleQuantityUpdate = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }

    // Check if this would exceed inventory
    const item = cart.items.find(i => i.id === itemId);
    if (item) {
      const tempCart = {
        items: cart.items.map(i => 
          i.id === itemId ? { ...i, quantity: newQuantity } : i
        )
      };

      try {
        const response = await fetch('/api/checkout/validate-inventory', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ cartItems: tempCart.items }),
        });

        if (response.ok) {
          const result = await response.json();
          const itemValidation = result.validationResults.find((v: any) => v.itemId === itemId);
          
          if (itemValidation && !itemValidation.isAvailable) {
            // Don't update quantity if it exceeds inventory
            return;
          }
        }
      } catch (error) {
        console.error('Failed to validate quantity:', error);
      }
    }

    updateQuantity(itemId, newQuantity);
  };

  const handleCheckout = () => {
    if (cart.items.length === 0) return;
    
    // Redirect to checkout - the checkout page will use the full cart from CartContext
    router.push('/checkout');
  };

  const handleContinueShopping = () => {
    router.push('/store');
  };



  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen text-black" style={{ backgroundColor: 'var(--color-offwhite)' }}>
        <Navigation />
        <div>
          {/* Header bar */}
          <div className="py-3" style={{ backgroundColor: 'var(--color-clay)' }}>
            <div className="max-w-7xl mx-auto px-4">
              <h1 className="text-lg font-bold text-black font-mono">
                SHOPPING CART
              </h1>
            </div>
          </div>

          {/* Empty Cart Content */}
          <div className="px-6 lg:px-8 py-8">
            <div className="max-w-2xl mx-auto text-center">
              <div className="bg-white p-8 rounded-lg shadow-sm">
                <div className="mb-6">
                  <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                  </svg>
                  <h2 className="text-2xl font-bold mb-2 font-mono">Your cart is empty</h2>
                  <p className="text-gray-600 font-mono">Add some records to get started!</p>
                </div>
                
                <button
                  onClick={handleContinueShopping}
                  className="text-black py-3 px-6 font-bold text-lg border transition-colors font-mono"
                  style={{
                    backgroundColor: 'var(--color-clay)',
                    borderColor: 'var(--color-clay)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-mustard)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-clay)';
                  }}
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-black" style={{ backgroundColor: 'var(--color-offwhite)' }}>
      <Navigation />
      <div>
        {/* Header bar */}
        <div className="py-3" style={{ backgroundColor: 'var(--color-clay)' }}>
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-lg font-bold text-black font-mono">
              SHOPPING CART ({cart.totalItems} items)
            </h1>
          </div>
        </div>

        {/* Cart Content */}
        <div className="px-6 lg:px-8 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold font-mono">Cart Items</h2>
                  </div>
                  
                  {/* Inventory Summary */}
                  {inventoryIssues.length > 0 && (
                    <InventorySummary
                      issues={inventoryIssues}
                      onFixAll={handleFixAllInventoryIssues}
                      className="mb-6"
                    />
                  )}

                  <div className="divide-y divide-gray-200">
                    {cart.items.map((item) => (
                      <div key={item.id} className="p-6">
                        <div className="flex items-center gap-4">
                          {/* Product Image */}
                          <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0">
                            <Image 
                              src={item.product.image} 
                              alt={item.product.title}
                              className="w-full h-full object-cover rounded-lg"
                              width={80}
                              height={80}
                            />
                          </div>
                          
                          {/* Product Details */}
                          <div className="flex-1">
                            <h3 className="font-bold text-lg font-mono">{item.product.title}</h3>
                            <p className="text-gray-600 text-sm font-mono">
                              {item.product.productType === 'voucher' ? 'Gift Voucher' : 'Vinyl Record'}
                            </p>
                            <p className="font-bold text-lg font-mono">${item.product.price.toFixed(2)}</p>
                            
                            {/* Enhanced Inventory Alert */}
                            {(() => {
                              const issue = getIssueForItem(item.id);
                              return issue ? (
                                <InventoryAlert
                                  issue={issue}
                                  onUpdateQuantity={handleInventoryUpdate}
                                  onRemoveItem={handleInventoryRemove}
                                  className="mt-2"
                                />
                              ) : null;
                            })()}
                          </div>
                          
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleQuantityUpdate(item.id, item.quantity - 1)}
                              className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"
                            >
                              -
                            </button>
                            <span className="w-12 text-center font-bold font-mono">{item.quantity}</span>
                            <button
                              onClick={() => handleQuantityUpdate(item.id, item.quantity + 1)}
                              className="w-8 h-8 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"
                            >
                              +
                            </button>
                          </div>
                          
                          {/* Remove Button */}
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-500 hover:text-red-700 text-sm font-medium font-mono"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Clear Cart */}
                  <div className="p-6 border-t border-gray-200">
                    <button
                      onClick={clearCart}
                      className="text-gray-500 hover:text-gray-700 text-sm font-medium font-mono"
                    >
                      Clear Cart
                    </button>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                  <h2 className="text-xl font-bold mb-4 font-mono">Order Summary</h2>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="font-mono">Subtotal ({cart.totalItems} items, inc. GST)</span>
                      <span className="font-mono">${cart.totalPrice.toFixed(2)}</span>
                    </div>
                    
                    {/* Automatic Discounts */}
                    {automaticDiscounts.map((discount, index) => (
                      <div key={index} className="flex justify-between text-green-600">
                        <span className="font-mono">{discount.name}</span>
                        <span className="font-mono">-${discount.discountAmount.toFixed(2)}</span>
                      </div>
                    ))}
                    

                    <div className="flex justify-between text-sm text-gray-600">
                      <span className="font-mono">GST included</span>
                      <span className="font-mono">${gstAmount.toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between font-bold text-lg">
                        <span className="font-mono">Total</span>
                        <span className="font-mono">${finalTotal.toFixed(2)}</span>
                      </div>
                      <div className="text-xs text-gray-500 font-mono mt-1">
                        Final price depends on delivery method chosen at checkout • Pickup free • Shipping $12 Aus Only
                      </div>
                    </div>
                  </div>

                  {/* Note about vouchers */}
                  <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-700 font-mono">
                      💡 <strong>Tip:</strong> You can apply discount codes and gift vouchers at checkout!
                    </p>
                  </div>
                  
                  <button
                    onClick={handleCheckout}
                    disabled={!canProceedToCheckout || isCheckingInventory}
                    className={`w-full py-3 px-6 font-bold text-lg border transition-colors font-mono ${
                      !canProceedToCheckout || isCheckingInventory
                        ? 'cursor-not-allowed'
                        : ''
                    }`}
                    style={{
                      backgroundColor: !canProceedToCheckout || isCheckingInventory
                        ? 'rgb(209, 213, 219)'
                        : 'var(--color-clay)',
                      color: !canProceedToCheckout || isCheckingInventory
                        ? 'rgb(107, 114, 128)'
                        : 'var(--color-black)',
                      borderColor: !canProceedToCheckout || isCheckingInventory
                        ? 'rgb(209, 213, 219)'
                        : 'var(--color-clay)'
                    }}
                    onMouseEnter={(e) => {
                      if (canProceedToCheckout && !isCheckingInventory) {
                        e.currentTarget.style.backgroundColor = 'var(--color-mustard)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (canProceedToCheckout && !isCheckingInventory) {
                        e.currentTarget.style.backgroundColor = 'var(--color-clay)';
                      }
                    }}
                  >
                    {isCheckingInventory ? 'Checking Inventory...' : 'Proceed to Checkout'}
                  </button>
                  
                  <button
                    onClick={handleContinueShopping}
                    className="w-full mt-3 bg-gray-200 text-gray-700 py-3 px-6 font-bold text-lg border border-gray-300 hover:bg-gray-300 transition-colors font-mono"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
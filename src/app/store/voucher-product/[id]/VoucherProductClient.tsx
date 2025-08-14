"use client";

import { useState } from 'react';
import { useCartContext } from '@/contexts/CartContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';

interface VoucherProduct {
  id: string;
  title: string;
  description: string;
  image: string;
  isVariablePricing: boolean;
  minPrice: number;
  maxPrice: number;
}

interface VoucherProductClientProps {
  product: VoucherProduct;
}

export default function VoucherProductClient({ product }: VoucherProductClientProps) {
  const [customAmount, setCustomAmount] = useState(product.minPrice);
  const [addingToCart, setAddingToCart] = useState(false);
  const { addToCart } = useCartContext();
  const router = useRouter();

  const handleAddToCart = () => {
    console.log('Adding voucher to cart with amount:', customAmount);
    setAddingToCart(true);
    
    // Create a custom product with the user's chosen amount
    const customProduct = {
      ...product,
      price: customAmount,
      title: `$${customAmount} Gift Voucher`,
      description: `Gift voucher worth $${customAmount}`,
      artist: '',
      genre: '',
      images: [],
      imageIds: [],
      isVisible: true,
      isPreorder: false,
      preorderReleaseDate: '',
      preorderQuantity: 0,
      preorderMaxQuantity: 0,
      size: '',
      color: '',
      mood: '',
      stockQuantity: 999,
      stockStatus: 'in_stock' as const,
      productType: 'voucher' as const,
      merchCategory: '',
      inStock: true,
      label: '',
      year: '',
      format: '',
      createdAt: new Date().toISOString()
    };

    console.log('Custom product created:', customProduct);
    
    // Add to cart (this is synchronous)
    addToCart(customProduct, 1);
    console.log('Voucher added to cart');
    
    // Use replace to avoid navigation issues and force a fresh load
    setAddingToCart(false);
    
    // Longer delay to ensure cart state is properly updated and synchronized
    setTimeout(() => {
      console.log('Navigating to cart...');
      router.replace('/cart');
    }, 200);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (value >= product.minPrice && value <= product.maxPrice) {
      setCustomAmount(value);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <Navigation />
      
      {/* Back to Store Link */}
      <div className="border-b border-black">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Link 
            href="/store" 
            className="text-xs font-mono text-black hover:text-gray-600 transition-colors"
          >
            ← BACK TO ALL ITEMS
          </Link>
        </div>
      </div>

      {/* Main Product Layout */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 border-b border-black pb-20 lg:pb-0">
          
          {/* Left Column - Voucher Image */}
          <div className="border-r border-black">
            <div className="relative aspect-square overflow-hidden flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
              <div className="text-center">
                <div className="text-8xl mb-6">🎁</div>
                <div className="text-2xl font-bold font-mono uppercase tracking-wide text-black">
                  Gift Voucher
                </div>
                <div className="text-sm font-mono text-gray-600 mt-2">
                  Perfect for music lovers
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Product Details (Sticky on Desktop) */}
          <div className="p-4 lg:p-8 xl:p-12 lg:sticky lg:top-[56px] lg:h-[calc(100vh-56px)] lg:overflow-y-auto bg-white z-10">
            <div className="space-y-6">
              
              {/* Product Title */}
              <div>
                <h1 className="text-xl lg:text-2xl xl:text-3xl font-bold uppercase tracking-wide font-mono leading-tight">
                  {product.title}
                </h1>
                <p className="text-base lg:text-lg font-mono mt-2 text-gray-700">
                  {product.description}
                </p>
              </div>

              {/* Price Display */}
              <div>
                <p className="text-xl font-bold font-mono">
                  ${customAmount.toFixed(2)}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm font-mono text-green-600">
                    In Stock
                  </span>
                </div>
              </div>

              {/* Custom Amount Selection */}
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-mono uppercase tracking-wide mb-3">Choose Amount</p>
                  <div className="flex items-center space-x-4">
                    <input
                      type="number"
                      min={product.minPrice}
                      max={product.maxPrice}
                      step="0.01"
                      value={customAmount}
                      onChange={handleAmountChange}
                      className="flex-1 border border-gray-300 px-4 py-3 text-lg font-mono focus:outline-none focus:border-black transition-colors"
                    />
                    <span className="text-gray-500 font-mono">AUD</span>
                  </div>
                  <div className="flex justify-between text-xs font-mono text-gray-500 mt-1">
                    <span>Min: ${product.minPrice}</span>
                    <span>Max: ${product.maxPrice}</span>
                  </div>
                </div>

                {/* Quick Amount Buttons */}
                <div>
                  <p className="text-xs font-mono uppercase tracking-wide mb-3">Quick Select</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[25, 50, 100, 75, 150, 200].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setCustomAmount(amount)}
                        className={`px-4 py-2 text-xs font-mono border transition-all ${
                          customAmount === amount 
                            ? 'border-black bg-black text-white' 
                            : 'border-gray-300 text-black hover:border-gray-500'
                        }`}
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Add to Cart Button */}
              <div className="pt-4">
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart || customAmount < product.minPrice || customAmount > product.maxPrice}
                  className="w-full font-bold font-mono uppercase tracking-wide py-4 px-6 text-lg border border-black bg-black text-white hover:bg-white hover:text-black transition-colors disabled:bg-gray-300 disabled:border-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                  {addingToCart ? 'ADDING TO CART...' : `ADD $${customAmount.toFixed(2)} VOUCHER TO CART`}
                </button>
              </div>

              {/* Product Description */}
              <div className="pt-6 border-t border-gray-200">
                <p className="text-sm font-mono leading-relaxed text-gray-700">
                  This voucher will be generated after payment and sent to your email. 
                  Perfect gift for music lovers who appreciate curated vinyl and unique sounds.
                </p>
              </div>

              {/* How it works */}
              <div className="pt-6 border-t border-gray-200">
                <p className="text-xs font-mono uppercase tracking-wide mb-3">How it works</p>
                <ul className="text-xs font-mono text-gray-700 space-y-1">
                  <li>• Choose your voucher amount</li>
                  <li>• Complete checkout</li>
                  <li>• Receive voucher code via email</li>
                  <li>• Use voucher code during future purchases</li>
                </ul>
              </div>

              {/* Additional Details */}
              <div className="pt-6 border-t border-gray-200 space-y-2">
                <p className="text-xs font-mono uppercase tracking-wide">
                  Type: Gift Voucher
                </p>
                <p className="text-xs font-mono uppercase tracking-wide">
                  Expiry: 1 year from purchase
                </p>
                <p className="text-xs font-mono uppercase tracking-wide">
                  Usage: Multiple purchases until balance exhausted
                </p>
              </div>

              {/* Shipping Note */}
              <div className="pt-6 border-t border-gray-200">
                <p className="text-xs font-mono text-gray-600">
                  Voucher code delivered instantly via email • No shipping required
                </p>
              </div>

              {/* Social Share */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex gap-4">
                  <button className="text-xs font-mono uppercase tracking-wide hover:text-gray-600 transition-colors">
                    Share
                  </button>
                  <button className="text-xs font-mono uppercase tracking-wide hover:text-gray-600 transition-colors">
                    Wishlist
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
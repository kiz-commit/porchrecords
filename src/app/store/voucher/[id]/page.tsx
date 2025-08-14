"use client";

import { useState, useEffect } from 'react';
import { useCart } from '@/hooks/useCart';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface VoucherProduct {
  id: string;
  title: string;
  description: string;
  image: string;
  isVariablePricing: boolean;
  minPrice: number;
  maxPrice: number;
}

export default function VoucherProductPage({ params }: { params: Promise<{ id: string }> }) {
  const [product, setProduct] = useState<VoucherProduct | null>(null);
  const [customAmount, setCustomAmount] = useState(25);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [productId, setProductId] = useState<string>('');
  const { addToCart } = useCart();
  const router = useRouter();

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setProductId(resolvedParams.id);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!productId) return;
    
    const fetchProduct = async () => {
      try {
        console.log('Fetching product with ID:', productId);
        const response = await fetch('/api/products/cache');
        if (response.ok) {
          const data = await response.json();
          console.log('API response:', data);
          const voucherProduct = data.products.find((p: any) => p.id === productId && p.productType === 'voucher');
          console.log('Found voucher product:', voucherProduct);
          if (voucherProduct) {
            // Create a properly formatted voucher product with default values
            const formattedProduct: VoucherProduct = {
              id: voucherProduct.id,
              title: voucherProduct.title || 'Gift Voucher',
              description: voucherProduct.description || 'Perfect gift for music lovers! Choose your own amount.',
              image: voucherProduct.image || '/voucher-image.svg',
              isVariablePricing: true,
              minPrice: 10,
              maxPrice: 500
            };
            console.log('Formatted product:', formattedProduct);
            setProduct(formattedProduct);
            setCustomAmount(formattedProduct.minPrice);
          } else {
            console.log('Voucher product not found');
          }
        } else {
          console.error('API response not ok:', response.status);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId]);

  const handleAddToCart = async () => {
    if (!product) return;

    setAddingToCart(true);
    try {
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
        inStock: true
      };

      await addToCart(customProduct, 1);
      
      // Small delay to ensure cart state is saved to localStorage
      setTimeout(() => {
        router.push('/cart');
      }, 50);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (product && value >= product.minPrice && value <= product.maxPrice) {
      setCustomAmount(value);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg">Loading voucher...</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg mb-4">Voucher not found</div>
          <Link href="/store" className="text-blue-600 hover:text-blue-700">
            Back to Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
            {/* Product Image */}
            <div className="flex items-center justify-center">
              <div className="w-full max-w-md">
                <div className="aspect-square bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🎁</div>
                    <div className="text-2xl font-bold text-gray-800">Gift Voucher</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {product.title}
                </h1>
                <p className="text-gray-600 text-lg">
                  {product.description}
                </p>
              </div>

              {/* Custom Amount Selection */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Choose Voucher Amount
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="number"
                      min={product.minPrice}
                      max={product.maxPrice}
                      step="0.01"
                      value={customAmount}
                      onChange={handleAmountChange}
                      className="flex-1 border border-gray-300 rounded-md px-4 py-3 text-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-gray-500 font-medium">AUD</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>Min: ${product.minPrice}</span>
                    <span>Max: ${product.maxPrice}</span>
                  </div>
                </div>

                {/* Quick Amount Buttons */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quick Select
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[25, 50, 100, 75, 150, 200].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setCustomAmount(amount)}
                        className={`px-4 py-2 rounded-md border text-sm font-medium transition-colors ${
                          customAmount === amount
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Price Display */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-gray-900">Total Amount:</span>
                  <span className="text-3xl font-bold text-gray-900">${customAmount.toFixed(2)}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  This voucher will be generated after payment and sent to your email
                </p>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={addingToCart || customAmount < product.minPrice || customAmount > product.maxPrice}
                className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-medium text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {addingToCart ? 'Adding to Cart...' : `Add $${customAmount.toFixed(2)} Voucher to Cart`}
              </button>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="text-blue-600 text-lg">ℹ️</div>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">How it works:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Choose your voucher amount</li>
                      <li>• Complete checkout</li>
                      <li>• Receive voucher code via email</li>
                      <li>• Use voucher code during future purchases</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
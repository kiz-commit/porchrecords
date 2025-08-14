"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { type StoreProduct } from '@/lib/types';
import Navigation from '@/components/Navigation';
import ProductActionsBar from './ProductActionsBar';
import { useAnalytics } from '@/hooks/useAnalytics';

interface ProductDetailPageProps {
  product: StoreProduct;
}

export default function ProductDetailPage({ product }: ProductDetailPageProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState(product.color || '');
  const [selectedSize, setSelectedSize] = useState(product.size || '');
  const [selectedVariationId, setSelectedVariationId] = useState(product.selectedVariationId || '');
  const { trackProductView } = useAnalytics();

  // Track product view when component mounts
  useEffect(() => {
    if (trackProductView) {
      trackProductView(
        product.id, 
        product.title, 
        product.price, 
        product.id
      );
    }
  }, [product.id, product.title, product.price, trackProductView]);

  // Use actual product images from Square, fallback to placeholders only if needed
  const productImages = (() => {
    const realImages = product.images?.map(img => img.url) || [];
    const mainImage = product.image;
    
    // Start with the main image if it's not already in the images array
    const images = mainImage && !realImages.includes(mainImage) ? [mainImage] : [];
    
    // Add all real images from Square
    images.push(...realImages);
    
    // Only add placeholders if we don't have enough real images (minimum 2 for carousel)
    if (images.length < 2) {
      const placeholders = [
        "/hero-image2.jpg", // Different angle
        "/hero-image3.jpg", // Detail shot
        "/hero-image.jpg",  // Alternative view
      ];
      
      // Add placeholders until we have at least 2 images total
      for (let i = 0; i < placeholders.length && images.length < 2; i++) {
        if (!images.includes(placeholders[i])) {
          images.push(placeholders[i]);
        }
      }
    }
    
    return images.filter(Boolean);
  })();

  // Get selected variation
  const selectedVariation = product.variations?.find(v => v.id === selectedVariationId) || product.variations?.[0];
  
  // Use selected variation price if available, otherwise use product price
  const displayPrice = selectedVariation?.price || product.price;
  
  // Generate color variants if available
  const colorVariants = product.color ? [product.color, '#000000', '#FFFFFF', '#FF9900'] : [];

  // Generate size variants if available
  const sizeVariants = product.size ? ['S', 'M', 'L', 'XL'] : [];

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + productImages.length) % productImages.length);
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
          
          {/* Left Column - Product Images */}
          <div className="border-r border-black">
            {/* Carousel for both Mobile and Desktop */}
            <div className="relative">
              <div className="relative aspect-square overflow-hidden">
                <Image
                  src={productImages[selectedImage]}
                  alt={`${product.title}${product.artist ? ` by ${product.artist}` : ''} - View ${selectedImage + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
              
              {/* Carousel Navigation */}
              <div className="absolute inset-0 flex items-center justify-between p-4">
                <button
                  onClick={prevImage}
                  className="w-10 h-10 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-75 transition-all"
                  aria-label="Previous image"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextImage}
                  className="w-10 h-10 bg-black bg-opacity-50 text-white rounded-full flex items-center justify-center hover:bg-opacity-75 transition-all"
                  aria-label="Next image"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Carousel Indicators */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                {productImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === selectedImage 
                        ? 'bg-black' 
                        : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                    }`}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>

              {/* Image Counter */}
              <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white text-xs font-mono px-2 py-1 rounded">
                {selectedImage + 1} / {productImages.length}
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
                {product.artist && (
                  <p className="text-base lg:text-lg font-mono mt-2 text-gray-700">
                    {product.artist}
                  </p>
                )}
              </div>

              {/* Price and Stock Status */}
              <div>
                <p className="text-xl font-bold font-mono">
                  {product.productType === 'voucher' ? 'You choose' : `$${displayPrice.toFixed(2)}`}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {product.stockStatus === 'out_of_stock' && (
                    <span className="text-sm font-mono text-red-600 font-bold">
                      SOLD OUT
                    </span>
                  )}
                  {product.stockStatus === 'low_stock' && (
                    <span className="text-sm font-mono text-yellow-600 font-bold">
                      LOW STOCK ({product.stockQuantity} left)
                    </span>
                  )}
                  {product.stockStatus === 'in_stock' && !product.isPreorder && (
                    <span className="text-sm font-mono text-green-600">
                      In Stock
                    </span>
                  )}
                  {product.stockStatus === 'in_stock' && product.isPreorder && product.preorderQuantity < product.preorderMaxQuantity && (
                    <span className="text-sm font-mono text-green-600">
                      In Stock
                    </span>
                  )}
                  {product.isPreorder && (
                    <span className="inline-flex items-center gap-1 text-sm font-mono font-bold px-2 py-1 rounded"
                          style={{ backgroundColor: '#ff8c00', color: 'white' }}>
                      📅 PRE-ORDER • Ships {product.preorderReleaseDate ? new Date(product.preorderReleaseDate).toLocaleDateString('en-AU', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'TBD'}
                    </span>
                  )}
                </div>
              </div>

              {/* Color Variants */}
              {colorVariants.length > 0 && (
                <div>
                  <p className="text-xs font-mono uppercase tracking-wide mb-3">Color</p>
                  <div className="flex gap-2">
                    {colorVariants.map((color, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedColor(color)}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${
                          selectedColor === color 
                            ? 'border-black' 
                            : 'border-gray-300 hover:border-gray-500'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Size Variants - Show Square variations for merch items */}
              {product.hasVariations && product.variations && (
                <div>
                  <p className="text-xs font-mono uppercase tracking-wide mb-3">Size</p>
                  <div className="flex gap-2 flex-wrap">
                    {product.variations.map((variation) => (
                      <button
                        key={variation.id}
                        onClick={() => setSelectedVariationId(variation.id)}
                        disabled={!variation.isAvailable}
                        className={`px-4 py-2 text-xs font-mono border transition-all ${
                          selectedVariationId === variation.id 
                            ? 'border-black bg-black text-white' 
                            : variation.isAvailable
                            ? 'border-gray-300 text-black hover:border-gray-500'
                            : 'border-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {variation.size || variation.name}
                        {!variation.isAvailable && ' (Sold Out)'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Fallback size variants for non-variation products */}
              {!product.hasVariations && sizeVariants.length > 0 && (
                <div>
                  <p className="text-xs font-mono uppercase tracking-wide mb-3">Size</p>
                  <div className="flex gap-2">
                    {sizeVariants.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 text-xs font-mono border transition-all ${
                          selectedSize === size 
                            ? 'border-black bg-black text-white' 
                            : 'border-gray-300 text-black hover:border-gray-500'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Actions */}
              <div className="pt-4">
                <ProductActionsBar 
                  product={product}
                  className=""
                  selectedVariationId={selectedVariationId}
                />
              </div>

              {/* Product Description */}
              {product.description && (
                <div className="pt-6 border-t border-gray-200">
                  <p className="text-sm font-mono leading-relaxed text-gray-700">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Additional Details */}
              <div className="pt-6 border-t border-gray-200 space-y-2">
                {product.genre && (
                  <p className="text-xs font-mono uppercase tracking-wide">
                    Genre: {product.genre}
                  </p>
                )}
                {product.label && (
                  <p className="text-xs font-mono uppercase tracking-wide">
                    Label: {product.label}
                  </p>
                )}
                {product.year && (
                  <p className="text-xs font-mono uppercase tracking-wide">
                    Year: {product.year}
                  </p>
                )}
                {product.format && (
                  <p className="text-xs font-mono uppercase tracking-wide">
                    Format: {product.format}
                  </p>
                )}
              </div>

              {/* Shipping Note */}
              <div className="pt-6 border-t border-gray-200">
                <p className="text-xs font-mono text-gray-600">
                  Free shipping on orders over $50 • Ships within 2-3 business days
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
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSectionTheme } from '@/lib/theme-utils';
import { useHomepage } from '@/contexts/HomepageContext';

interface Product {
  id: string;
  title: string;
  artist?: string;
  price: number;
  image: string;
  images?: { id: string; url: string }[];
  productType?: string;
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
  viewCount?: number;
  returnRate?: number;
  slug?: string;
}

interface StoreHighlightsProps {
  title?: string;
  subtitle?: string;
  type?: 'selling-fast' | 'returning-users';
  maxProducts?: number;
  theme?: {
    backgroundColor?: string;
    textColor?: string;
    accentColor?: string;
  };
}

export default function StoreHighlights({
  title = "Store Highlights",
  subtitle = "Discover what's trending in our collection",
  type = 'selling-fast',
  maxProducts = 4,
  theme
}: StoreHighlightsProps) {
  const { backgroundClass, textClass, accentClass } = useSectionTheme(theme);
  const { homepageData } = useHomepage();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, [type, homepageData]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use preloaded data if available
      if (homepageData?.highlightProducts && homepageData.highlightProducts.length > 0) {
        console.log('🚀 Using preloaded highlight products');
        setProducts(homepageData.highlightProducts.slice(0, maxProducts));
        setIsLoading(false);
        return;
      }

      // Fallback to API call if no preloaded data
      console.log('📡 Falling back to API call for highlight products');
      const response = await fetch(`/api/products/highlights?type=${type}&limit=${maxProducts}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load products');
      }

      // Transform the data to match our component's interface
      const transformedProducts: Product[] = data.products.map((product: any) => ({
        id: product.id,
        title: product.title,
        artist: product.description?.split(' - ')[1] || product.description?.split(' by ')[1] || undefined,
        price: product.price,
        image: product.image,
        images: product.images,
        productType: product.productType,
        stockStatus: product.stockStatus,
        viewCount: product.viewCount || 0,
        returnRate: product.returnRate || 0,
        slug: product.slug
      }));

      setProducts(transformedProducts);
    } catch (err) {
      console.error('Failed to load store highlights:', err);
      setError('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeTitle = () => {
    switch (type) {
      case 'selling-fast':
        return 'Selling Fast';
      case 'returning-users':
        return 'Customer Favorites';
      default:
        return 'Store Highlights';
    }
  };

  const getTypeSubtitle = () => {
    switch (type) {
      case 'selling-fast':
        return 'Limited stock available on these popular releases';
      case 'returning-users':
        return 'Albums our customers keep coming back to';
      default:
        return subtitle;
    }
  };

  if (isLoading) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {getTypeTitle()}
            </h2>
            <p className="text-lg text-gray-600">{getTypeSubtitle()}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className={`py-16 ${backgroundClass}`}>
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">{error}</p>
            <button
              onClick={loadProducts}
              className="mt-3 text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`py-16 ${backgroundClass}`}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Header - House of Darwin Style */}
        <div className="text-center mb-16">
          <h2 className={`text-4xl md:text-5xl lg:text-6xl font-bold font-mono uppercase tracking-wider ${textClass} mb-6`}>
            {getTypeTitle()}
          </h2>
          <p className={`text-sm md:text-base font-mono uppercase tracking-wide opacity-70 max-w-2xl mx-auto ${textClass.replace('text-', 'text-').replace('text-gray-900', 'text-gray-600')}`}>
            {getTypeSubtitle()}
          </p>
        </div>

        {/* Products Grid - House of Darwin Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-l"
             style={{ borderColor: 'var(--color-black)' }}>
          {products.map((product) => (
            <div key={product.id} className="border-r border-b group"
                 style={{ borderColor: 'var(--color-black)' }}>
              <Link
                href={product.productType === 'voucher' ? `/store/voucher-product/${product.id}` : `/store/${product.slug || product.id}`}
                className="block"
              >
                {/* Product Image Container */}
                <div className="relative aspect-square overflow-hidden flex items-center justify-center"
                     style={{ backgroundColor: 'var(--color-offwhite)' }}>
                  <Image
                    src={product.image}
                    alt={product.title}
                    fill
                    style={{ 
                      objectFit: product.productType === 'voucher' ? 'contain' : 'cover',
                      padding: product.productType === 'voucher' ? '20px' : '0'
                    }}
                    className="transition-all duration-500 ease-in-out group-hover:scale-105"
                  />
                  {product.stockStatus === 'low_stock' && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white text-xs px-3 py-1 font-mono uppercase tracking-wide">
                      Low Stock
                    </div>
                  )}
                </div>

                {/* Product Info - Minimal, below image */}
                <div className="p-6 text-black" style={{ backgroundColor: 'var(--color-offwhite)' }}>
                  {/* Product Name - Uppercase, bold serif/mono */}
                  <h3 className="font-bold text-sm uppercase leading-tight font-mono tracking-wide mb-2">
                    {product.title}
                  </h3>
                  {product.artist && (
                    <p className="text-xs font-mono mb-3 opacity-70">
                      {product.artist}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold">
                      {product.productType === 'voucher' ? 'You choose' : `$${product.price.toFixed(2)}`}
                    </span>
                    {type === 'selling-fast' && product.viewCount && (
                      <span className="text-xs font-mono opacity-60">
                        {product.viewCount} views
                      </span>
                    )}
                    {type === 'returning-users' && product.returnRate && (
                      <span className="text-xs font-mono opacity-60">
                        {(product.returnRate * 100).toFixed(0)}% return rate
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-12">
          <Link
            href="/store"
            className="inline-flex items-center px-6 py-3 bg-mustard text-white font-medium rounded-lg hover:bg-mustard/90 transition-colors"
          >
            View All Products
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  createdAt?: string;
  slug?: string;
}

interface LatestReleasesProps {
  title?: string;
  subtitle?: string;
  maxItems?: number;
  showPrice?: boolean;
  showAddToCart?: boolean;
}

export default function LatestReleases({
  title = "Latest Releases",
  subtitle = "Fresh vinyl from the Porch",
  maxItems = 4,
  showPrice = true,
  showAddToCart = true
}: LatestReleasesProps) {
  const { homepageData } = useHomepage();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, [homepageData]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use preloaded data if available
      if (homepageData?.latestProducts && homepageData.latestProducts.length > 0) {
        console.log('🚀 Using preloaded latest products');
        setProducts(homepageData.latestProducts.slice(0, maxItems));
        setIsLoading(false);
        return;
      }

      // Fallback to API call if no preloaded data
      console.log('📡 Falling back to API call for latest products');
      const response = await fetch(`/api/products/highlights?type=latest-releases&limit=${maxItems}`);
      
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
        createdAt: new Date(product.cachedAt || Date.now()).toISOString(),
        slug: product.slug
      }));

      setProducts(transformedProducts);
    } catch (err) {
      console.error('Failed to load latest releases:', err);
      setError('Failed to load latest releases');
    } finally {
      setIsLoading(false);
    }
  };

  const getStockStatusColor = (status?: string) => {
    switch (status) {
      case 'low_stock':
        return 'bg-yellow-100 text-yellow-800';
      case 'out_of_stock':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  const getStockStatusText = (status?: string) => {
    switch (status) {
      case 'low_stock':
        return 'Low Stock';
      case 'out_of_stock':
        return 'Sold Out';
      default:
        return 'In Stock';
    }
  };

  if (isLoading) {
    return (
      <section className="py-16" style={{ backgroundColor: 'var(--color-offwhite)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mustard mx-auto mb-4"></div>
            <p className="text-gray-600">Loading latest releases...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16" style={{ backgroundColor: 'var(--color-offwhite)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <section className="py-16" style={{ backgroundColor: 'var(--color-offwhite)' }}>
      <div className="max-w-7xl mx-auto px-6">
        {/* Header - House of Darwin Style */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-mono uppercase tracking-wider mb-6" style={{ color: 'var(--color-black)' }}>
            {title}
          </h2>
          <p className="text-sm md:text-base font-mono uppercase tracking-wide opacity-70 max-w-2xl mx-auto text-gray-600">
            {subtitle}
          </p>
        </div>

        {/* Products Grid - House of Darwin Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-l"
             style={{ borderColor: 'var(--color-black)' }}>
          {products.map((product) => (
            <div key={product.id} className="border-r border-b group"
                 style={{ borderColor: 'var(--color-black)' }}>
              <Link
                href={`/store/${product.slug || product.id}`}
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
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                  />
                  {/* Stock Status Badge */}
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 text-xs font-mono uppercase tracking-wide ${getStockStatusColor(product.stockStatus)}`}>
                      {getStockStatusText(product.stockStatus)}
                    </span>
                  </div>
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
                    {showPrice && (
                      <span className="text-xs font-mono font-bold">
                        {product.productType === 'voucher' ? 'You choose' : `$${product.price.toFixed(2)}`}
                      </span>
                    )}
                    
                    {showAddToCart && product.stockStatus !== 'out_of_stock' && (
                      <button
                        className="text-xs font-mono uppercase tracking-wide px-4 py-2 border border-black hover:bg-black hover:text-white transition-colors"
                        style={{ borderColor: 'var(--color-black)' }}
                        onClick={(e) => {
                          e.preventDefault();
                          // Add to cart functionality would go here
                        }}
                      >
                        Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center mt-8">
          <Link
            href="/store"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md transition-colors"
            style={{
              backgroundColor: 'var(--color-mustard)',
              color: 'var(--color-black)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-clay)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-mustard)';
            }}
          >
            View All Products
            <svg className="ml-2 -mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
} 
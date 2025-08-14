import Image from 'next/image';
import Link from 'next/link';
import { type StoreProduct } from '@/lib/types';
import { useState } from 'react';
import { useMood } from '@/contexts/MoodContext';
import AddToCartButton from './AddToCartButton';

interface SimpleProduct {
  id: string;
  title: string;
  artist?: string;
  price: number;
  image: string;
  images?: { id: string; url: string }[];
  productType?: string;
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
  isPreorder?: boolean;
  mood?: string;
  color?: string;
  size?: string;
  slug?: string;
}

interface ProductCardProps {
  product: StoreProduct | SimpleProduct;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { getMoodEmoji, getMoodColor } = useMood();
  
  // Use different images for main and hover states based on product type
  const mainImage = product.image || "/store.webp";
  
  // Get available images for hover effects
  const getAvailableImages = () => {
    const realImages = product.images?.map(img => img.url) || [];
    const images = [mainImage, ...realImages].filter(Boolean);
    
    // Remove duplicates
    return [...new Set(images)];
  };
  
  const availableImages = getAvailableImages();
  
  // Choose hover image - use second image if available, otherwise fallback
  const getHoverImage = () => {
    if (product.productType === 'voucher') {
      return mainImage; // Vouchers don't need hover images
    } else if (availableImages.length > 1) {
      // Use the second image (index 1) for hover
      return availableImages[1];
    } else {
      // Fallback to placeholder images if no additional real images
      if (product.productType === 'record') {
        return "/hero-image2.jpg";
      } else if (product.productType === 'merch') {
        return "/hero-image3.jpg";
      } else {
        return "/hero-image.jpg";
      }
    }
  };
  
  const hoverImage = getHoverImage();

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  return (
    <div className="relative group" style={{ backgroundColor: 'var(--color-offwhite)' }}>
      <Link href={product.productType === 'voucher' ? `/store/voucher-product/${product.id}` : `/store/${product.slug || product.id}`}>
        <div 
          className="cursor-pointer"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={() => setIsHovered(false)}
        >
      {/* Product Image Container */}
      <div className="relative aspect-square overflow-hidden flex items-center justify-center"
           style={{ backgroundColor: 'var(--color-offwhite)' }}>
        {/* Main Image */}
        <Image
          src={mainImage}
          alt={`${product.title}${product.artist ? ` by ${product.artist}` : ''}`}
          fill
          style={{ 
            objectFit: product.productType === 'voucher' ? 'contain' : 'cover',
            padding: product.productType === 'voucher' ? '20px' : '0'
          }}
          className={`transition-all duration-500 ease-in-out ${
            isHovered ? 'opacity-0' : 'opacity-100'
          }`}
        />
        {/* Hover Image - only show for non-voucher products */}
        {product.productType !== 'voucher' && (
          <Image
            src={hoverImage}
            alt={`${product.title}${product.artist ? ` by ${product.artist}` : ''}`}
            fill
            style={{ objectFit: 'cover' }}
            className={`transition-all duration-500 ease-in-out ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
      </div>

      {/* Product Info - Minimal, below image */}
      <div className="p-4 text-black" style={{ backgroundColor: 'var(--color-offwhite)' }}>
        {/* Product Name - Uppercase, bold serif/mono */}
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-bold text-sm uppercase leading-tight font-mono tracking-wide flex-1">
            {product.title}
          </h3>
          {/* Mood Emoji */}
          {product.mood && getMoodEmoji(product.mood) && (
            <div 
              className="text-lg ml-2" 
              title={`Mood: ${product.mood}`}
              style={{ color: getMoodColor(product.mood) || 'inherit' }}
            >
              {getMoodEmoji(product.mood)}
            </div>
          )}
        </div>
        
        {/* Price - Slightly smaller underneath */}
        <p className="text-xs font-mono">
          {product.productType === 'voucher' ? '$You Choose' : `$${product.price.toFixed(2)}`}
        </p>

        {/* Color Swatches - Circular, small */}
        {product.color && (
          <div className="flex gap-1 mt-2">
            <div 
              className="w-3 h-3 rounded-full border"
              style={{ 
                backgroundColor: product.color.toLowerCase(),
                borderColor: 'var(--color-black)'
              }}
            />
          </div>
        )}

        {/* Stock Status Badge - Bottom right */}
        {product.stockStatus === 'out_of_stock' && (
          <div className="absolute bottom-2 right-2">
            <span className="text-xs font-bold font-mono text-white px-2 py-1"
                  style={{ backgroundColor: '#dc2626' }}>
              SOLD OUT
            </span>
          </div>
        )}
        {product.stockStatus === 'low_stock' && !product.isPreorder && (
          <div className="absolute bottom-2 right-2">
            <span className="text-xs font-bold font-mono text-black px-2 py-1"
                  style={{ backgroundColor: '#eab308' }}>
              LOW STOCK
            </span>
          </div>
        )}
        {product.isPreorder && (
          <div className="absolute bottom-2 right-2">
            <span className="text-xs font-bold font-mono text-black px-2 py-1"
                  style={{ backgroundColor: '#ff8c00' }}>
              PRE-ORDER
            </span>
          </div>
        )}
      </div>
        </div>
      </Link>
      
      {/* Add to Cart Button removed from store tile as per user request */}
    </div>
  );
} 
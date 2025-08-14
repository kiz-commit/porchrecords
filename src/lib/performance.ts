// Performance optimization utilities

export const imageLoader = ({ src, width, quality }: { src: string; width: number; quality?: number }) => {
  // If it's a data URL or external URL, return as is
  if (src.startsWith('data:') || src.startsWith('http')) {
    return src;
  }
  
  // For local images, you could implement a CDN or image optimization service
  // For now, return the original src
  return src;
};

export const getImageSizes = (size: 'small' | 'medium' | 'large' | 'full' = 'medium') => {
  switch (size) {
    case 'small':
      return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
    case 'medium':
      return '(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 50vw';
    case 'large':
      return '(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 75vw';
    case 'full':
      return '100vw';
    default:
      return '(max-width: 640px) 100vw, (max-width: 1024px) 75vw, 50vw';
  }
};

export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject();
    img.src = src;
  });
};

export const preloadCriticalImages = async (images: string[]) => {
  try {
    await Promise.all(images.map(preloadImage));
  } catch (error) {
    console.warn('Failed to preload some images:', error);
  }
};

// Cache strategies
export const CACHE_STRATEGIES = {
  STATIC: 'static',
  DYNAMIC: 'dynamic',
  ISR: 'isr',
} as const;

export type CacheStrategy = typeof CACHE_STRATEGIES[keyof typeof CACHE_STRATEGIES];

export const getCacheConfig = (strategy: CacheStrategy) => {
  switch (strategy) {
    case CACHE_STRATEGIES.STATIC:
      return { revalidate: false };
    case CACHE_STRATEGIES.DYNAMIC:
      return { revalidate: 0 };
    case CACHE_STRATEGIES.ISR:
      return { revalidate: 3600 }; // 1 hour
    default:
      return { revalidate: 3600 };
  }
}; 
import { revalidateTag, revalidatePath } from 'next/cache';

// Cache tags for different types of data
export const CACHE_TAGS = {
  PRODUCTS: 'products',
  STORE_PRODUCTS: 'store-products',
  ADMIN_PRODUCTS: 'admin-products',
  INVENTORY: 'inventory',
  STORE_PAGE: 'store-page',
  PRODUCT_DETAILS: 'product-details'
} as const;

// Cache invalidation functions
export class CacheManager {
  /**
   * Invalidate all product-related caches
   */
  static async invalidateProducts() {
    console.log('🗑️  Invalidating product caches...');
    
    // Invalidate specific cache tags
    revalidateTag(CACHE_TAGS.PRODUCTS);
    revalidateTag(CACHE_TAGS.STORE_PRODUCTS);
    revalidateTag(CACHE_TAGS.ADMIN_PRODUCTS);
    
    // Invalidate specific pages
    revalidatePath('/store');
    revalidatePath('/admin/products');
    revalidatePath('/admin/inventory');
    
    console.log('✅ Product caches invalidated');
  }

  /**
   * Invalidate inventory-related caches
   */
  static async invalidateInventory() {
    console.log('🗑️  Invalidating inventory caches...');
    
    revalidateTag(CACHE_TAGS.INVENTORY);
    revalidateTag(CACHE_TAGS.STORE_PRODUCTS); // Store depends on inventory
    
    revalidatePath('/store');
    revalidatePath('/admin/inventory');
    
    console.log('✅ Inventory caches invalidated');
  }

  /**
   * Invalidate a specific product's cache
   */
  static async invalidateProduct(productId: string) {
    console.log(`🗑️  Invalidating cache for product ${productId}...`);
    
    revalidateTag(`${CACHE_TAGS.PRODUCT_DETAILS}-${productId}`);
    revalidateTag(CACHE_TAGS.STORE_PRODUCTS);
    
    revalidatePath(`/store/${productId}`);
    revalidatePath('/store');
    
    console.log(`✅ Product ${productId} cache invalidated`);
  }

  /**
   * Invalidate all caches (nuclear option)
   */
  static async invalidateAll() {
    console.log('🗑️  Performing full cache invalidation...');
    
    // Invalidate all cache tags
    Object.values(CACHE_TAGS).forEach(tag => {
      revalidateTag(tag);
    });
    
    // Invalidate major paths
    revalidatePath('/');
    revalidatePath('/store');
    revalidatePath('/admin');
    
    console.log('✅ Full cache invalidation completed');
  }

  /**
   * Get cache status information
   */
  static getCacheInfo() {
    return {
      tags: CACHE_TAGS,
      lastInvalidated: new Date().toISOString(),
      version: '1.0.0'
    };
  }
}

// Utility function to add cache tags to fetch requests
export function addCacheTag(url: string, tags: string[]) {
  return {
    next: {
      tags: tags,
      revalidate: 300 // 5 minutes default
    }
  };
}

// Hook for automatic cache invalidation after database operations
export async function autoInvalidateAfterSync(operation: 'products' | 'inventory' | 'all') {
  switch (operation) {
    case 'products':
      await CacheManager.invalidateProducts();
      break;
    case 'inventory':
      await CacheManager.invalidateInventory();
      break;
    case 'all':
      await CacheManager.invalidateAll();
      break;
  }
}
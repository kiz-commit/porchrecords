import squareClient from '@/lib/square';
import { Square } from 'square';
import { type StoreProduct } from '@/lib/types';
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

// Rate limiting configuration
const RATE_LIMIT = {
  maxRequests: 100,
  windowMs: 60 * 1000, // 1 minute
  requests: [] as number[]
};

// Cache configuration
const CACHE_CONFIG = {
  duration: 5 * 60 * 1000, // 5 minutes
  inventoryCache: new Map<string, { data: any; timestamp: number }>(),
  productsCache: null as { data: any[]; timestamp: number } | null
};

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000
};

/**
 * Check if we're within rate limits
 */
function checkRateLimit(): boolean {
  const now = Date.now();
  // Clean old requests outside the window
  RATE_LIMIT.requests = RATE_LIMIT.requests.filter(time => now - time < RATE_LIMIT.windowMs);
  
  return RATE_LIMIT.requests.length < RATE_LIMIT.maxRequests;
}

/**
 * Record a request for rate limiting
 */
function recordRequest(): void {
  RATE_LIMIT.requests.push(Date.now());
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Exponential backoff retry wrapper
 */
async function withRetry<T>(
  operation: () => Promise<T>,
  context: string,
  maxRetries = RETRY_CONFIG.maxRetries
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Check rate limits before making request
      if (!checkRateLimit()) {
        const waitTime = RATE_LIMIT.windowMs;
        console.log(`⏳ Rate limit reached, waiting ${waitTime}ms for ${context}`);
        await sleep(waitTime);
      }
      
      recordRequest();
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Handle rate limiting (429) with exponential backoff
      if (error.statusCode === 429 && attempt < maxRetries) {
        const delay = Math.min(
          RETRY_CONFIG.baseDelay * Math.pow(2, attempt),
          RETRY_CONFIG.maxDelay
        );
        console.log(`🔄 Rate limited (429), retrying ${context} in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(delay);
        continue;
      }
      
      // Handle other retryable errors
      if (attempt < maxRetries && (error.statusCode >= 500 || error.code === 'NETWORK_ERROR')) {
        const delay = RETRY_CONFIG.baseDelay * (attempt + 1);
        console.log(`🔄 Retrying ${context} in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await sleep(delay);
        continue;
      }
      
      throw error;
    }
  }
  
  throw lastError!;
}

/**
 * Get cached inventory data if valid
 */
function getCachedInventory(variationId: string): any | null {
  const cached = CACHE_CONFIG.inventoryCache.get(variationId);
  if (cached && (Date.now() - cached.timestamp) < CACHE_CONFIG.duration) {
    return cached.data;
  }
  return null;
}

/**
 * Cache inventory data
 */
function cacheInventory(variationId: string, data: any): void {
  CACHE_CONFIG.inventoryCache.set(variationId, {
    data,
    timestamp: Date.now()
  });
}

// Helper functions (moved from square-inventory-utils)
function getStockStatus(quantity: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
  if (quantity === 0) return 'out_of_stock';
  if (quantity < 3) return 'low_stock';
  return 'in_stock';
}

function getProductVisibilityFromDatabase(squareId: string, title: string): boolean {
  try {
    const db = new Database('data/porchrecords.db');
    
    const getVisibility = db.prepare(`
      SELECT is_visible FROM products 
      WHERE square_id = ? OR id = ?
    `);
    
    const result = getVisibility.get(squareId, `square_${squareId}`);
    
    db.close();
    
    if (result && typeof result === 'object' && 'is_visible' in result) {
      return Boolean(result.is_visible);
    }
    
    return true;
  } catch (error) {
    console.error('Error getting product visibility from database:', error);
    return true;
  }
}

function getPreorderInfoFromDatabase(productId: string): {
  is_preorder: number;
  preorder_release_date: string;
  preorder_quantity: number;
  preorder_max_quantity: number;
} | null {
  try {
    const db = new Database('data/porchrecords.db');
    const row = db
      .prepare(
        `SELECT is_preorder, preorder_release_date, preorder_quantity, preorder_max_quantity
         FROM preorders WHERE product_id = ?`
      )
      .get(productId) as any;
    db.close();
    return row || null;
  } catch (error) {
    console.error('Error getting preorder info from database:', error);
    return null;
  }
}

/**
 * Check if product has inventory at the configured location
 */
async function hasLocationInventory(variationId: string): Promise<boolean> {
  const cached = getCachedInventory(`location_${variationId}`);
  if (cached !== null) {
    return cached;
  }

  try {
    const locationId = process.env.SQUARE_LOCATION_ID;
    if (!locationId) {
      console.log('   ⚠️  No SQUARE_LOCATION_ID configured - defaulting to include product');
      return true;
    }

    const result = await withRetry(async () => {
      const inventory = await squareClient.inventory();
      return await inventory.batchGetCounts({
        locationIds: [locationId],
        catalogObjectIds: [variationId],
      });
    }, `location inventory check for ${variationId}`);
    
    if (result && result.data && result.data.length > 0) {
      const quantity = Number(result.data[0].quantity) || 0;
      console.log(`   📍 Location inventory check for ${variationId}: ${quantity} units`);
      cacheInventory(`location_${variationId}`, true);
      return true;
    }
    
    console.log(`   📍 No inventory record found for ${variationId} at location ${locationId}`);
    cacheInventory(`location_${variationId}`, false);
    return false;
  } catch (error) {
    console.error('❌ Error checking location inventory:', error);
    return false;
  }
}

/**
 * Get inventory count for a specific variation
 */
async function getInventoryCount(variationId: string): Promise<number> {
  const cached = getCachedInventory(`count_${variationId}`);
  if (cached !== null) {
    return cached;
  }

  try {
    const locationId = process.env.SQUARE_LOCATION_ID;
    if (!locationId) {
      return 0;
    }

    const result = await withRetry(async () => {
      const inventory = await squareClient.inventory();
      return await inventory.batchGetCounts({
        locationIds: [locationId],
        catalogObjectIds: [variationId],
      });
    }, `inventory count for ${variationId}`);
    
    if (result && result.data && result.data.length > 0) {
      const quantity = Number(result.data[0].quantity) || 0;
      cacheInventory(`count_${variationId}`, quantity);
      return quantity;
    }
    
    cacheInventory(`count_${variationId}`, 0);
    return 0;
  } catch (error) {
    console.error('Error fetching inventory for variation:', variationId, error);
    return 0;
  }
}

/**
 * Fetch all products from Square with proper rate limiting and caching
 */
export async function fetchProductsFromSquareWithRateLimit(): Promise<(StoreProduct & { stockQuantity: number; stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' })[]> {
  // Check cache first
  if (CACHE_CONFIG.productsCache && (Date.now() - CACHE_CONFIG.productsCache.timestamp) < CACHE_CONFIG.duration) {
    console.log(`📊 Using cached products data (${CACHE_CONFIG.productsCache.data.length} products)`);
    return CACHE_CONFIG.productsCache.data;
  }

  let inventoryProducts: (StoreProduct & { stockQuantity: number; stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' })[] = [];
  
  // Load local product data for additional fields
  let localProductData: Record<string, any> = {};
  try {
    const merchCategoriesPath = path.join(process.cwd(), 'src', 'data', 'merchCategories.json');
    if (fs.existsSync(merchCategoriesPath)) {
      const data = fs.readFileSync(merchCategoriesPath, 'utf8');
      localProductData = JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading local product data:', error);
  }
  
  try {
    console.log('🔄 Fetching products from Square with rate limiting...');
    
    // Fetch ALL products from Square with location filtering (handle pagination)
    const locationId = process.env.SQUARE_LOCATION_ID;
    let allItems: Square.CatalogObject[] = [];
    let cursor: string | undefined = undefined;
    
    do {
      const searchRequest: any = locationId
        ? { enabledLocationIds: [locationId], cursor }
        : { cursor };
        
      const resp: any = await withRetry(async () => {
        const catalog = await squareClient.catalog();
        return await catalog.searchItems(searchRequest);
      }, `catalog search (cursor: ${cursor || 'initial'})`);
      
      if (resp.items) {
        allItems.push(...resp.items);
      }
      cursor = (resp as any).cursor;
    } while (cursor);

    console.log(`📦 Retrieved ${allItems.length} items from Square catalog`);

    if (allItems.length > 0) {
      const productsWithInventory = await Promise.all(allItems.map(async (item: Square.CatalogObject): Promise<(StoreProduct & { stockQuantity: number; stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' }) | null> => {
        if (item.type !== 'ITEM' || !item.itemData?.variations?.length) {
          return null;
        }
        
        const variation = item.itemData.variations[0];
        if (variation.type !== 'ITEM_VARIATION' || !variation.id) {
          return null;
        }
        
        // Special handling for voucher products
        const isVoucher = item.itemData.name?.toLowerCase().includes('voucher') || 
                         item.itemData.description?.toLowerCase().includes('voucher');
        
        if (!variation.itemVariationData?.priceMoney && !isVoucher) {
          return null;
        }

        // Check location availability
        const locationId = process.env.SQUARE_LOCATION_ID;
        const variationData = variation.itemVariationData || ({} as any);
        const locationOverrides = (variationData.locationOverrides || []) as Array<{ locationId?: string; trackInventory?: boolean }>;
        const hasInventoryTrackingDisabledAtLocation = !!locationId && (
          variationData.trackInventory === false ||
          locationOverrides.some(o => o && o.locationId === locationId && o.trackInventory === false)
        );

        if (!isVoucher && !hasInventoryTrackingDisabledAtLocation) {
          if (!await hasLocationInventory(variation.id)) {
            console.log(`   ⚠️  No inventory record at configured location for ${item.itemData.name}`);
          }
        } else if (isVoucher) {
          console.log(`   🎫 Voucher product ${item.itemData.name} - skipping inventory check`);
        } else if (hasInventoryTrackingDisabledAtLocation) {
          console.log(`   ✅ Including ${item.itemData.name} - inventory tracking disabled`);
        }

        const price = isVoucher ? 0 : Number(variation.itemVariationData?.priceMoney?.amount || 0) / 100;
        const imageIds = item.itemData.imageIds || [];
        let images: { id: string; url: string }[] = [];
        let image = '/store.webp';

        // Fetch images with rate limiting
        if (imageIds.length > 0) {
          images = await Promise.all(imageIds.map(async (imageId: string) => {
            try {
              const imageResponse = await withRetry(async () => {
                const catalog = await squareClient.catalog();
                return await catalog.object.get({ objectId: imageId });
              }, `image fetch for ${imageId}`);
              
              if (imageResponse.object && imageResponse.object.type === 'IMAGE' && imageResponse.object.imageData) {
                return { id: imageId, url: imageResponse.object.imageData.url || `/store.webp` };
              } else {
                return { id: imageId, url: `https://square-catalog-production.s3.amazonaws.com/files/${imageId}` };
              }
            } catch (error) {
              console.error('Error fetching image from Square:', error);
              return { id: imageId, url: `https://square-catalog-production.s3.amazonaws.com/files/${imageId}` };
            }
          }));
          if (images.length > 0) {
            image = images[0].url;
          }
        }

        // Fetch inventory count with rate limiting
        const stockQuantity = await getInventoryCount(variation.id);
        const stockStatus = getStockStatus(stockQuantity);

        const description = item.itemData.description || '';
        const preorderInfo = getPreorderInfoFromDatabase(variation.id);
        const isPreorder = Boolean(preorderInfo?.is_preorder);
        const localData = localProductData[variation.id] || {};
        
        // Apply saved image order if available
        if (localData.imageOrder && localData.imageOrder.length > 0) {
          const orderedImages: { id: string; url: string }[] = [];
          const unorderedImages = [...images];
          
          for (const imageId of localData.imageOrder) {
            const foundImage = unorderedImages.find(img => img.id === imageId);
            if (foundImage) {
              orderedImages.push(foundImage);
              const index = unorderedImages.findIndex(img => img.id === imageId);
              if (index > -1) {
                unorderedImages.splice(index, 1);
              }
            }
          }
          
          orderedImages.push(...unorderedImages);
          images = orderedImages;
          if (images.length > 0) {
            image = images[0].url;
          }
        }
        
        return {
          id: variation.id,
          title: item.itemData.name || 'No title',
          price: price,
          description: description.replace(/\[HIDDEN FROM STORE\]|\[PREORDER\]/g, '').trim(),
          image: image,
          images: images,
          imageIds: localData.imageOrder && localData.imageOrder.length > 0 ? localData.imageOrder : item.itemData.imageIds || [],
          inStock: stockQuantity > 0,
          stockQuantity: stockQuantity,
          stockStatus: stockStatus,
          artist: localData.artist || 'Unknown Artist',
          genre: localData.genre || 'Uncategorized',
          isPreorder: isPreorder,
          isVisible: getProductVisibilityFromDatabase(variation.id, item.itemData.name || 'No title'),
          productType: localData.productType || (isVoucher ? 'voucher' : 'record'),
          merchCategory: localData.merchCategory || '',
          size: localData.size || '',
          color: localData.color || '',
          preorderReleaseDate: preorderInfo?.preorder_release_date || localData.preorderReleaseDate || '',
          preorderQuantity: preorderInfo?.preorder_quantity ?? localData.preorderQuantity ?? 0,
          preorderMaxQuantity: preorderInfo?.preorder_max_quantity ?? localData.preorderMaxQuantity ?? 0,
          mood: localData.mood || '',
          isVariablePricing: localData.isVariablePricing || false,
          minPrice: localData.minPrice,
          maxPrice: localData.maxPrice
        };
      }));
      
      inventoryProducts = productsWithInventory.filter((p): p is (StoreProduct & { stockQuantity: number; stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' }) => p !== null);
    }
  } catch (error) {
    console.error('Error fetching inventory from Square:', error);
    throw error;
  }

  // Cache the results
  CACHE_CONFIG.productsCache = {
    data: inventoryProducts,
    timestamp: Date.now()
  };
  
  console.log(`📊 Successfully fetched and cached ${inventoryProducts.length} products from Square`);

  return inventoryProducts;
}

/**
 * Get inventory data for a single product with rate limiting
 */
export async function getSquareInventoryDataWithRateLimit(squareId: string): Promise<{
  stockQuantity: number;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  availableAtLocation: boolean;
}> {
  const cached = getCachedInventory(`single_${squareId}`);
  if (cached !== null) {
    return cached;
  }

  try {
    const locationId = process.env.SQUARE_LOCATION_ID;
    if (!locationId) {
      return { stockQuantity: 0, stockStatus: 'in_stock', availableAtLocation: true };
    }

    const result = await withRetry(async () => {
      const inventory = await squareClient.inventory();
      return await inventory.batchGetCounts({
        locationIds: [locationId],
        catalogObjectIds: [squareId],
      });
    }, `single inventory fetch for ${squareId}`);

    if (result && result.data && result.data.length > 0) {
      const quantity = Number(result.data[0].quantity) || 0;
      const stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' = quantity === 0 ? 'out_of_stock' : 
                         quantity < 3 ? 'low_stock' : 'in_stock';
      
      const data = { stockQuantity: quantity, stockStatus, availableAtLocation: true };
      cacheInventory(`single_${squareId}`, data);
      return data;
    }
    
    const data = { stockQuantity: 0, stockStatus: 'out_of_stock' as const, availableAtLocation: false };
    cacheInventory(`single_${squareId}`, data);
    return data;
  } catch (error) {
    console.error('❌ Error fetching inventory for variation:', squareId, error);
    return { stockQuantity: 0, stockStatus: 'out_of_stock', availableAtLocation: false };
  }
}

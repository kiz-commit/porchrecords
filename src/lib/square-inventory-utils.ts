import squareClient from '@/lib/square';
import { Square } from 'square';
import { type StoreProduct } from '@/lib/types';
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

// Helper function to determine stock status
function getStockStatus(quantity: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
  if (quantity === 0) return 'out_of_stock';
  if (quantity < 3) return 'low_stock';
  return 'in_stock';
}

// Helper function to check if product has inventory at the configured location
async function hasLocationInventory(variationId: string): Promise<boolean> {
  try {
    const locationId = process.env.SQUARE_LOCATION_ID;
    if (!locationId) {
      console.log('   ⚠️  No SQUARE_LOCATION_ID configured - defaulting to include product');
      return true; // Default to include if no location configured
    }

    // Check if this variation has inventory at the configured location
    const inventory = await squareClient.inventory();
    const inventoryResponse = await inventory.batchGetCounts({
      locationIds: [locationId],
      catalogObjectIds: [variationId],
    });
    
    if (inventoryResponse && inventoryResponse.data && inventoryResponse.data.length > 0) {
      const quantity = Number(inventoryResponse.data[0].quantity) || 0;
      console.log(`   📍 Location inventory check for ${variationId}: ${quantity} units (INCLUDED - will show as sold out if 0)`);
      return true; // Include product if it has an inventory record, regardless of quantity
    }
    
    // If no inventory record found, exclude the product
    console.log(`   📍 No inventory record found for ${variationId} at location ${locationId} - excluding product`);
    return false;
  } catch (error) {
    console.error('❌ Error checking location inventory:', error);
    return false; // Default to exclude on error
  }
}

// Helper function to get product visibility from database
function getProductVisibilityFromDatabase(squareId: string, title: string): boolean {
  try {
    const db = new Database('data/porchrecords.db');
    
    // Check if we have a record for this product
    const getVisibility = db.prepare(`
      SELECT is_visible FROM products 
      WHERE square_id = ? OR id = ?
    `);
    
    const result = getVisibility.get(squareId, `square_${squareId}`);
    
    db.close();
    
    if (result && typeof result === 'object' && 'is_visible' in result) {
      return Boolean(result.is_visible);
    }
    
    // If no database record, default to visible (true)
    return true;
  } catch (error) {
    console.error('Error getting product visibility from database:', error);
    // Default to visible on error
    return true;
  }
}

// Helper function to get preorder info from database
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
      .get(productId) as
      | {
          is_preorder: number;
          preorder_release_date: string;
          preorder_quantity: number;
          preorder_max_quantity: number;
        }
      | undefined;
    db.close();
    return row || null;
  } catch (error) {
    console.error('Error getting preorder info from database:', error);
    return null;
  }
}

// Cache for products to avoid hitting Square API rate limits
let productsCache: {
  data: (StoreProduct & { stockQuantity: number; stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' })[];
  timestamp: number;
} | null = null;

const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache

/**
 * Fetch all products from Square with inventory data
 * This is the shared logic used by both admin/inventory and admin/products endpoints
 */
export async function fetchProductsFromSquare(): Promise<(StoreProduct & { stockQuantity: number; stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' })[]> {
  // Check if we have valid cached data
  if (productsCache && (Date.now() - productsCache.timestamp) < CACHE_DURATION) {
    console.log(`📊 Using cached products data (${productsCache.data.length} products)`);
    return productsCache.data;
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
    // Fetch ALL products from Square with location filtering (handle pagination)
    const locationId = process.env.SQUARE_LOCATION_ID;
    let allItems: Square.CatalogObject[] = [];
    let cursor: string | undefined = undefined;
    do {
      const searchRequest: any = locationId
        ? { enabledLocationIds: [locationId], cursor }
        : { cursor };
      const catalog = await squareClient.catalog();
      const resp = await catalog.searchItems(searchRequest);
      if (resp.items) {
        allItems.push(...resp.items);
      }
      cursor = (resp as any).cursor;
    } while (cursor);

    if (allItems.length > 0) {
      const productsWithInventory = await Promise.all(allItems.map(async (item: Square.CatalogObject): Promise<(StoreProduct & { stockQuantity: number; stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' }) | null> => {
        if (item.type !== 'ITEM' || !item.itemData?.variations?.length) {
          return null;
        }
        
        const variation = item.itemData.variations[0];
        if (variation.type !== 'ITEM_VARIATION' || !variation.id) {
          return null;
        }
        
        // Special handling for voucher products - they don't have fixed prices
        const isVoucher = item.itemData.name?.toLowerCase().includes('voucher') || 
                         item.itemData.description?.toLowerCase().includes('voucher');
        
        // Check if variation has price (required for most products, but not vouchers)
        if (!variation.itemVariationData?.priceMoney && !isVoucher) {
          return null;
        }

        // TIER 1: Include items that are present at the location even if inventory tracking is disabled there
        const locationId = process.env.SQUARE_LOCATION_ID;
        const variationData = variation.itemVariationData || ({} as any);
        const locationOverrides = (variationData.locationOverrides || []) as Array<{ locationId?: string; trackInventory?: boolean }>;
        const hasInventoryTrackingDisabledAtLocation = !!locationId && (
          variationData.trackInventory === false ||
          locationOverrides.some(o => o && o.locationId === locationId && o.trackInventory === false)
        );

        // Skip inventory requirement for vouchers and for items with tracking disabled at this location
        if (!isVoucher && !hasInventoryTrackingDisabledAtLocation) {
          if (!await hasLocationInventory(variation.id)) {
            console.log(`   ⚠️  No inventory record at configured location for ${item.itemData.name} - including in admin inventory as out-of-stock`);
            // Continue; we'll set quantity to 0 below
          }
        } else if (isVoucher) {
          console.log(`   🎫 Voucher product ${item.itemData.name} - skipping inventory check`);
        } else if (hasInventoryTrackingDisabledAtLocation) {
          console.log(`   ✅ Including ${item.itemData.name} - inventory tracking disabled at location ${locationId}`);
        }

        const price = isVoucher ? 0 : Number(variation.itemVariationData?.priceMoney?.amount || 0) / 100;
        const imageIds = item.itemData.imageIds || [];
        let images: { id: string; url: string }[] = [];
        let image = '/store.webp';

        if (imageIds.length > 0) {
          images = await Promise.all(imageIds.map(async (imageId: string) => {
            try {
              const catalog = await squareClient.catalog();
              const imageResponse = await catalog.object.get({ objectId: imageId });
              if (imageResponse.object && imageResponse.object.type === 'IMAGE' && imageResponse.object.imageData) {
                const imageUrl = imageResponse.object.imageData.url;
                if (imageUrl) {
                  console.log(`✅ Got real image URL for ${imageId}: ${imageUrl}`);
                  return { id: imageId, url: imageUrl };
                } else {
                  console.log(`⚠️ No URL in image data for ${imageId}, using fallback`);
                  return { id: imageId, url: '/store.webp' };
                }
              } else {
                console.log(`⚠️ Invalid image response for ${imageId}, using fallback`);
                return { id: imageId, url: '/store.webp' };
              }
            } catch (error) {
              console.error(`❌ Error fetching image ${imageId} from Square:`, error);
              return { id: imageId, url: '/store.webp' };
            }
          }));
          if (images.length > 0) {
            image = images[0].url;
          }
        }

        // Fetch inventory count for this variation using Square's inventory API
        let stockQuantity = 0;
        try {
          const locationId = process.env.SQUARE_LOCATION_ID;
          if (locationId) {
            // Use Square's batchGetCounts method to get inventory counts
            const inventory = await squareClient.inventory();
            const inventoryResponse = await inventory.batchGetCounts({
              locationIds: [locationId],
              catalogObjectIds: [variation.id],
            });
            
            // The response is a Page object, we need to access the data correctly
            if (inventoryResponse && inventoryResponse.data && inventoryResponse.data.length > 0) {
              stockQuantity = Number(inventoryResponse.data[0].quantity) || 0;
            }
          }
        } catch (error) {
          console.error('Error fetching inventory for variation:', variation.id, error);
          // If inventory tracking is not set up, default to a reasonable stock level
          stockQuantity = 0;
        }

        const stockStatus = getStockStatus(stockQuantity);

        // Parse visibility from description (legacy; visibility ultimately comes from DB)
        const description = item.itemData.description || '';
        const isHidden = description.includes('[HIDDEN FROM STORE]');

        // Get preorder state from database instead of description flags
        const preorderInfo = getPreorderInfoFromDatabase(variation.id);
        const isPreorder = Boolean(preorderInfo?.is_preorder);

        // Get local product data for this variation
        const localData = localProductData[variation.id] || {};
        
        // Apply saved image order if available
        if (localData.imageOrder && localData.imageOrder.length > 0) {
          const orderedImages: { id: string; url: string }[] = [];
          const unorderedImages = [...images];
          
          // First, add images in the saved order
          for (const imageId of localData.imageOrder) {
            const foundImage = unorderedImages.find(img => img.id === imageId);
            if (foundImage) {
              orderedImages.push(foundImage);
              // Remove from unordered array to avoid duplicates
              const index = unorderedImages.findIndex(img => img.id === imageId);
              if (index > -1) {
                unorderedImages.splice(index, 1);
              }
            }
          }
          
          // Then add any remaining images that weren't in the saved order
          orderedImages.push(...unorderedImages);
          
          images = orderedImages;
          // Update the primary image to use the first image in the ordered list
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
          inStock: stockQuantity > 0, // Legacy field for backward compatibility
          stockQuantity: stockQuantity,
          stockStatus: stockStatus,
          artist: localData.artist || 'Unknown Artist',
          genre: localData.genre || 'Uncategorized',
          isPreorder: isPreorder,
          isVisible: getProductVisibilityFromDatabase(variation.id, item.itemData.name || 'No title'), // Get visibility from database
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
  productsCache = {
    data: inventoryProducts,
    timestamp: Date.now()
  };
  
  console.log(`📊 Cached ${inventoryProducts.length} products from Square`);

  return inventoryProducts;
}
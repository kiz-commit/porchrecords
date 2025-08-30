import squareClient from '@/lib/square';
import { Square } from 'square';

/**
 * Check inventory for multiple products at once (batched to avoid rate limits)
 */
export async function batchCheckLocationInventory(variationIds: string[]): Promise<Map<string, {
  hasInventory: boolean;
  quantity: number;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
}>> {
  const results = new Map();
  
  try {
    const locationId = process.env.SQUARE_LOCATION_ID;
    if (!locationId) {
      console.log('   ⚠️  No SQUARE_LOCATION_ID configured - defaulting to include all products');
      variationIds.forEach(id => {
        results.set(id, { hasInventory: true, quantity: 0, stockStatus: 'in_stock' });
      });
      return results;
    }

    // Process in batches of 10 to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < variationIds.length; i += batchSize) {
      const batch = variationIds.slice(i, i + batchSize);
      
      try {
        const inventory = await squareClient.inventory();
        const inventoryResponse = await inventory.batchGetCounts({
          locationIds: [locationId],
          catalogObjectIds: batch,
        });
        
        if (inventoryResponse && inventoryResponse.data) {
          inventoryResponse.data.forEach((item: any) => {
            const variationId = item.catalogObjectId;
            const quantity = Number(item.quantity) || 0;
            const stockStatus = quantity === 0 ? 'out_of_stock' : 
                               quantity < 3 ? 'low_stock' : 'in_stock';
            
            results.set(variationId, { hasInventory: true, quantity, stockStatus });
          });
        }
        
        // Add missing items as not available
        batch.forEach(id => {
          if (!results.has(id)) {
            results.set(id, { hasInventory: false, quantity: 0, stockStatus: 'out_of_stock' });
          }
        });
        
        console.log(`   📍 Batch ${Math.floor(i / batchSize) + 1}: Checked ${batch.length} products`);
        
        // Add delay between batches to avoid rate limits
        if (i + batchSize < variationIds.length) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        }
        
      } catch (error) {
        console.error(`❌ Error checking batch inventory:`, error);
        // Mark all items in this batch as not available on error
        batch.forEach(id => {
          results.set(id, { hasInventory: false, quantity: 0, stockStatus: 'out_of_stock' });
        });
        
        // Wait longer on error before continuing
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      }
    }
    
    return results;
  } catch (error) {
    console.error('❌ Error in batch inventory check:', error);
    // Return all as not available on error
    variationIds.forEach(id => {
      results.set(id, { hasInventory: false, quantity: 0, stockStatus: 'out_of_stock' });
    });
    return results;
  }
}

/**
 * Check if a product has inventory at the configured location (single product - for backward compatibility)
 */
export async function hasLocationInventory(variationId: string): Promise<{
  hasInventory: boolean;
  quantity: number;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
}> {
  const results = await batchCheckLocationInventory([variationId]);
  return results.get(variationId) || { hasInventory: false, quantity: 0, stockStatus: 'out_of_stock' };
}

/**
 * Fetch all Square products with pagination
 */
export async function fetchAllSquareProducts(): Promise<Square.CatalogObject[]> {
  const allItems: Square.CatalogObject[] = [];
  let cursor: string | undefined = undefined;
  let pageCount = 0;
  
  console.log('🔄 Fetching all products from Square (with pagination)...');
  
  do {
    pageCount++;
    console.log(`   📄 Fetching page ${pageCount}...`);
    
    const searchRequest: any = { cursor };
    const catalog = await squareClient.catalog();
    const response = await catalog.searchItems(searchRequest);
    
    if (response.items && response.items.length > 0) {
      allItems.push(...response.items);
      console.log(`   ✅ Page ${pageCount}: ${response.items.length} items`);
    }
    
    cursor = (response as any).cursor;
  } while (cursor);

  console.log(`✅ Total: Fetched ${allItems.length} items from Square across ${pageCount} pages`);
  return allItems;
}

/**
 * Fetch only products that have inventory at the configured location
 * This is more efficient than fetching all products and then filtering
 */
export async function fetchProductsWithLocationInventory(): Promise<Square.CatalogObject[]> {
  const locationId = process.env.SQUARE_LOCATION_ID;
  if (!locationId) {
    console.log('⚠️  No SQUARE_LOCATION_ID configured - falling back to fetchAllSquareProducts');
    return fetchAllSquareProducts();
  }

  console.log('🔄 Fetching products with inventory at location...');
  
  try {
    // First, get all inventory counts for the location
    const inventory = await squareClient.inventory();
    const inventoryResponse = await inventory.batchGetCounts({
      locationIds: [locationId],
    });

    if (!inventoryResponse.data || inventoryResponse.data.length === 0) {
      console.log('⚠️  No inventory found at location');
      return [];
    }

    // Filter to only products with inventory > 0
    const productsWithInventory = inventoryResponse.data.filter((item: any) => {
      const quantity = Number(item.quantity) || 0;
      return quantity > 0;
    });

    console.log(`📍 Found ${productsWithInventory.length} products with inventory at location`);

    if (productsWithInventory.length === 0) {
      return [];
    }

    // Create a set of catalog object IDs that have inventory
    const inventoryCatalogIds = new Set(productsWithInventory.map((item: any) => item.catalogObjectId));

    // Fetch all products and filter by those that have inventory
    const allProducts = await fetchAllSquareProducts();
    const filteredProducts = allProducts.filter(product => {
      if (product.type !== 'ITEM' || !product.itemData?.variations?.length) {
        return false;
      }
      
      const variation = product.itemData.variations[0];
      return variation.id && inventoryCatalogIds.has(variation.id);
    });

    console.log(`✅ Total: Filtered ${filteredProducts.length} products with inventory at location`);
    return filteredProducts;

  } catch (error) {
    console.error('❌ Error fetching products with location inventory:', error);
    console.log('🔄 Falling back to fetchAllSquareProducts...');
    return fetchAllSquareProducts();
  }
}

/**
 * Process a Square catalog item and extract product data
 */
export function processSquareItem(item: Square.CatalogObject): {
  squareId: string;
  title: string;
  price: number;
  description: string;
  image: string;
  artist: string;
  imageIds: string[];
  images: { id: string; url: string }[];
  slug: string;
} | null {
  try {
    if (item.type !== 'ITEM' || !item.itemData?.variations?.length) {
      return null;
    }
    
    const itemData = item.itemData;
    if (!itemData?.variations?.length) {
      return null;
    }
    
    const variation = itemData.variations[0];
    if (variation.type !== 'ITEM_VARIATION' || !variation.id) {
      return null;
    }
    
    // Skip items without price (except vouchers)
    const isVoucher = itemData.name?.toLowerCase().includes('voucher') || 
                     itemData.description?.toLowerCase().includes('voucher');
    
    if (!variation.itemVariationData?.priceMoney && !isVoucher) {
      return null;
    }
    
    const price = variation.itemVariationData?.priceMoney?.amount 
      ? Number(variation.itemVariationData.priceMoney.amount) / 100 
      : 0;
    
    const title = itemData.name || 'No title';
    const description = itemData.description || '';
    const artist = 'Unknown Artist'; // Square doesn't have artist field
    
    // Process images
    const imageIds: string[] = [];
    const images: { id: string; url: string }[] = [];
    
    if (itemData.imageIds && itemData.imageIds.length > 0) {
      imageIds.push(...itemData.imageIds);
      
      // For now, we'll use placeholder URLs - in production you'd fetch actual image URLs
      images.push(...itemData.imageIds.map(id => ({
        id,
        url: `/api/media/${id}` // Placeholder - would need actual image URL fetching
      })));
    }
    
    const mainImage = images.length > 0 ? images[0].url : '/store.webp';
    
    // Generate slug
    const slug = generateSlug(title, artist);
    
    return {
      squareId: variation.id,
      title,
      price,
      description,
      image: mainImage,
      artist,
      imageIds,
      images,
      slug
    };
  } catch (error) {
    console.error('❌ Error processing Square item:', error);
    return null;
  }
}

/**
 * Generate a URL-friendly slug from title and artist
 */
function generateSlug(title: string, artist: string): string {
  const combined = `${title} ${artist}`;
  return combined
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Get stock status based on quantity
 */
export function getStockStatus(quantity: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
  if (quantity === 0) return 'out_of_stock';
  if (quantity < 3) return 'low_stock';
  return 'in_stock';
}

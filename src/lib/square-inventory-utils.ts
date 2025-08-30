import squareClient from '@/lib/square';
import { Square } from 'square';

/**
 * Check if a product has inventory at the configured location
 */
export async function hasLocationInventory(variationId: string): Promise<{
  hasInventory: boolean;
  quantity: number;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
}> {
  try {
    const locationId = process.env.SQUARE_LOCATION_ID;
    if (!locationId) {
      console.log('   ⚠️  No SQUARE_LOCATION_ID configured - defaulting to include product');
      return { hasInventory: true, quantity: 0, stockStatus: 'in_stock' };
    }

    const inventory = await squareClient.inventory();
    const inventoryResponse = await inventory.batchGetCounts({
      locationIds: [locationId],
      catalogObjectIds: [variationId],
    });
    
    if (inventoryResponse && inventoryResponse.data && inventoryResponse.data.length > 0) {
      const quantity = Number(inventoryResponse.data[0].quantity) || 0;
      const stockStatus = quantity === 0 ? 'out_of_stock' : 
                         quantity < 3 ? 'low_stock' : 'in_stock';
      
      console.log(`   📍 Location inventory check for ${variationId}: ${quantity} units (${stockStatus})`);
      return { hasInventory: true, quantity, stockStatus };
    }
    
    console.log(`   📍 No inventory record found for ${variationId} at location ${locationId}`);
    return { hasInventory: false, quantity: 0, stockStatus: 'out_of_stock' };
  } catch (error) {
    console.error('❌ Error checking location inventory:', error);
    return { hasInventory: false, quantity: 0, stockStatus: 'out_of_stock' };
  }
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

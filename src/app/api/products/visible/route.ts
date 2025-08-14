import { NextResponse } from 'next/server';
import squareClient from '@/lib/square';
import { StoreProduct } from '@/lib/types';
import { Square } from 'square';
import Database from 'better-sqlite3';

function safeString(val: unknown): string {
  return typeof val === 'string' ? val : '';
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
    const inventoryResponse = await squareClient.inventory.batchGetCounts({
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
function getProductVisibility(squareId: string, title: string): boolean {
  const db = new Database('data/porchrecords.db');
  
  try {
    // Check if product exists in database by square_id
    const existingProduct = db.prepare('SELECT is_visible FROM products WHERE square_id = ?').get(squareId);
    
    if (existingProduct && typeof existingProduct === 'object' && 'is_visible' in existingProduct) {
      const isVisible = Boolean(existingProduct.is_visible);
      return isVisible;
    }
    
    // Product doesn't exist, create it with default visibility (true)
    const insertProduct = db.prepare(`
      INSERT OR IGNORE INTO products (id, title, square_id, is_visible, is_from_square, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const productId = `square_${squareId}`;
    insertProduct.run(productId, title, squareId, 1, 1, new Date().toISOString());
    
    return true; // Default to visible for new products
  } catch (error) {
    console.error('❌ Error checking product visibility:', error);
    return true; // Default to visible on error
  } finally {
    db.close();
  }
}

// GET - Retrieve only visible products for public store
export async function GET() {
  try {
    // Fetch products directly from Square
    let squareProducts: StoreProduct[] = [];
    try {
      // Use location filtering to only fetch items available at our location
      const locationId = process.env.SQUARE_LOCATION_ID;
      const searchRequest = locationId 
        ? { enabledLocationIds: [locationId] }
        : {};
      
      const response = await squareClient.catalog.searchItems(searchRequest);
      if (response.items) {
        const productsWithImages = await Promise.all(response.items.map(async (item: Square.CatalogObject): Promise<StoreProduct | null> => {
          if (item.type !== 'ITEM' || !item.itemData?.variations?.length) {
            return null;
          }
          
          // Check Square "Online Store" custom attribute (but be lenient for public store)
          // This logic is now handled by hasLocationInventory
          

          
          const variation = item.itemData.variations[0];
          if (variation.type !== 'ITEM_VARIATION' || !variation.id) {
            return null;
          }
          
          // TIER 1: Include items that are present at the location even if inventory tracking is disabled there
          const locationId = process.env.SQUARE_LOCATION_ID;
          const variationData = variation.itemVariationData || {} as any;
          const locationOverrides = (variationData.locationOverrides || []) as Array<{ locationId?: string; trackInventory?: boolean }>;
          const hasInventoryTrackingDisabledAtLocation = !!locationId && (
            variationData.trackInventory === false ||
            locationOverrides.some(o => o && o.locationId === locationId && o.trackInventory === false)
          );

          // Only require an inventory record when tracking is enabled at the location
          if (!hasInventoryTrackingDisabledAtLocation) {
            if (!await hasLocationInventory(variation.id)) {
              console.log(`   ⚠️  Skipping ${item.itemData.name} - no inventory record at configured location`);
              return null;
            }
          }
          
          // Special handling for voucher products - they don't have fixed prices
          const isVoucher = item.itemData.name?.toLowerCase().includes('voucher') || 
                           item.itemData.description?.toLowerCase().includes('voucher');
          
          // Check if variation has price (required for most products, but not vouchers)
          if (!variation.itemVariationData?.priceMoney && !isVoucher) {
            return null;
          }

          const price = isVoucher ? 0 : Number(variation.itemVariationData?.priceMoney?.amount || 0) / 100;
          const imageIds = item.itemData.imageIds || [];
          let images: { id: string; url: string }[] = [];
          let image = '/store.webp';

          if (imageIds.length > 0) {
            images = await Promise.all(imageIds.map(async (imageId: string) => {
              try {
                const imageResponse = await squareClient.catalog.object.get({ objectId: imageId });
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

          // Check visibility in local database
          const isVisible = getProductVisibility(variation.id, item.itemData.name || 'Unknown Product');

          return {
            id: item.id,
            title: safeString(item.itemData.name),
            artist: item.itemData.description || 'Unknown Artist',
            price: price,
            image: image,
            images: images,
            imageIds: item.itemData.imageIds || [],
            genre: safeString(item.itemData.categoryId),
            description: item.itemData.description || '',
            inStock: true,
            isPreorder: false,
            isVisible: isVisible,
            preorderReleaseDate: '',
            preorderQuantity: 0,
            preorderMaxQuantity: 0,
            productType: isVoucher ? 'voucher' : 'record',
            merchCategory: '',
            size: '',
            color: '',
            mood: '',
            stockQuantity: 999,
            stockStatus: 'in_stock',
            isVariablePricing: false
          };
        }));
        squareProducts = productsWithImages.filter((p: StoreProduct | null): p is StoreProduct => p !== null);
      }
    } catch (error) {
      console.error('❌ Error fetching products from Square:', error);
    }
    
    // Filter to only visible products
    const visibleProducts = squareProducts.filter((product: StoreProduct) => product.isVisible === true);
    
    console.log(`📱 Public store: Showing ${visibleProducts.length} visible products out of ${squareProducts.length} total`);
    
    return NextResponse.json({
      success: true,
      products: visibleProducts,
      totalProducts: squareProducts.length,
      visibleProducts: visibleProducts.length,
      fromSquareAPI: true
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error fetching visible products:', error);
    
    return NextResponse.json({
      success: false,
      products: [],
      error: errorMessage
    }, { status: 500 });
  }
}

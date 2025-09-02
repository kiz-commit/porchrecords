import { NextRequest, NextResponse } from 'next/server';
import squareClient from '@/lib/square';
import { Square } from 'square';
import { type StoreProduct } from '@/lib/types';
import * as fs from 'fs';
import * as path from 'path';
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
  const db = new Database('data/porchrecords.db');
  
  try {
    // Check if product exists in database
    const existingProduct = db.prepare('SELECT is_visible FROM products WHERE square_id = ?').get(squareId);
    
    if (existingProduct && typeof existingProduct === 'object' && 'is_visible' in existingProduct) {
      return Boolean(existingProduct.is_visible);
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

// Helper function to get preorder info from database
function getPreorderInfoFromDatabase(productId: string): {
  is_preorder: number;
  preorder_release_date: string;
  preorder_quantity: number;
  preorder_max_quantity: number;
} | null {
  const db = new Database('data/porchrecords.db');
  
  try {
    const preorderInfo = db.prepare(`
      SELECT is_preorder, preorder_release_date, preorder_quantity, preorder_max_quantity
      FROM products WHERE square_id = ?
    `).get(productId) as any;
    
    return preorderInfo || null;
  } catch (error) {
    console.error('❌ Error getting preorder info from database:', error);
    return null;
  } finally {
    db.close();
  }
}

// GET - Fetch all products with inventory data (public endpoint for store)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const productType = searchParams.get('type');
    const genre = searchParams.get('genre');
    const mood = searchParams.get('mood');
    
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
        const productsWithInventory = await Promise.all(
          allItems.map(async (item) => {
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
                console.log(`   ⚠️  No inventory record at configured location for ${item.itemData.name} - including in public inventory as out-of-stock`);
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
          })
        );
        
        inventoryProducts = productsWithInventory.filter((p) => p !== null) as StoreProduct[];
      }
    } catch (error) {
      console.error('Error fetching inventory from Square:', error);
    }

    // Filter by visibility (only show visible products for public API)
    let filteredProducts = inventoryProducts.filter(p => p.isVisible !== false);
    
    // Apply additional filters
    if (productType && productType !== 'all') {
      filteredProducts = filteredProducts.filter(p => p.productType === productType);
    }
    
    if (genre && genre !== 'all') {
      filteredProducts = filteredProducts.filter(p => p.genre === genre);
    }
    
    if (mood && mood !== 'all') {
      filteredProducts = filteredProducts.filter(p => p.mood === mood);
    }

    const totalProducts = filteredProducts.length;
    
    // Apply pagination
    const paginatedProducts = filteredProducts.slice(offset, offset + limit);
    
    console.log(`🚀 Public inventory API: Found ${paginatedProducts.length} visible products from Square inventory`);

    return NextResponse.json({
      success: true,
      products: paginatedProducts,
      totalProducts,
      currentPage: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(totalProducts / limit),
      hasMore: offset + limit < totalProducts,
      fromSquare: true,
      cacheTime: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error fetching public inventory:', error);
    
    return NextResponse.json({
      success: false,
      products: [],
      error: errorMessage
    }, { status: 500 });
  }
}

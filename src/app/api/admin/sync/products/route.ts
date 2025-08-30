import { NextRequest, NextResponse } from 'next/server';
import squareClient from '@/lib/square';
import { Square } from 'square';
import Database from 'better-sqlite3';

function getPreorderInfo(db: Database.Database, productId: string): {
  is_preorder: number;
  preorder_release_date: string;
  preorder_quantity: number;
  preorder_max_quantity: number;
} | null {
  try {
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
    return row || null;
  } catch (_e) {
    return null;
  }
}

// Helper function to check if product has inventory at the configured location
async function hasLocationInventory(variationId: string): Promise<{ hasInventory: boolean; quantity: number }> {
  try {
    const locationId = process.env.SQUARE_LOCATION_ID;
    if (!locationId) {
      console.log('   ⚠️  No SQUARE_LOCATION_ID configured - defaulting to include product');
      return { hasInventory: true, quantity: 0 };
    }

    const inventory = await squareClient.inventory();
    const inventoryResponse = await inventory.batchGetCounts({
      locationIds: [locationId],
      catalogObjectIds: [variationId],
    });
    
    if (inventoryResponse && inventoryResponse.data && inventoryResponse.data.length > 0) {
      const quantity = Number(inventoryResponse.data[0].quantity) || 0;
      console.log(`   📍 Location inventory check for ${variationId}: ${quantity} units`);
      return { hasInventory: true, quantity };
    }
    
    console.log(`   📍 No inventory record found for ${variationId} at location ${locationId}`);
    return { hasInventory: false, quantity: 0 };
  } catch (error) {
    console.error('❌ Error checking location inventory:', error);
    return { hasInventory: false, quantity: 0 };
  }
}

// POST - Sync products from Square to local database
export async function POST() {
  const db = new Database('data/porchrecords.db');
  let syncedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  try {
    console.log('🔄 Starting product sync from Square API to local database...');
    
    // Use location filtering to only fetch items available at our location
    const locationId = process.env.SQUARE_LOCATION_ID;
    const searchRequest = locationId 
      ? { enabledLocationIds: [locationId] }
      : {};
    
    const catalog = await squareClient.catalog();
    const response = await catalog.searchItems(searchRequest);
    
    if (!response.items) {
      console.log('⚠️  No items returned from Square API');
      return NextResponse.json({
        success: true,
        syncedCount: 0,
        skippedCount: 0,
        errorCount: 0,
        message: 'No items to sync'
      });
    }

    console.log(`✅ Fetched ${response.items.length} items from Square`);

    // Prepare SQL statements for better performance
    const insertProduct = db.prepare(`
      INSERT INTO products (
        id, title, price, description, image, artist, genre, 
        is_preorder, square_id, is_from_square, is_visible,
        stock_quantity, stock_status, product_type, merch_category,
        size, color, mood, format, year, label, image_ids, images,
        preorder_release_date, preorder_quantity, preorder_max_quantity,
        is_variable_pricing, min_price, max_price, created_at,
        updated_at, last_synced_at, square_updated_at, in_stock
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const updateProduct = db.prepare(`
      UPDATE products SET
        title = ?, price = ?, description = ?, image = ?, 
        stock_quantity = ?, stock_status = ?, 
        image_ids = ?, images = ?,
        preorder_release_date = ?, preorder_quantity = ?, preorder_max_quantity = ?,
        is_variable_pricing = ?, min_price = ?, max_price = ?,
        updated_at = ?, last_synced_at = ?, square_updated_at = ?, in_stock = ?
      WHERE square_id = ?
    `);

    const checkExistingProduct = db.prepare('SELECT id, genre, mood, is_visible, product_type, merch_category, size, color FROM products WHERE square_id = ?');

    const now = new Date().toISOString();

    // Process items sequentially (we need async for Square API calls)
    for (const item of response.items) {
        try {
          if (item.type !== 'ITEM' || !(item as any).itemData?.variations?.length) {
            skippedCount++;
            continue;
          }

          const itemData = (item as any).itemData;
          const variation = itemData.variations[0];
          
          if (variation.type !== 'ITEM_VARIATION' || !variation.id) {
            skippedCount++;
            continue;
          }

          // Determine product type and handle vouchers
          let productType = 'record';
          const description = itemData.description || '';
          const isVoucher = itemData.name?.toLowerCase().includes('voucher') || 
                           description.toLowerCase().includes('voucher');
          
          if (isVoucher) {
            productType = 'voucher';
          } else if (description.includes('merch') || description.includes('Merch')) {
            productType = 'merch';
          }

          // Check for existing product to preserve local changes
          const existingProduct = checkExistingProduct.get(variation.id) as {
            id?: string;
            genre?: string;
            mood?: string;
            is_visible?: number;
            product_type?: string;
            merch_category?: string;
            size?: string;
            color?: string;
          } | undefined;

          // Preserve local changes if product exists
          let genreValue = 'Uncategorized';
          let moodValue = '';
          let isVisible = true;
          let merchCategoryValue = '';
          let sizeValue = '';
          let colorValue = '';

          if (existingProduct) {
            // Preserve admin-set values
            genreValue = existingProduct.genre || 'Uncategorized';
            moodValue = existingProduct.mood || '';
            isVisible = Boolean(existingProduct.is_visible);
            merchCategoryValue = existingProduct.merch_category || '';
            sizeValue = existingProduct.size || '';
            colorValue = existingProduct.color || '';
            
            // Only override product_type if our detection is more specific than default 'record'
            if (existingProduct.product_type && existingProduct.product_type !== 'record') {
              productType = existingProduct.product_type;
            }
          }

          // Check if variation has price (required for most products, but not vouchers)
          if (!variation.itemVariationData?.priceMoney && !isVoucher) {
            console.log(`   ⚠️  Skipping ${itemData.name} - no price and not a voucher`);
            skippedCount++;
            continue;
          }

          const price = isVoucher ? 0 : Number(variation.itemVariationData?.priceMoney?.amount || 0) / 100;

          // Get inventory info (skip for vouchers)
          let stockQuantity = 0;
          let stockStatus = 'out_of_stock';
          let hasInventory = true;

          if (!isVoucher) {
            const inventoryInfo = await hasLocationInventory(variation.id);
            hasInventory = inventoryInfo.hasInventory;
            stockQuantity = inventoryInfo.quantity;
            
            if (!hasInventory) {
              console.log(`   ⚠️  Skipping ${itemData.name} - no inventory at location`);
              skippedCount++;
              continue;
            }
            
            stockStatus = stockQuantity === 0 ? 'out_of_stock' : 
                         stockQuantity < 3 ? 'low_stock' : 'in_stock';
          } else {
            // Vouchers are always "in stock"
            stockQuantity = 999;
            stockStatus = 'in_stock';
            console.log(`   🎫 Voucher product ${itemData.name} - skipping inventory check`);
          }

          // Get image URL
          let imageUrl = '/store.webp';
          let imageIds: string[] = [];
          let images: { id: string; url: string }[] = [];

          if (itemData.imageIds && itemData.imageIds.length > 0) {
            imageIds = itemData.imageIds;
            
            try {
              // Fetch first image for primary image
              const imageResponse = await catalog.object.get({ 
                objectId: itemData.imageIds[0] 
              });
              if (imageResponse.object && imageResponse.object.type === 'IMAGE') {
                imageUrl = (imageResponse.object as any).imageData.url || imageUrl;
                images.push({ id: itemData.imageIds[0], url: imageUrl });
              }
            } catch (error) {
              console.error(`   ❌ Error fetching image for ${itemData.name}:`, error);
            }
          }

          // Special handling for vouchers - use a better fallback image
          if (isVoucher && imageUrl === '/store.webp') {
            imageUrl = '/voucher-image.svg';
          }



          // Create the product ID (for vouchers, use item ID; for others, use variation ID)
          const productId = isVoucher ? item.id : variation.id;

          // Read preorder flags from DB (table `preorders`) instead of description tags
          const preorderInfo = getPreorderInfo(db, variation.id);
          const isPreorder = Boolean(preorderInfo?.is_preorder);

          // Insert or update the product (preserving local changes)
          if (existingProduct) {
            // Update existing product (preserving local changes)
            updateProduct.run(
              itemData.name || 'No title',                 // title
              price,                                        // price
              description.replace(/\[HIDDEN FROM STORE\]|\[PREORDER\]/g, '').trim(), // description
              imageUrl,                                     // image
              stockQuantity,                                // stock_quantity
              stockStatus,                                  // stock_status
              JSON.stringify(imageIds),                     // image_ids
              JSON.stringify(images),                       // images
              preorderInfo?.preorder_release_date || '',    // preorder_release_date
              preorderInfo?.preorder_quantity ?? 0,         // preorder_quantity
              preorderInfo?.preorder_max_quantity ?? 0,     // preorder_max_quantity
              isVoucher ? 1 : 0,                           // is_variable_pricing (convert boolean to integer)
              isVoucher ? 10 : null,                       // min_price
              isVoucher ? 500 : null,                      // max_price
              now,                                         // updated_at
              now,                                         // last_synced_at
              item.updatedAt || now,                       // square_updated_at
              stockQuantity > 0 ? 1 : 0,                   // in_stock (convert boolean to integer)
              variation.id                                 // WHERE square_id = ?
            );
            console.log(`   🔄 Updated ${itemData.name} (preserved local changes)`);
          } else {
            // Insert new product
            insertProduct.run(
              productId,                                    // id
              itemData.name || 'No title',                 // title
              price,                                        // price
              description.replace(/\[HIDDEN FROM STORE\]|\[PREORDER\]/g, '').trim(), // description
              imageUrl,                                     // image
              'Unknown Artist',                             // artist
              genreValue,                                   // genre (preserved or default)
              isPreorder ? 1 : 0,                          // is_preorder (convert boolean to integer)
              variation.id,                                 // square_id
              1,                                           // is_from_square (convert boolean to integer)
              isVisible ? 1 : 0,                           // is_visible (convert boolean to integer)
              stockQuantity,                                // stock_quantity
              stockStatus,                                  // stock_status
              productType,                                  // product_type
              merchCategoryValue,                           // merch_category (preserved or default)
              sizeValue,                                    // size (preserved or default)
              colorValue,                                   // color (preserved or default)
              moodValue,                                    // mood (preserved or default)
              '',                                          // format
              '',                                          // year
              '',                                          // label
              JSON.stringify(imageIds),                     // image_ids
              JSON.stringify(images),                       // images
              preorderInfo?.preorder_release_date || '',    // preorder_release_date
              preorderInfo?.preorder_quantity ?? 0,         // preorder_quantity
              preorderInfo?.preorder_max_quantity ?? 0,     // preorder_max_quantity
              isVoucher ? 1 : 0,                           // is_variable_pricing (convert boolean to integer)
              isVoucher ? 10 : null,                       // min_price
              isVoucher ? 500 : null,                      // max_price
              now,                                         // created_at
              now,                                         // updated_at
              now,                                         // last_synced_at
              item.updatedAt || now,                       // square_updated_at
              stockQuantity > 0 ? 1 : 0                    // in_stock (convert boolean to integer)
            );
            console.log(`   ➕ Added new product ${itemData.name}`);
          }

          syncedCount++;
          console.log(`   ✅ Synced ${itemData.name} - Type: ${productType}, Stock: ${stockQuantity}, Visible: ${isVisible ? '✅' : '❌'}, Genre: ${genreValue}, Mood: ${moodValue || 'none'}`);

        } catch (error) {
          console.error(`   ❌ Error processing product ${item.id}:`, error);
          errorCount++;
        }
    }

    console.log(`🎉 Sync completed! Synced: ${syncedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`);
    console.log(`💾 Local changes (genre, mood, visibility) were preserved during sync`);

    return NextResponse.json({
      success: true,
      syncedCount,
      skippedCount,
      errorCount,
      message: `Successfully synced ${syncedCount} products from Square (local changes preserved)`
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error during product sync:', error);
    
    return NextResponse.json({
      success: false,
      syncedCount,
      skippedCount,
      errorCount,
      error: errorMessage
    }, { status: 500 });
  } finally {
    db.close();
  }
}

// GET - Get sync status and last sync info
export async function GET() {
  const db = new Database('data/porchrecords.db');
  
  try {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN is_visible = 1 THEN 1 END) as visible_products,
        COUNT(CASE WHEN is_from_square = 1 THEN 1 END) as square_products,
        MAX(last_synced_at) as last_sync_time
      FROM products
    `).get();

    const productTypes = db.prepare(`
      SELECT product_type, COUNT(*) as count 
      FROM products 
      WHERE is_visible = 1 
      GROUP BY product_type
    `).all();

    return NextResponse.json({
      success: true,
      stats,
      productTypes
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error getting sync status:', error);
    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  } finally {
    db.close();
  }
}

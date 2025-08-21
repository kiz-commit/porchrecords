import { NextRequest, NextResponse } from 'next/server';
import squareClient from '@/lib/square';
import { Square } from 'square';
import Database from 'better-sqlite3';
import { autoInvalidateAfterSync } from '@/lib/cache-invalidation';

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

// POST - Simple sync products from Square to local database (without complex inventory checks)
export async function POST() {
  const db = new Database('data/porchrecords.db');
  let syncedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  try {
    console.log('🔄 Starting simple product sync from Square API to local database...');
    
    // Use location filtering to only fetch items available at our location (fallback to all if none found in sandbox)
    const locationId = process.env.SQUARE_LOCATION_ID;
    const searchRequest = locationId 
      ? { enabledLocationIds: [locationId] }
      : {};
    
    const catalog = await squareClient.catalog();
    const response = await catalog.searchItems(searchRequest);
    let items = response.items || [];
    
    if (items.length === 0 && locationId) {
      console.log('⚠️  No items with location filter. Falling back to unfiltered fetch (sandbox support)...');
      try {
        const fallback = await catalog.searchItems({});
        items = fallback.items || [];
        console.log(`✅ Fallback fetched ${items.length} items from Square`);
      } catch (e) {
        console.log('❌ Fallback fetch failed:', e);
      }
    }

    if (items.length === 0) {
      console.log('⚠️  No items returned from Square API');
      return NextResponse.json({
        success: true,
        syncedCount: 0,
        skippedCount: 0,
        errorCount: 0,
        message: 'No items to sync'
      });
    }

    console.log(`✅ Fetched ${items.length} items from Square`);

    // Prepare SQL statement
    const insertOrUpdateProduct = db.prepare(`
      INSERT OR REPLACE INTO products (
        id, title, price, description, image, artist, genre, 
        is_preorder, square_id, is_from_square, is_visible,
        stock_quantity, stock_status, product_type, merch_category,
        size, color, mood, format, year, label, image_ids, images,
        preorder_release_date, preorder_quantity, preorder_max_quantity,
        is_variable_pricing, min_price, max_price, created_at,
        updated_at, last_synced_at, square_updated_at, in_stock
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();

    // Process items one by one
    for (const item of items) {
      try {
        console.log(`   🔍 Processing item: ${(item as any).itemData?.name || item.id}`);
        
        if (item.type !== 'ITEM' || !(item as any).itemData?.variations?.length) {
          console.log(`   ⚠️  Skipping - not an ITEM or no variations`);
          skippedCount++;
          continue;
        }

        const itemData = (item as any).itemData;
        const variation = itemData.variations[0];
        
        if (variation.type !== 'ITEM_VARIATION' || !variation.id) {
          console.log(`   ⚠️  Skipping - not an ITEM_VARIATION or no ID`);
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

        // Extract price - be more lenient for sandbox data
        let price = 0;
        if (isVoucher) {
          price = 0; // Vouchers have variable pricing
        } else if (variation.itemVariationData?.priceMoney?.amount) {
          price = Number(variation.itemVariationData.priceMoney.amount) / 100;
        } else {
          // For sandbox items without explicit pricing, try to extract from description or use default
          const priceMatch = description.match(/\$(\d+(?:\.\d{2})?)/);
          if (priceMatch) {
            price = Number(priceMatch[1]);
          } else {
            // Default price for sandbox items without explicit pricing
            price = 19.99;
            console.log(`   💰 Using default price $${price} for ${itemData.name} (no explicit pricing found)`);
          }
        }

        console.log(`   💰 Price for ${itemData.name}: $${price}`);

        // Simple stock management - assume in stock for sandbox
        let stockQuantity = 10;
        let stockStatus = 'in_stock';

        if (isVoucher) {
          stockQuantity = 999;
          stockStatus = 'in_stock';
        }

        // Get image URL (simplified - just use first image if available)
        let imageUrl = '/store.webp';
        let imageIds: string[] = [];
        let images: { id: string; url: string }[] = [];

        if (itemData.imageIds && itemData.imageIds.length > 0) {
          imageIds = itemData.imageIds;
          imageUrl = `https://square-catalog-production.s3.amazonaws.com/files/${itemData.imageIds[0]}`;
          images.push({ id: itemData.imageIds[0], url: imageUrl });
        }

        // Special handling for vouchers - use a better fallback image
        if (isVoucher && imageUrl === '/store.webp') {
          imageUrl = '/voucher-image.svg';
        }

        // Check existing visibility in database (preserve manual visibility settings)
        const existingProduct = db.prepare('SELECT is_visible FROM products WHERE square_id = ?').get(variation.id) as { is_visible?: number } | undefined;
        const isVisible = existingProduct ? Boolean(existingProduct.is_visible) : true;

        // Create the product ID (for vouchers, use item ID; for others, use variation ID)
        const productId = isVoucher ? item.id : variation.id;

        // Pull preorder flags from DB instead of description tags
        const preorderInfo = getPreorderInfo(db, variation.id);
        const isPreorder = Boolean(preorderInfo?.is_preorder);

        // Insert or update the product
        insertOrUpdateProduct.run(
          productId,                                    // id
          itemData.name || 'No title',                 // title
          price,                                        // price
          description.replace(/\[HIDDEN FROM STORE\]|\[PREORDER\]/g, '').trim(), // description (strip legacy tags)
          imageUrl,                                     // image
          'Unknown Artist',                             // artist (can be enhanced)
          'Uncategorized',                             // genre (can be enhanced)
          isPreorder,                                   // is_preorder
          variation.id,                                 // square_id
          true,                                         // is_from_square
          isVisible,                                    // is_visible
          stockQuantity,                                // stock_quantity
          stockStatus,                                  // stock_status
          productType,                                  // product_type
          '',                                          // merch_category
          '',                                          // size
          '',                                          // color
          '',                                          // mood
          '',                                          // format
          '',                                          // year
          '',                                          // label
          JSON.stringify(imageIds),                     // image_ids
          JSON.stringify(images),                       // images
          preorderInfo?.preorder_release_date || '',    // preorder_release_date
          preorderInfo?.preorder_quantity ?? 0,         // preorder_quantity
          preorderInfo?.preorder_max_quantity ?? 0,     // preorder_max_quantity
          isVoucher,                                   // is_variable_pricing
          isVoucher ? 10 : null,                       // min_price
          isVoucher ? 500 : null,                      // max_price
          now,                                         // created_at
          now,                                         // updated_at
          now,                                         // last_synced_at
          item.updatedAt || now,                       // square_updated_at
          stockQuantity > 0                            // in_stock (legacy field)
        );

        syncedCount++;
        console.log(`   ✅ Synced ${itemData.name} - Type: ${productType}, Stock: ${stockQuantity}, Visible: ${isVisible ? '✅' : '❌'}`);

      } catch (error) {
        console.error(`   ❌ Error processing product ${(item as any).itemData?.name || item.id}:`, error);
        errorCount++;
      }
    }

    console.log(`🎉 Simple sync completed! Synced: ${syncedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`);

    // Automatically invalidate product caches after sync
    if (syncedCount > 0) {
      await autoInvalidateAfterSync('products');
      console.log('✅ Caches invalidated after product sync');
    }

    return NextResponse.json({
      success: true,
      syncedCount,
      skippedCount,
      errorCount,
      message: `Successfully synced ${syncedCount} products from Square`,
      cacheInvalidated: syncedCount > 0
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

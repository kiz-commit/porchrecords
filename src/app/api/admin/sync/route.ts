import { NextRequest, NextResponse } from 'next/server';
import squareClient from '@/lib/square';
import { invalidateProductsCache } from '@/lib/cache-utils';
import Database from 'better-sqlite3';
import path from 'path';

// Database path
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'porchrecords.db');

// Database helper functions
const getDatabase = () => {
  return new Database(DB_PATH);
};

const readProductsFromDatabase = () => {
  const db = getDatabase();
  try {
    const products = db.prepare('SELECT * FROM products WHERE is_from_square = 1').all();
    return products;
  } finally {
    db.close();
  }
};

const writeProductToDatabase = (product: any) => {
  const db = getDatabase();
  try {
    const now = new Date().toISOString();
    const productId = `square_${product.squareId}`;
    
    // Check if product exists using the id field
    const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(productId);
    
    if (existing) {
      // Update existing product
      db.prepare(`
        UPDATE products 
        SET title = ?, price = ?, description = ?, image = ?, 
            artist = ?, genre = ?, updated_at = ?, last_synced_at = ?
        WHERE id = ?
      `).run(
        product.title,
        product.price,
        product.description,
        product.image,
        product.artist,
        product.genre,
        now,
        now,
        productId
      );
    } else {
      // Insert new product
      db.prepare(`
        INSERT INTO products (
          id, title, price, description, image, in_stock, artist, genre,
          is_preorder, square_id, is_from_square, is_visible, stock_quantity,
          stock_status, product_type, updated_at, created_at, last_synced_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        productId,
        product.title,
        product.price,
        product.description,
        product.image,
        1, // in_stock
        product.artist,
        product.genre,
        0, // is_preorder
        product.squareId,
        1, // is_from_square
        1, // is_visible = true (new products are visible by default)
        10, // stock_quantity
        'in_stock',
        'record',
        now,
        now,
        now
      );
    }
  } finally {
    db.close();
  }
};

const updateSyncStatus = (lastSync: string, pendingChanges: number = 0) => {
  const db = getDatabase();
  try {
    db.prepare(`
      INSERT OR REPLACE INTO site_config (config_key, config_value, updated_at)
      VALUES ('last_sync', ?, ?)
    `).run(lastSync, new Date().toISOString());
    
    db.prepare(`
      INSERT OR REPLACE INTO site_config (config_key, config_value, updated_at)
      VALUES ('pending_changes', ?, ?)
    `).run(pendingChanges.toString(), new Date().toISOString());
  } finally {
    db.close();
  }
};

export async function POST(request: NextRequest) {
  try {
    const { direction } = await request.json();
    const log: string[] = [];
    const now = new Date().toISOString();

    log.push(`[${new Date().toLocaleString()}] Starting ${direction} sync...`);

    if (direction === 'pull' || direction === 'both') {
      log.push('Pulling products from Square...');
      
      try {
        // Use the working sync logic from products endpoint
        const db = new Database(DB_PATH);
        
        // Ensure available_at_location column exists
        try {
          db.exec('ALTER TABLE products ADD COLUMN available_at_location BOOLEAN DEFAULT 1;');
          console.log('✅ Added available_at_location column');
        } catch (error: any) {
          if (!error.message.includes('duplicate column name')) {
            console.error('❌ Error adding column:', error);
          }
        }
        // First, set all existing products to available_at_location = 0 (not available)
        // Then we'll update only the ones that have inventory to 1
        console.log('🔄 Resetting all products to available_at_location = 0');
        db.prepare('UPDATE products SET available_at_location = 0 WHERE is_from_square = 1').run();
        
        let syncedCount = 0;

        // Fetch all products and filter by inventory at our location
        const locationId = process.env.SQUARE_LOCATION_ID;
        const searchRequest = {}; // Get all products, we'll filter by inventory
        
        console.log(`🏪 Will filter by inventory at location: ${locationId}`);
        
        const catalog = await squareClient.catalog();
        
        // Handle pagination to get ALL items
        let allItems: any[] = [];
        let cursor: string | undefined = undefined;
        let pageCount = 0;
        
        do {
          const paginatedRequest = {
            ...searchRequest,
            cursor,
            limit: 100 // Square API maximum is 100 items per page
          };
          
          const response = await catalog.searchItems(paginatedRequest);
          pageCount++;
          
          if (response.items) {
            allItems.push(...response.items);
            log.push(`📄 Page ${pageCount}: Fetched ${response.items.length} items`);
          }
          
          cursor = response.cursor;
        } while (cursor);
        
        if (allItems.length === 0) {
          log.push('⚠️ No items returned from Square API');
        } else {
          log.push(`✅ Total fetched: ${allItems.length} items from Square (${pageCount} pages)`);

          // Prepare SQL statements for better performance
          const insertOrUpdateProduct = db.prepare(`
            INSERT OR REPLACE INTO products (
              id, title, price, description, image, in_stock, artist, genre, curation_tags,
              is_preorder, square_id, is_from_square, updated_at, is_visible,
              stock_quantity, stock_status, product_type, merch_category,
              size, color, mood, format, year, label, image_ids, images,
              preorder_release_date, preorder_quantity, preorder_max_quantity,
              is_variable_pricing, min_price, max_price, created_at,
              last_synced_at, square_updated_at, slug, has_variations,
              variation_count, last_variation_sync, variations, available_at_location
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          // Process items
          for (const item of allItems) {
            try {
              if (item.type !== 'ITEM' || !(item as any).itemData?.variations?.length) {
                console.log(`⏭️  Skipping item: type=${item.type}, variations=${(item as any).itemData?.variations?.length}`);
                continue;
              }

              const itemData = (item as any).itemData;

              for (const variation of itemData.variations) {
                if (variation.type !== 'ITEM_VARIATION' || !variation.id) {
                  console.log(`⏭️  Skipping variation: type=${variation.type}, id=${variation.id}`);
                  continue;
                }
                // Extract price - be more lenient for sandbox data
                let price = 0;
                if (variation.itemVariationData?.priceMoney?.amount) {
                  price = Number(variation.itemVariationData.priceMoney.amount) / 100;
                } else {
                  // For sandbox items without explicit pricing, use default
                  price = 19.99;
                  console.log(`💰 Using default price $${price} for ${itemData.name} (sandbox mode)`);
                }
                const productId = `square_${variation.id}`;
                
                // Get image URL
                const imageUrl = itemData?.imageIds?.[0] 
                  ? `https://square-catalog-production.s3.amazonaws.com/files/${itemData.imageIds[0]}`
                  : '/store.webp';

                // Process description and check for hidden/preorder tags
                const description = itemData?.description || '';
                const isHidden = description.includes('[HIDDEN FROM STORE]');
                const isPreorder = description.includes('[PREORDER]');
                const cleanDescription = description.replace(/\[HIDDEN FROM STORE\]|\[PREORDER\]/g, '').trim();

                // Determine product type from title
                let productType = 'record';
                const title = itemData.name || 'No title';
                if (title.toLowerCase().includes('tote') || title.toLowerCase().includes('shirt') || title.toLowerCase().includes('hoodie')) {
                  productType = 'merch';
                }

                // Create arrays for images
                const imageIds = itemData?.imageIds || [];
                const images = imageIds.map((id: string) => ({
                  id,
                  url: `https://square-catalog-production.s3.amazonaws.com/files/${id}`
                }));

                // Fetch real inventory from Square and determine location availability
                let stockQuantity = 0;
                let stockStatus = 'out_of_stock';
                let availableAtLocation = false; // Only true if product has inventory at our location
                
                try {
                  const locationId = process.env.SQUARE_LOCATION_ID;
                  if (locationId) {
                    const inventory = await squareClient.inventory();
                    const inventoryResponse = await inventory.batchGetCounts({
                      locationIds: [locationId],
                      catalogObjectIds: [variation.id],
                    });
                    
                    if (inventoryResponse && inventoryResponse.data && inventoryResponse.data.length > 0) {
                      stockQuantity = Number(inventoryResponse.data[0].quantity) || 0;
                      availableAtLocation = true; // Has inventory record at our location
                      console.log(`🏪 ${title}: Found at location ${locationId}, qty=${stockQuantity}`);
                    } else {
                      console.log(`❌ ${title}: No inventory at location ${locationId}`);
                    }
                  } else {
                    // If no location configured, assume available everywhere
                    availableAtLocation = true;
                    console.log(`⚠️ ${title}: No location configured, assuming available`);
                  }
                } catch (error) {
                  console.error(`Error fetching inventory for ${variation.id}:`, error);
                  stockQuantity = 0;
                  availableAtLocation = false;
                }

                // Determine stock status based on quantity
                if (stockQuantity === 0) {
                  stockStatus = 'out_of_stock';
                } else if (stockQuantity < 3) {
                  stockStatus = 'low_stock';
                } else {
                  stockStatus = 'in_stock';
                }

                // Insert or update the product
                try {
                  console.log(`💾 About to save ${title} with available_at_location = ${availableAtLocation ? 1 : 0}`);
                  insertOrUpdateProduct.run(
                    productId,                                    // id
                    title,                                        // title
                    price,                                        // price
                    cleanDescription,                             // description
                    imageUrl,                                     // image
                    stockQuantity > 0 ? 1 : 0,                  // in_stock
                    'Unknown Artist',                             // artist
                    'Uncategorized',                             // genre
                    '',                                          // curation_tags
                    isPreorder ? 1 : 0,                         // is_preorder
                    variation.id,                                 // square_id
                    1,                                           // is_from_square
                    now,                                         // updated_at
                    isHidden ? 0 : 1,                           // is_visible
                    stockQuantity,                               // stock_quantity (real from Square)
                    stockStatus,                                 // stock_status (calculated from real inventory)
                    productType,                                 // product_type
                    '',                                          // merch_category
                    '',                                          // size
                    '',                                          // color
                    '',                                          // mood
                    '',                                          // format
                    '',                                          // year
                    '',                                          // label
                    JSON.stringify(imageIds),                    // image_ids
                    JSON.stringify(images),                      // images
                    '',                                          // preorder_release_date
                    0,                                           // preorder_quantity
                    0,                                           // preorder_max_quantity
                    0,                                           // is_variable_pricing
                    null,                                        // min_price
                    null,                                        // max_price
                    now,                                         // created_at
                    now,                                         // last_synced_at
                    now,                                         // square_updated_at
                    null,                                        // slug (will be auto-generated)
                    0,                                           // has_variations
                    0,                                           // variation_count
                    null,                                        // last_variation_sync
                    null,                                        // variations
                    availableAtLocation ? 1 : 0                  // available_at_location
                  );

                  syncedCount++;
                  log.push(`Updated: ${title}`);
                  console.log(`✅ Successfully synced: ${title} (${productId})`);
                } catch (insertError) {
                  console.error(`❌ Failed to insert ${title}:`, insertError);
                  log.push(`❌ Failed to sync: ${title} - ${insertError}`);
                }
              }
            } catch (error) {
              console.error('Error processing item:', error);
            }
          }
          
          log.push(`Pull complete: ${syncedCount} products synced to database`);
        }
        
        db.close();
      } catch (error) {
        log.push(`Error pulling from Square: ${error}`);
        console.error('Error pulling from Square:', error);
      }
    }

    if (direction === 'push' || direction === 'both') {
      log.push('Pushing local products to Square...');
      
      try {
        const existingProducts = readProductsFromDatabase();
        const localProducts = existingProducts.filter((p: any) => !p.is_from_square && !p.square_id);
        let pushedProducts = 0;

        for (const product of localProducts as any[]) {
          try {
            const locationId = process.env.SQUARE_LOCATION_ID;
            if (!locationId) {
              throw new Error('SQUARE_LOCATION_ID not configured');
            }

            // Create item in Square
            const catalog = await squareClient.catalog();
            const squareResponse = await catalog.batchUpsert({
              batches: [
                {
                  objects: [
                    {
                      type: 'ITEM',
                      id: `#${product.id}`,
                      itemData: {
                        name: product.title,
                        description: product.description,
                        categoryId: null,
                        variations: [
                          {
                            type: 'ITEM_VARIATION',
                            id: `#${product.id}_variation`,
                            itemVariationData: {
                              itemId: `#${product.id}`,
                              name: product.title,
                              pricingType: 'FIXED_PRICING',
                              priceMoney: {
                                amount: BigInt(Math.round(product.price * 100)),
                                currency: 'AUD'
                              },
                              trackInventory: true,
                              inventoryAlertType: 'LOW_QUANTITY',
                              inventoryAlertThreshold: BigInt(5),
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              ],
              idempotencyKey: `push-product-${product.id}-${Date.now()}`,
            });

            // Update the product with Square ID in database
            const db = getDatabase();
            try {
              db.prepare(`
                UPDATE products 
                SET square_id = ?, is_from_square = 1, updated_at = ?
                WHERE id = ?
              `).run(squareResponse.objects?.[0]?.id, now, product.id);
            } finally {
              db.close();
            }
            
            pushedProducts++;
            log.push(`Pushed: ${product.title}`);
          } catch (error) {
            log.push(`Failed to push ${product.title}: ${error}`);
          }
        }
        
        log.push(`Push complete: ${pushedProducts} products pushed to Square`);
      } catch (error) {
        log.push(`Error pushing to Square: ${error}`);
        console.error('Error pushing to Square:', error);
      }
    }

    log.push(`[${new Date().toLocaleString()}] Sync completed`);
    updateSyncStatus(now);

    // Invalidate the products cache after successful sync so changes appear immediately in the store
    invalidateProductsCache(`${direction} sync operation`);

    return NextResponse.json({
      success: true,
      log,
      message: `${direction} sync completed successfully`
    });
  } catch (error) {
    console.error('Error during sync:', error);
    return NextResponse.json(
      { error: 'Failed to perform sync operation' },
      { status: 500 }
    );
  }
} 
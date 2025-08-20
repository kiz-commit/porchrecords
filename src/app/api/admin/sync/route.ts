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
        const response = await squareClient.catalog.searchItems({});
        // Safely stringify BigInt values for logging
        function replacer(key: string, value: any) {
          return typeof value === 'bigint' ? value.toString() : value;
        }
        console.log('Square API response:', JSON.stringify(response, replacer, 2));
        
        const existingProducts = readProductsFromDatabase();
        let newProducts = 0;
        let updatedProducts = 0;
        let removedProducts = 0;

        if (response.items) {
          const squareProducts = response.items.map((item: any) => {
            if (item.type !== 'ITEM' || !item.itemData?.variations?.length) {
              return null;
            }
            const variation = item.itemData.variations[0];
            if (variation.type !== 'ITEM_VARIATION' || !variation.id) {
              return null;
            }
            if (!variation.itemVariationData?.priceMoney) {
              return null;
            }

            const price = Number(variation.itemVariationData.priceMoney.amount) / 100;
            const image = item.itemData?.imageIds?.[0] 
              ? `https://square-catalog-production.s3.amazonaws.com/files/${item.itemData.imageIds[0]}` 
              : "/hero-image.jpg";

            return {
              id: variation.id,
              title: item.itemData.name || 'No title',
              price: price,
              description: item.itemData.description ?? '',
              image: image,
              inStock: true,
              artist: 'Unknown Artist',
              genre: 'Uncategorized',
              curationTags: [],
              isPreorder: false,
              squareId: item.id,
              isFromSquare: true,
              updatedAt: now,
            };
          }).filter(Boolean);

          // Get current Square product IDs
          const currentSquareIds = squareProducts.map((p: any) => p.squareId);
          
          // Remove products that no longer exist in Square
          const db = getDatabase();
          try {
            const productsToRemove = existingProducts.filter((p: any) => 
              p.square_id && !currentSquareIds.includes(p.square_id)
            );
            
            for (const product of productsToRemove) {
              const productData = product as { square_id: string; title: string };
              db.prepare('DELETE FROM products WHERE square_id = ?').run(productData.square_id);
              removedProducts++;
              log.push(`Removed: ${productData.title} (no longer in Square)`);
            }
          } finally {
            db.close();
          }

          // Process each current product
          squareProducts.forEach((squareProduct: any) => {
            const existingProduct = existingProducts.find((p: any) => p.square_id === squareProduct.squareId);
            
            if (!existingProduct) {
              // New product
              writeProductToDatabase(squareProduct);
              newProducts++;
              log.push(`Added: ${squareProduct.title}`);
            } else {
              // Update existing product
              writeProductToDatabase(squareProduct);
              updatedProducts++;
              log.push(`Updated: ${squareProduct.title}`);
            }
          });
          
          log.push(`Pull complete: ${newProducts} new, ${updatedProducts} updated, ${removedProducts} removed`);
        }
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
            const squareResponse = await squareClient.catalog.batchUpsert({
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
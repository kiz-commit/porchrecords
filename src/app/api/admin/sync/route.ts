import { NextRequest, NextResponse } from 'next/server';
import { fetchProductsFromSquareWithRateLimit } from '@/lib/square-api-service';
import { getAdminFields, updateProductInventory, upsertProductFromSquare } from '@/lib/product-database-utils';
import { invalidateProductsCache } from '@/lib/cache-utils';
import { generateSlug } from '@/lib/slug-utils';
import Database from 'better-sqlite3';
import path from 'path';

// Database path
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'porchrecords.db');

// Database helper functions
const getDatabase = () => {
  return new Database(DB_PATH);
};

const updateSyncStatus = (lastSync: string, syncedCount: number = 0) => {
  const db = getDatabase();
  try {
    db.prepare(`
      INSERT OR REPLACE INTO site_config (config_key, config_value, updated_at)
      VALUES ('last_sync', ?, ?)
    `).run(lastSync, new Date().toISOString());
    
    db.prepare(`
      INSERT OR REPLACE INTO site_config (config_key, config_value, updated_at)
      VALUES ('last_sync_count', ?, ?)
    `).run(syncedCount.toString(), new Date().toISOString());
  } finally {
    db.close();
  }
};

// POST - Simplified sync from Square to local database (for admin use)
export async function POST(request: NextRequest) {
  // TEMPORARY: Disable sync to fix performance issues
  return NextResponse.json({
    success: false,
    error: 'Sync temporarily disabled due to performance issues',
    syncedCount: 0,
    skippedCount: 0,
    errorCount: 0,
    log: ['⚠️ Sync temporarily disabled to fix performance issues']
  }, { status: 503 });
  
  try {
    const { direction } = await request.json();
    const log: string[] = [];
    const now = new Date().toISOString();

    log.push(`[${new Date().toLocaleString()}] Starting ${direction} sync...`);

    if (direction === 'pull' || direction === 'both') {
      log.push('Pulling products from Square...');
      
      try {
        // Fetch products with inventory at our location using the rate-limited service
        const squareProducts = await fetchProductsFromSquareWithRateLimit();
        
        if (squareProducts.length === 0) {
          log.push('⚠️  No items returned from Square API');
          return NextResponse.json({
            success: true,
            syncedCount: 0,
            skippedCount: 0,
            errorCount: 0,
            message: 'No items to sync',
            log
          });
        }

        log.push(`✅ Fetched ${squareProducts.length} items from Square`);

        // Process items and update database
        let syncedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        
        for (const product of squareProducts) {
          try {
            // Convert the already processed product to the format needed for database insertion
            const productData = {
              squareId: product.id,
              title: product.title,
              price: product.price,
              description: product.description,
              image: product.image,
              artist: product.artist,
              imageIds: product.imageIds || [],
              images: product.images || [],
              slug: generateSlug(product.title)
            };
            
            // Inventory data is already included in the product from fetchProductsFromSquare
            const inventoryData = {
              stockQuantity: product.stockQuantity,
              stockStatus: product.stockStatus,
              availableAtLocation: true // Products from fetchProductsFromSquare are already filtered by location
            };
            
            // Create or update product in database with both product and inventory data
            const success = upsertProductFromSquare(productData, inventoryData);

            if (success) {
              console.log(`   ✅ Synced ${productData.title} (${inventoryData.stockQuantity} units) - ${productData.images.length} images`);
              syncedCount++;
            } else {
              console.log(`   ⚠️  Failed to sync ${productData.title}`);
              errorCount++;
            }

          } catch (error) {
            console.error(`   ❌ Error processing item:`, error);
            errorCount++;
          }
        }
        
        // Update sync status
        updateSyncStatus(now, syncedCount);
        
        // Invalidate cache
        invalidateProductsCache('sync completion');

        log.push(`🎉 Sync completed! Synced: ${syncedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`);

        return NextResponse.json({
          success: true,
          syncedCount,
          skippedCount,
          errorCount,
          totalProcessed: syncedCount + skippedCount,
          totalProducts: squareProducts.length,
          isComplete: true,
          nextChunk: null,
          message: `Successfully synced ${syncedCount} products from Square`,
          log
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Sync error:', error);
        log.push(`❌ Sync failed: ${errorMessage}`);
        
        return NextResponse.json({
          success: false,
          error: errorMessage,
          log
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Sync completed',
      log
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Request error:', error);
    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}

// GET - Get sync status
export async function GET() {
  try {
    const db = getDatabase();
    
    try {
      const lastSync = db.prepare('SELECT config_value FROM site_config WHERE config_key = ?').get('last_sync') as any;
      const lastSyncCount = db.prepare('SELECT config_value FROM site_config WHERE config_key = ?').get('last_sync_count') as any;
      
      return NextResponse.json({
        success: true,
        lastSync: lastSync?.config_value || null,
        lastSyncCount: lastSyncCount ? parseInt(lastSyncCount.config_value) : 0,
        locationId: process.env.SQUARE_LOCATION_ID || 'Not configured'
      });
    } finally {
      db.close();
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error getting sync status:', error);
    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
} 
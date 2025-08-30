import { NextRequest, NextResponse } from 'next/server';
import { fetchProductsWithLocationInventory, batchCheckLocationInventory, processSquareItem } from '@/lib/square-inventory-utils';
import { getAdminFields, updateProductInventory, resetLocationAvailability } from '@/lib/product-database-utils';
import { invalidateProductsCache } from '@/lib/cache-utils';
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

// Helper function to sync a chunk of products
const syncProductChunk = async (products: any[], startIndex: number, chunkSize: number) => {
  const endIndex = Math.min(startIndex + chunkSize, products.length);
  const chunk = products.slice(startIndex, endIndex);
  
  console.log(`🔄 Processing chunk ${startIndex + 1}-${endIndex} of ${products.length} products...`);
  
  let syncedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  
  // Process each product in the chunk (already filtered by location inventory)
  for (const productData of chunk) {
    try {
      // Get existing admin fields to preserve
      const adminFields = getAdminFields(productData.squareId);
      
      // Update product inventory (preserves admin fields)
      // Since we already filtered by location inventory, we can assume it has inventory
      const success = updateProductInventory(productData.squareId, {
        stockQuantity: 1, // Default to 1 since we know it has inventory
        stockStatus: 'in_stock',
        availableAtLocation: true
      });

      if (success) {
        console.log(`   ✅ Synced ${productData.title}: 1 unit (in_stock)`);
        syncedCount++;
      } else {
        console.log(`   ⚠️  Failed to update ${productData.title}`);
        errorCount++;
      }

    } catch (error) {
      console.error(`   ❌ Error updating product:`, error);
      errorCount++;
    }
  }
  
  return { syncedCount, skippedCount, errorCount };
};

// POST - Incremental sync from Square to local database
export async function POST(request: NextRequest) {
  try {
    const { direction, chunkSize = 50, startIndex = 0 } = await request.json();
    const log: string[] = [];
    const now = new Date().toISOString();

    log.push(`[${new Date().toLocaleString()}] Starting ${direction} sync...`);

    if (direction === 'pull' || direction === 'both') {
      log.push('Pulling products from Square...');
      
      try {
        // Step 1: For chunked syncs, we don't reset - we only update what we process
        // This preserves existing products and makes the sync truly incremental
        if (startIndex === 0 && chunkSize >= 1000) { // Only reset for large chunks (full syncs)
          resetLocationAvailability();
        }
        
        // Step 2: Fetch only products with inventory at our location
        const squareItems = await fetchProductsWithLocationInventory();
        
        if (squareItems.length === 0) {
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

        log.push(`✅ Fetched ${squareItems.length} items from Square`);

        // Step 3: Process items and collect valid products
        const validProducts: any[] = [];
        let skippedCount = 0;
        let errorCount = 0;
        
        for (const item of squareItems) {
          try {
            // Process the Square item
            const productData = processSquareItem(item);
            if (!productData) {
              skippedCount++;
              continue;
            }
            
            validProducts.push(productData);
          } catch (error) {
            console.error(`   ❌ Error processing item:`, error);
            errorCount++;
          }
        }
        
        console.log(`📦 Processing ${validProducts.length} valid products...`);
        
        // Step 4: Sync the specified chunk
        const chunkResult = await syncProductChunk(validProducts, startIndex, chunkSize);
        
        // Step 5: Update sync status
        updateSyncStatus(now, chunkResult.syncedCount);
        
        // Step 6: Invalidate cache
        invalidateProductsCache('sync completion');

        const totalProcessed = startIndex + chunkResult.syncedCount + chunkResult.skippedCount;
        const isComplete = totalProcessed >= validProducts.length;
        
        log.push(`🎉 Chunk completed! Synced: ${chunkResult.syncedCount}, Skipped: ${chunkResult.skippedCount}, Errors: ${chunkResult.errorCount}`);
        log.push(`📊 Progress: ${totalProcessed}/${validProducts.length} products processed`);
        
        if (isComplete) {
          log.push(`✅ Full sync completed!`);
        } else {
          log.push(`⏭️  Next chunk: startIndex=${startIndex + chunkSize}, chunkSize=${chunkSize}`);
        }

        return NextResponse.json({
          success: true,
          syncedCount: chunkResult.syncedCount,
          skippedCount: chunkResult.skippedCount,
          errorCount: chunkResult.errorCount,
          totalProcessed,
          totalProducts: validProducts.length,
          isComplete,
          nextChunk: isComplete ? null : { startIndex: startIndex + chunkSize, chunkSize },
          message: `Successfully synced ${chunkResult.syncedCount} products from Square`,
          log
        });

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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
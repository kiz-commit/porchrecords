import { NextRequest, NextResponse } from 'next/server';
import { fetchAllSquareProducts, hasLocationInventory, processSquareItem } from '@/lib/square-inventory-utils';
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

// POST - Incremental sync from Square to local database
export async function POST(request: NextRequest) {
  try {
    const { direction } = await request.json();
    const log: string[] = [];
    const now = new Date().toISOString();

    log.push(`[${new Date().toLocaleString()}] Starting ${direction} sync...`);

    if (direction === 'pull' || direction === 'both') {
      log.push('Pulling products from Square...');
      
      try {
        // Step 1: Reset all products to not available at location
        resetLocationAvailability();
        
        // Step 2: Fetch all products from Square
        const squareItems = await fetchAllSquareProducts();
        
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

        // Step 3: Process each item with location filtering
        let syncedCount = 0;
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

            // Check if product has inventory at configured location
            const inventoryData = await hasLocationInventory(productData.squareId);
            
            if (!inventoryData.hasInventory) {
              console.log(`   ❌ Skipping ${productData.title}: No inventory at location`);
              skippedCount++;
              continue;
            }

            // Get existing admin fields to preserve
            const adminFields = getAdminFields(productData.squareId);
            
            // Update product inventory (preserves admin fields)
            const success = updateProductInventory(productData.squareId, {
              stockQuantity: inventoryData.quantity,
              stockStatus: inventoryData.stockStatus,
              availableAtLocation: true
            });

            if (success) {
              console.log(`   ✅ Synced ${productData.title}: ${inventoryData.quantity} units (${inventoryData.stockStatus})`);
              syncedCount++;
            } else {
              console.log(`   ⚠️  Failed to update ${productData.title}`);
              errorCount++;
            }

          } catch (error) {
            console.error(`   ❌ Error processing item:`, error);
            errorCount++;
          }
        }

        // Step 4: Update sync status
        updateSyncStatus(now, syncedCount);
        
        // Step 5: Invalidate cache
        invalidateProductsCache('sync completion');

        log.push(`🎉 Sync completed! Synced: ${syncedCount}, Skipped: ${skippedCount}, Errors: ${errorCount}`);

        return NextResponse.json({
          success: true,
          syncedCount,
          skippedCount,
          errorCount,
          message: `Successfully synced ${syncedCount} products from Square`,
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
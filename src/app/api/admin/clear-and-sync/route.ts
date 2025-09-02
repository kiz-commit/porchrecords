import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/route-protection';
import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'porchrecords.db');

// POST - Clear database and trigger fresh sync
async function postHandler(request: NextRequest) {
  try {
    const log: string[] = [];
    
    log.push(`[${new Date().toLocaleString()}] Starting fresh database clear and sync...`);

    // Step 1: Clear all Square products from database
    log.push('📊 Clearing all Square products from database...');
    const db = new Database(DB_PATH);
    
    let clearedCount = 0;
    try {
      // Get count before clearing
      const countBefore = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_from_square = 1').get() as any;
      log.push(`   Found ${countBefore.count} Square products to clear`);
      
      // Clear all Square products
      const result = db.prepare('DELETE FROM products WHERE is_from_square = 1').run();
      clearedCount = result.changes;
      log.push(`   ✅ Deleted ${clearedCount} Square products from database`);
      
      // Verify clearing
      const countAfter = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_from_square = 1').get() as any;
      log.push(`   📊 Square products remaining: ${countAfter.count}`);
      
    } catch (error) {
      log.push(`❌ Error clearing database: ${error}`);
      throw error;
    } finally {
      db.close();
    }
    
    // Step 2: Trigger fresh sync from Square
    log.push('🔄 Triggering fresh sync from Square...');
    
    try {
      // Call the sync endpoint internally
      const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ direction: 'pull' })
      });
      
      if (!syncResponse.ok) {
        const error = await syncResponse.text();
        throw new Error(`Sync failed: ${syncResponse.status} ${error}`);
      }
      
      const syncResult = await syncResponse.json();
      log.push('🎉 Fresh sync completed!');
      log.push(`   📊 Synced: ${syncResult.syncedCount} products`);
      log.push(`   ⚠️  Skipped: ${syncResult.skippedCount} products`);
      log.push(`   ❌ Errors: ${syncResult.errorCount} products`);
      
      if (syncResult.log && syncResult.log.length > 0) {
        log.push('📝 Sync details:');
        syncResult.log.forEach((line: string) => log.push(`   ${line}`));
      }
      
      // Step 3: Verify results
      log.push('✅ Verification...');
      const dbVerify = new Database(DB_PATH);
      
      try {
        const finalCount = dbVerify.prepare('SELECT COUNT(*) as count FROM products WHERE is_from_square = 1 AND available_at_location = 1').get() as any;
        log.push(`   📊 Final count: ${finalCount.count} products available at your location`);
        
        // Show sample of products
        const sampleProducts = dbVerify.prepare(`
          SELECT title, square_id, available_at_location, stock_quantity, stock_status 
          FROM products 
          WHERE is_from_square = 1 AND available_at_location = 1 
          ORDER BY title ASC 
          LIMIT 5
        `).all() as any[];
        
        if (sampleProducts.length > 0) {
          log.push('   📋 Sample products now in database:');
          sampleProducts.forEach((product: any) => {
            log.push(`   - ${product.title} (${product.square_id}) - ${product.stock_quantity} units, ${product.stock_status}`);
          });
        }
        
      } finally {
        dbVerify.close();
      }
      
      log.push('🎉 Fresh sync complete! Your admin pages should now show only products available at your location.');
      
      return NextResponse.json({
        success: true,
        message: 'Database cleared and fresh sync completed successfully',
        clearedCount,
        syncedCount: syncResult.syncedCount,
        skippedCount: syncResult.skippedCount,
        errorCount: syncResult.errorCount,
        log
      });
      
    } catch (syncError) {
      log.push(`❌ Error during sync: ${syncError}`);
      return NextResponse.json({
        success: false,
        error: `Sync failed: ${syncError}`,
        clearedCount,
        log
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('❌ Clear and sync failed:', error);
    return NextResponse.json({
      success: false,
      error: `Clear and sync failed: ${error}`,
      log: [`❌ Error: ${error}`]
    }, { status: 500 });
  }
}

// Export POST with admin authentication
export const POST = withAdminAuth(postHandler);

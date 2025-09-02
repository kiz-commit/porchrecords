#!/usr/bin/env node

/**
 * Clear database products and perform fresh sync from Square
 * This will remove all stale products and sync only what's currently available at your location
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'porchrecords.db');

async function clearAndFreshSync() {
  console.log('🧹 Starting fresh database clear and sync...');
  
  // Step 1: Clear all Square products from database
  console.log('📊 Clearing all Square products from database...');
  const db = new Database(DB_PATH);
  
  try {
    // Get count before clearing
    const countBefore = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_from_square = 1').get();
    console.log(`   Found ${countBefore.count} Square products to clear`);
    
    // Clear all Square products
    const result = db.prepare('DELETE FROM products WHERE is_from_square = 1').run();
    console.log(`   ✅ Deleted ${result.changes} Square products from database`);
    
    // Verify clearing
    const countAfter = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_from_square = 1').get();
    console.log(`   📊 Square products remaining: ${countAfter.count}`);
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  } finally {
    db.close();
  }
  
  // Step 2: Trigger fresh sync from Square
  console.log('🔄 Triggering fresh sync from Square...');
  
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ADMIN_TOKEN || 'admin-token'}`
      },
      body: JSON.stringify({ direction: 'pull' })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Sync failed: ${response.status} ${error}`);
    }
    
    const syncResult = await response.json();
    console.log('🎉 Fresh sync completed!');
    console.log(`   📊 Synced: ${syncResult.syncedCount} products`);
    console.log(`   ⚠️  Skipped: ${syncResult.skippedCount} products`);
    console.log(`   ❌ Errors: ${syncResult.errorCount} products`);
    
    if (syncResult.log && syncResult.log.length > 0) {
      console.log('📝 Sync log:');
      syncResult.log.forEach(line => console.log(`   ${line}`));
    }
    
  } catch (error) {
    console.error('❌ Error during sync:', error);
    throw error;
  }
  
  // Step 3: Verify results
  console.log('✅ Verification...');
  const dbVerify = new Database(DB_PATH);
  
  try {
    const finalCount = dbVerify.prepare('SELECT COUNT(*) as count FROM products WHERE is_from_square = 1 AND available_at_location = 1').get();
    console.log(`   📊 Final count: ${finalCount.count} products available at your location`);
    
    // Show sample of products
    const sampleProducts = dbVerify.prepare(`
      SELECT title, square_id, available_at_location, stock_quantity, stock_status 
      FROM products 
      WHERE is_from_square = 1 AND available_at_location = 1 
      ORDER BY title ASC 
      LIMIT 5
    `).all();
    
    if (sampleProducts.length > 0) {
      console.log('   📋 Sample products now in database:');
      sampleProducts.forEach(product => {
        console.log(`   - ${product.title} (${product.square_id}) - ${product.stock_quantity} units, ${product.stock_status}`);
      });
    }
    
  } finally {
    dbVerify.close();
  }
  
  console.log('🎉 Fresh sync complete! Your admin pages should now show only products available at your location.');
}

// Run the script
if (require.main === module) {
  clearAndFreshSync()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { clearAndFreshSync };

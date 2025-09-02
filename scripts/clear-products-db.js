const Database = require('better-sqlite3');
const path = require('path');

// Database path
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'porchrecords.db');

async function clearProductsDatabase() {
  console.log('🗑️  Clearing products database...');
  
  try {
    const db = new Database(DB_PATH);
    
    // Get current product count
    const currentCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
    console.log(`📊 Current products in database: ${currentCount.count}`);
    
    // Clear all products
    const result = db.prepare('DELETE FROM products').run();
    console.log(`✅ Deleted ${result.changes} products from database`);
    
    // Reset auto-increment counter
    db.prepare('DELETE FROM sqlite_sequence WHERE name = ?').run('products');
    console.log('🔄 Reset auto-increment counter');
    
    // Verify database is empty
    const newCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
    console.log(`📊 Products remaining: ${newCount.count}`);
    
    db.close();
    
    console.log('🎉 Database cleared successfully!');
    console.log('💡 You can now run a fresh sync test');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  }
}

clearProductsDatabase();

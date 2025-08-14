const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

/**
 * Script to migrate preorder data from JSON file to SQLite database
 * Run this script to move existing preorder data to the new database system
 */

const dbPath = path.join(__dirname, '..', 'data', 'porchrecords.db');
const preordersJsonPath = path.join(__dirname, '..', 'src', 'data', 'preorders.json');

async function migratePreorders() {
  console.log('🚀 Starting preorder migration to database...');
  
  try {
    // Check if JSON file exists
    if (!fs.existsSync(preordersJsonPath)) {
      console.log('❌ No preorders.json file found. Nothing to migrate.');
      return;
    }
    
    // Read JSON data
    const jsonData = fs.readFileSync(preordersJsonPath, 'utf8');
    const preorders = JSON.parse(jsonData);
    
    console.log(`📋 Found ${Object.keys(preorders).length} preorders in JSON file`);
    
    // Open database connection
    const db = new sqlite3.Database(dbPath);
    
    // Wrap database operations in promises
    const dbRun = (sql, params = []) => {
      return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
          if (err) reject(err);
          else resolve(this);
        });
      });
    };
    
    const dbGet = (sql, params = []) => {
      return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    };
    
    // Ensure preorders table exists
    await dbRun(`
      CREATE TABLE IF NOT EXISTS preorders (
        product_id TEXT PRIMARY KEY,
        is_preorder BOOLEAN DEFAULT 0,
        preorder_release_date TEXT,
        preorder_quantity INTEGER DEFAULT 0,
        preorder_max_quantity INTEGER DEFAULT 0
      )
    `);
    
    let migrated = 0;
    let updated = 0;
    let skipped = 0;
    
    // Migrate each preorder
    for (const [productId, preorderData] of Object.entries(preorders)) {
      try {
        // Check if preorder already exists
        const existing = await dbGet(`
          SELECT product_id FROM preorders WHERE product_id = ?
        `, [productId]);
        
        if (existing) {
          // Update existing preorder
          await dbRun(`
            UPDATE preorders 
            SET 
              is_preorder = ?,
              preorder_release_date = ?,
              preorder_quantity = ?,
              preorder_max_quantity = ?
            WHERE product_id = ?
          `, [
            preorderData.isPreorder ? 1 : 0,
            preorderData.preorderReleaseDate || '',
            preorderData.preorderQuantity || 0,
            preorderData.preorderMaxQuantity || 50,
            productId
          ]);
          updated++;
          console.log(`✅ Updated preorder: ${productId}`);
        } else {
          // Insert new preorder
          await dbRun(`
            INSERT INTO preorders (
              product_id,
              is_preorder,
              preorder_release_date,
              preorder_quantity,
              preorder_max_quantity
            ) VALUES (?, ?, ?, ?, ?)
          `, [
            productId,
            preorderData.isPreorder ? 1 : 0,
            preorderData.preorderReleaseDate || '',
            preorderData.preorderQuantity || 0,
            preorderData.preorderMaxQuantity || 50
          ]);
          migrated++;
          console.log(`✅ Migrated preorder: ${productId}`);
        }
      } catch (error) {
        console.error(`❌ Failed to migrate preorder ${productId}:`, error.message);
        skipped++;
      }
    }
    
    // Close database connection
    db.close();
    
    // Migration summary
    console.log('\n📊 Migration Summary:');
    console.log(`✅ Migrated: ${migrated} new preorders`);
    console.log(`🔄 Updated: ${updated} existing preorders`);
    console.log(`❌ Skipped: ${skipped} preorders (due to errors)`);
    console.log(`📋 Total processed: ${migrated + updated + skipped} preorders`);
    
    if (migrated > 0 || updated > 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('💡 You can now use the database-based preorder system.');
      
      // Optionally backup the JSON file
      const backupPath = preordersJsonPath + '.backup.' + Date.now();
      fs.copyFileSync(preordersJsonPath, backupPath);
      console.log(`💾 JSON file backed up to: ${backupPath}`);
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if script is executed directly
if (require.main === module) {
  migratePreorders().catch(console.error);
}

module.exports = { migratePreorders };
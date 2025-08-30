#!/usr/bin/env node

/**
 * Script to restore taxonomy data from backup and add new categories
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Database path
const DB_PATH = path.join(process.cwd(), 'data', 'porchrecords.db');

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

async function restoreAndConsolidate() {
  console.log('🚀 Restoring taxonomy data and consolidating categories...\n');

  try {
    // Step 1: Check if database exists
    console.log('📊 Step 1: Checking database...');
    if (!fs.existsSync(DB_PATH)) {
      console.log('❌ Database file not found.');
      process.exit(1);
    }
    console.log('✅ Database found\n');

    // Step 2: Connect to database
    console.log('🔄 Step 2: Connecting to database...');
    const db = new Database(DB_PATH);
    
    // Step 3: Clear existing taxonomy data
    console.log('🧹 Step 3: Clearing existing taxonomy data...');
    db.exec('DELETE FROM taxonomy');
    console.log('✅ Cleared existing data\n');

    // Step 4: Restore from backup
    console.log('📋 Step 4: Restoring from backup...');
    const backupPath = path.join(process.cwd(), 'backup', 'json-files', '2025-08-25', 'taxonomy.json');
    
    if (!fs.existsSync(backupPath)) {
      console.log('❌ Backup file not found. Using local backup...');
      // Use local backup if production backup not available
      const localBackupPath = path.join(process.cwd(), 'src', 'data', 'taxonomy.json');
      if (!fs.existsSync(localBackupPath)) {
        console.log('❌ Local backup also not found.');
        process.exit(1);
      }
      const backupData = JSON.parse(fs.readFileSync(localBackupPath, 'utf8'));
    } else {
      const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    }
    
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    console.log(`📋 Found ${backupData.items.length} items in backup\n`);

    // Step 5: Insert backup data
    console.log('💾 Step 5: Inserting backup data...');
    const insertStmt = db.prepare(`
      INSERT INTO taxonomy (
        id, name, type, emoji, color, description, parent_id, 
        order_index, usage_count, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let restoredCount = 0;
    for (const item of backupData.items) {
      try {
        insertStmt.run(
          item.id,
          item.name,
          item.type,
          item.emoji || null,
          item.color || null,
          item.description || null,
          null, // parent_id
          item.order || 0,
          item.usageCount || 0,
          item.isActive ? 1 : 0,
          item.createdAt,
          item.updatedAt
        );
        restoredCount++;
        console.log(`  ✅ Restored: ${item.name} (${item.type})`);
      } catch (error) {
        console.log(`  ❌ Failed to restore: ${item.name} (${item.type}) - ${error.message}`);
      }
    }

    console.log(`\n📊 Restored ${restoredCount} items from backup`);

    // Step 6: Add new categories
    console.log('\n📋 Step 6: Adding new categories...');
    
    const categoriesToAdd = [
      // Product Types (from Categories page)
      { name: 'Records', type: 'product_type', description: 'Vinyl records, CDs, and other music formats', order: 1 },
      { name: 'Merch', type: 'product_type', description: 'T-shirts, hoodies, hats, and other merchandise', order: 2 },
      { name: 'Accessories', type: 'product_type', description: 'Vinyl accessories, home goods, and other items', order: 3 },
      
      // Merch Categories (from MERCH_CATEGORIES constant)
      { name: 'T-Shirts', type: 'merch_category', description: 'T-shirts and tops', order: 1 },
      { name: 'Hoodies', type: 'merch_category', description: 'Hoodies and sweatshirts', order: 2 },
      { name: 'Caps', type: 'merch_category', description: 'Caps and hats', order: 3 },
      { name: 'Stickers', type: 'merch_category', description: 'Stickers and decals', order: 4 },
      { name: 'Posters', type: 'merch_category', description: 'Posters and prints', order: 5 },
      { name: 'Tote Bags', type: 'merch_category', description: 'Tote bags and carriers', order: 6 },
      { name: 'Accessories', type: 'merch_category', description: 'General accessories', order: 7 },
      { name: 'Other', type: 'merch_category', description: 'Other merchandise items', order: 8 }
    ];

    let addedCount = 0;
    for (const category of categoriesToAdd) {
      try {
        const now = new Date().toISOString();
        const result = insertStmt.run(
          generateId(),
          category.name,
          category.type,
          null, // emoji
          null, // color
          category.description || null,
          null, // parent_id
          category.order || 0,
          0, // usage_count
          1, // is_active
          now,
          now
        );
        
        addedCount++;
        console.log(`  ✅ Added: ${category.name} (${category.type})`);
      } catch (error) {
        console.log(`  ❌ Failed to add: ${category.name} (${category.type}) - ${error.message}`);
      }
    }

    console.log(`\n📊 Added ${addedCount} new categories`);

    // Step 7: Verify final state
    console.log('\n🔍 Step 7: Verifying final state...');
    const totalCount = db.prepare('SELECT COUNT(*) as count FROM taxonomy').get();
    console.log(`📊 Total taxonomy items: ${totalCount.count}`);

    // Get stats by type
    const stats = db.prepare(`
      SELECT type, COUNT(*) as count 
      FROM taxonomy 
      WHERE is_active = 1 
      GROUP BY type
      ORDER BY type
    `).all();
    
    console.log('📈 Final taxonomy breakdown:');
    for (const stat of stats) {
      console.log(`  ${stat.type}: ${stat.count} items`);
    }

    db.close();

    console.log('\n🎉 Restore and consolidation completed successfully!');
    console.log('💡 All category systems are now unified in the taxonomy system.');

  } catch (error) {
    console.error('❌ Restore and consolidation failed:', error);
    process.exit(1);
  }
}

// Run the restore and consolidation
restoreAndConsolidate();

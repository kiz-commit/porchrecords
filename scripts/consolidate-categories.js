#!/usr/bin/env node

/**
 * Migration script to consolidate all category systems into the unified taxonomy system
 * This script will:
 * 1. Add product types (Records, Merch, Accessories) to taxonomy as 'product_type'
 * 2. Add merch categories (T-Shirts, Hoodies, etc.) to taxonomy as 'merch_category'
 * 3. Verify all categories are properly added
 */

const Database = require('better-sqlite3');
const path = require('path');

// Database path
const DB_PATH = path.join(process.cwd(), 'data', 'porchrecords.db');

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

async function consolidateCategories() {
  console.log('🚀 Starting category system consolidation...\n');

  try {
    // Step 1: Check if database exists
    console.log('📊 Step 1: Checking database...');
    if (!require('fs').existsSync(DB_PATH)) {
      console.log('❌ Database file not found. Please run the main migration first: npm run migrate-db');
      process.exit(1);
    }
    console.log('✅ Database found\n');

    // Step 2: Connect to database
    console.log('🔄 Step 2: Connecting to database...');
    const db = new Database(DB_PATH);
    
    // Check if taxonomy table exists
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='taxonomy'
    `).get();
    
    if (!tableExists) {
      console.log('❌ Taxonomy table does not exist. Please run the taxonomy migration first.');
      db.close();
      process.exit(1);
    }

    console.log('✅ Taxonomy table exists\n');

    // Step 3: Define categories to add
    console.log('📋 Step 3: Adding categories to taxonomy...');
    
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

    // Prepare insert statement
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO taxonomy (
        id, name, type, emoji, color, description, parent_id, 
        order_index, usage_count, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let addedCount = 0;
    let skippedCount = 0;

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
        
        if (result.changes > 0) {
          addedCount++;
          console.log(`  ✅ Added: ${category.name} (${category.type})`);
        } else {
          skippedCount++;
          console.log(`  ⏭️  Skipped: ${category.name} (${category.type}) - already exists`);
        }
      } catch (error) {
        console.log(`  ❌ Failed to add: ${category.name} (${category.type}) - ${error.message}`);
      }
    }

    console.log(`\n📊 Consolidation Summary:`);
    console.log(`  ✅ Successfully added: ${addedCount} categories`);
    console.log(`  ⏭️  Skipped (already exist): ${skippedCount} categories`);

    // Step 4: Verify consolidation
    console.log('\n🔍 Step 4: Verifying consolidation...');
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
    
    console.log('📈 Taxonomy breakdown:');
    for (const stat of stats) {
      console.log(`  ${stat.type}: ${stat.count} items`);
    }

    // Show all items by type
    console.log('\n📋 Detailed breakdown:');
    for (const stat of stats) {
      const items = db.prepare(`
        SELECT name, description 
        FROM taxonomy 
        WHERE type = ? AND is_active = 1
        ORDER BY order_index ASC, name ASC
      `).all(stat.type);
      
      console.log(`\n  ${stat.type.toUpperCase()}:`);
      items.forEach(item => {
        console.log(`    - ${item.name}${item.description ? ` (${item.description})` : ''}`);
      });
    }

    db.close();

    console.log('\n🎉 Category consolidation completed successfully!');
    console.log('💡 You can now remove the separate Categories and Merch Categories admin pages.');

  } catch (error) {
    console.error('❌ Consolidation failed:', error);
    process.exit(1);
  }
}

// Run the consolidation
consolidateCategories();

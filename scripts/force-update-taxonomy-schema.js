#!/usr/bin/env node

/**
 * Script to force update taxonomy schema even if table exists
 */

const Database = require('better-sqlite3');
const path = require('path');

// Database path
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'porchrecords.db');

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

async function forceUpdateTaxonomySchema() {
  console.log('🚀 Force updating taxonomy schema...\n');

  try {
    // Step 1: Check if database exists
    console.log('📊 Step 1: Checking database...');
    if (!require('fs').existsSync(DB_PATH)) {
      console.log('❌ Database file not found.');
      process.exit(1);
    }
    console.log('✅ Database found\n');

    // Step 2: Connect to database
    console.log('🔄 Step 2: Connecting to database...');
    const db = new Database(DB_PATH);
    
    // Step 3: Check current schema
    console.log('📋 Step 3: Checking current schema...');
    try {
      const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'taxonomy'").get();
      console.log('Current taxonomy table schema:');
      console.log(schema.sql);
    } catch (error) {
      console.log('No existing taxonomy table found');
    }
    
    // Step 4: Backup existing data
    console.log('\n📋 Step 4: Backing up existing data...');
    let existingData = [];
    try {
      existingData = db.prepare('SELECT * FROM taxonomy').all();
      console.log(`  📊 Found ${existingData.length} existing taxonomy items`);
    } catch (error) {
      console.log('  📊 No existing data to backup');
    }
    
    // Step 5: Drop and recreate table
    console.log('\n📋 Step 5: Recreating taxonomy table...');
    
    // Drop the old table
    db.exec('DROP TABLE IF EXISTS taxonomy');
    console.log('  ✅ Dropped old taxonomy table');
    
    // Create new table with correct schema
    db.exec(`
      CREATE TABLE taxonomy (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('genre', 'mood', 'tag', 'product_type', 'merch_category')),
        emoji TEXT,
        color TEXT,
        description TEXT,
        parent_id TEXT,
        order_index INTEGER DEFAULT 0,
        usage_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(name, type)
      )
    `);
    console.log('  ✅ Created new taxonomy table with correct schema');
    
    // Create indexes
    db.exec('CREATE INDEX IF NOT EXISTS idx_taxonomy_type ON taxonomy(type)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_taxonomy_active ON taxonomy(is_active)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_taxonomy_order ON taxonomy(order_index)');
    console.log('  ✅ Created indexes');

    // Step 6: Restore valid data and add new categories
    console.log('\n📋 Step 6: Restoring data and adding new categories...');
    
    const categoriesToAdd = [
      // Product Types
      { name: 'Records', type: 'product_type', description: 'Vinyl records, CDs, and other music formats', order: 1 },
      { name: 'Merch', type: 'product_type', description: 'T-shirts, hoodies, hats, and other merchandise', order: 2 },
      { name: 'Accessories', type: 'product_type', description: 'Vinyl accessories, home goods, and other items', order: 3 },
      
      // Merch Categories
      { name: 'T-Shirts', type: 'merch_category', description: 'T-shirts and tops', order: 1 },
      { name: 'Hoodies', type: 'merch_category', description: 'Hoodies and sweatshirts', order: 2 },
      { name: 'Caps', type: 'merch_category', description: 'Caps and hats', order: 3 },
      { name: 'Stickers', type: 'merch_category', description: 'Stickers and decals', order: 4 },
      { name: 'Posters', type: 'merch_category', description: 'Posters and prints', order: 5 },
      { name: 'Tote Bags', type: 'merch_category', description: 'Tote bags and carriers', order: 6 },
      { name: 'Accessories', type: 'merch_category', description: 'General accessories', order: 7 },
      { name: 'Other', type: 'merch_category', description: 'Other merchandise items', order: 8 }
    ];

    const insertStmt = db.prepare(`
      INSERT INTO taxonomy (
        id, name, type, emoji, color, description, parent_id, 
        order_index, usage_count, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let addedCount = 0;
    
    // Add new categories
    for (const category of categoriesToAdd) {
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
    }

    // Restore valid existing data (only genre, mood, tag)
    let restoredCount = 0;
    for (const item of existingData) {
      if (['genre', 'mood', 'tag'].includes(item.type)) {
        const now = new Date().toISOString();
        insertStmt.run(
          item.id || generateId(),
          item.name,
          item.type,
          item.emoji || null,
          item.color || null,
          item.description || null,
          item.parent_id || null,
          item.order_index || 0,
          item.usage_count || 0,
          item.is_active !== undefined ? item.is_active : 1,
          item.created_at || now,
          item.updated_at || now
        );
        restoredCount++;
        console.log(`  🔄 Restored: ${item.name} (${item.type})`);
      } else {
        console.log(`  ⏭️  Skipped legacy: ${item.name} (${item.type})`);
      }
    }

    console.log(`\n📊 Added ${addedCount} new categories, restored ${restoredCount} existing items`);

    // Step 7: Verify
    console.log('\n🔍 Step 7: Verifying...');
    const stats = db.prepare(`
      SELECT type, COUNT(*) as count 
      FROM taxonomy 
      WHERE is_active = 1 
      GROUP BY type
      ORDER BY type
    `).all();
    
    console.log('📈 Final breakdown:');
    for (const stat of stats) {
      console.log(`  ${stat.type}: ${stat.count} items`);
    }

    // Step 8: Test schema
    console.log('\n🧪 Step 8: Testing schema...');
    try {
      const testStmt = db.prepare(`
        INSERT INTO taxonomy (id, name, type, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?)
      `);
      const now = new Date().toISOString();
      testStmt.run(generateId(), 'Test Product', 'product_type', now, now);
      console.log('  ✅ Schema test passed - can add product_type');
      
      // Clean up test
      db.prepare('DELETE FROM taxonomy WHERE name = ?').run('Test Product');
    } catch (error) {
      console.log(`  ❌ Schema test failed: ${error.message}`);
    }

    db.close();

    console.log('\n🎉 Taxonomy schema force update completed successfully!');
    console.log('💡 You can now add product types and merch categories through the admin interface.');

  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
}

// Run the script
forceUpdateTaxonomySchema();

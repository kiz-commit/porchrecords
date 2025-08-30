#!/usr/bin/env node

/**
 * Simple script to manually add categories to the production database
 */

const Database = require('better-sqlite3');
const path = require('path');

// Database path
const DB_PATH = path.join(process.cwd(), 'data', 'porchrecords.db');

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

async function addCategories() {
  console.log('🚀 Adding categories to production database...\n');

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
    
    // Step 3: Add categories
    console.log('📋 Step 3: Adding categories...');
    
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
      INSERT OR IGNORE INTO taxonomy (
        id, name, type, emoji, color, description, parent_id, 
        order_index, usage_count, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

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
        
        if (result.changes > 0) {
          addedCount++;
          console.log(`  ✅ Added: ${category.name} (${category.type})`);
        } else {
          console.log(`  ⏭️  Skipped: ${category.name} (${category.type}) - already exists`);
        }
      } catch (error) {
        console.log(`  ❌ Failed to add: ${category.name} (${category.type}) - ${error.message}`);
      }
    }

    console.log(`\n📊 Added ${addedCount} categories`);

    // Step 4: Verify
    console.log('\n🔍 Step 4: Verifying...');
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

    db.close();

    console.log('\n🎉 Categories added successfully!');

  } catch (error) {
    console.error('❌ Failed:', error);
    process.exit(1);
  }
}

// Run the script
addCategories();

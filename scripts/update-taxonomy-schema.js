#!/usr/bin/env node

/**
 * Script to update the taxonomy table schema to allow new category types
 */

const Database = require('better-sqlite3');
const path = require('path');

// Database path
const DB_PATH = path.join(process.cwd(), 'data', 'porchrecords.db');

async function updateTaxonomySchema() {
  console.log('🚀 Updating taxonomy table schema...\n');

  try {
    // Step 1: Check if database exists
    console.log('📊 Step 1: Checking database...');
    if (!require('fs').existsSync(DB_PATH)) {
      console.log('❌ Database file not found.');
      process.exit(1);
    }
    console.log('✅ Database found\n');

    // Step 2: Connect to database
    console.log('🔄 Step 2: Updating taxonomy table...');
    const db = new Database(DB_PATH);
    
    // SQLite doesn't support ALTER TABLE to modify CHECK constraints
    // So we need to recreate the table with the new constraint
    
    // First, backup existing data
    const existingData = db.prepare('SELECT * FROM taxonomy').all();
    console.log(`📋 Backing up ${existingData.length} existing taxonomy items`);
    
    // Drop the old table
    db.exec('DROP TABLE IF EXISTS taxonomy');
    
    // Create new table with updated constraint
    db.exec(`
      CREATE TABLE taxonomy (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('genre', 'mood', 'category', 'tag', 'product_type', 'merch_category')),
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
    
    // Create indexes
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_taxonomy_type ON taxonomy(type);
      CREATE INDEX IF NOT EXISTS idx_taxonomy_active ON taxonomy(is_active);
      CREATE INDEX IF NOT EXISTS idx_taxonomy_order ON taxonomy(order_index);
      CREATE INDEX IF NOT EXISTS idx_taxonomy_parent ON taxonomy(parent_id);
    `);
    
    // Restore existing data
    const insertStmt = db.prepare(`
      INSERT INTO taxonomy (
        id, name, type, emoji, color, description, parent_id, 
        order_index, usage_count, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    let restoredCount = 0;
    for (const item of existingData) {
      insertStmt.run(
        item.id,
        item.name,
        item.type,
        item.emoji,
        item.color,
        item.description,
        item.parent_id,
        item.order_index,
        item.usage_count,
        item.is_active,
        item.created_at,
        item.updated_at
      );
      restoredCount++;
    }
    
    console.log(`✅ Restored ${restoredCount} taxonomy items`);
    
    // Verify the update
    const totalCount = db.prepare('SELECT COUNT(*) as count FROM taxonomy').get();
    console.log(`📊 Total taxonomy items: ${totalCount.count}`);
    
    // Test inserting new category types
    const testStmt = db.prepare(`
      INSERT INTO taxonomy (
        id, name, type, description, order_index, usage_count, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const now = new Date().toISOString();
    const testId = Math.random().toString(36).substr(2, 9);
    
    try {
      testStmt.run(
        testId,
        'Test Product Type',
        'product_type',
        'Test description',
        1,
        0,
        1,
        now,
        now
      );
      console.log('✅ Successfully added test product_type item');
      
      // Clean up test item
      db.prepare('DELETE FROM taxonomy WHERE id = ?').run(testId);
      console.log('✅ Cleaned up test item');
      
    } catch (error) {
      console.log('❌ Failed to add test item:', error.message);
    }
    
    db.close();
    
    console.log('\n🎉 Taxonomy schema update completed successfully!');
    console.log('💡 The taxonomy table now supports product_type and merch_category types.');

  } catch (error) {
    console.error('❌ Schema update failed:', error);
    process.exit(1);
  }
}

// Run the update
updateTaxonomySchema();

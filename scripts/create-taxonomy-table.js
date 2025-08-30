#!/usr/bin/env node

/**
 * Script to create the taxonomy table in the production database
 */

const Database = require('better-sqlite3');
const path = require('path');

// Production database path
const DB_PATH = '/data/porchrecords.db';

async function createTaxonomyTable() {
  console.log('🚀 Creating taxonomy table in production database...\n');

  try {
    // Step 1: Check if database exists
    console.log('📊 Step 1: Checking database...');
    if (!require('fs').existsSync(DB_PATH)) {
      console.log('❌ Database file not found at', DB_PATH);
      process.exit(1);
    }
    console.log('✅ Database found\n');

    // Step 2: Connect to database and create table
    console.log('🔄 Step 2: Creating taxonomy table...');
    const db = new Database(DB_PATH);
    
    // Create taxonomy table
    db.exec(`
      CREATE TABLE IF NOT EXISTS taxonomy (
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

    // Create indexes
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_taxonomy_type ON taxonomy(type);
      CREATE INDEX IF NOT EXISTS idx_taxonomy_active ON taxonomy(is_active);
      CREATE INDEX IF NOT EXISTS idx_taxonomy_order ON taxonomy(order_index);
      CREATE INDEX IF NOT EXISTS idx_taxonomy_parent ON taxonomy(parent_id);
    `);

    console.log('✅ Taxonomy table created successfully\n');

    // Step 3: Verify table creation
    console.log('🔍 Step 3: Verifying table creation...');
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='taxonomy'
    `).get();
    
    if (tableExists) {
      console.log('✅ Taxonomy table exists');
    } else {
      console.log('❌ Taxonomy table was not created');
      db.close();
      process.exit(1);
    }

    // Check table structure
    const columns = db.prepare("PRAGMA table_info(taxonomy)").all();
    console.log('📋 Table columns:');
    columns.forEach(col => {
      console.log(`  - ${col.name} (${col.type})`);
    });

    // Check if there's any data
    const count = db.prepare('SELECT COUNT(*) as count FROM taxonomy').get();
    console.log(`📊 Current taxonomy items: ${count.count}`);

    db.close();

    console.log('\n🎉 Taxonomy table creation completed successfully!');

  } catch (error) {
    console.error('❌ Failed to create taxonomy table:', error);
    process.exit(1);
  }
}

// Run the script
createTaxonomyTable();

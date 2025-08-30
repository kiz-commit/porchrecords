#!/usr/bin/env node

/**
 * Migration script to move taxonomy data from JSON files to SQLite database
 * This script will:
 * 1. Read existing taxonomy data from src/data/taxonomy.json
 * 2. Insert the data into the taxonomy table in the database
 * 3. Create a backup of the original JSON file
 * 4. Verify the migration was successful
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// Database path
const DB_PATH = path.join(process.cwd(), 'data', 'porchrecords.db');

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

async function migrateTaxonomyToDatabase() {
  console.log('🚀 Starting taxonomy migration from JSON to SQLite database...\n');

  try {
    // Step 1: Check if database exists
    console.log('📊 Step 1: Checking database...');
    if (!fs.existsSync(DB_PATH)) {
      console.log('❌ Database file not found. Please run the main migration first: npm run migrate-db');
      process.exit(1);
    }
    console.log('✅ Database found\n');

    // Step 2: Create backup of taxonomy JSON file
    console.log('💾 Step 2: Creating backup of taxonomy JSON file...');
    const taxonomyFile = path.join(process.cwd(), 'src', 'data', 'taxonomy.json');
    const backupDir = path.join(process.cwd(), 'backup', 'json-files', new Date().toISOString().split('T')[0]);
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    if (fs.existsSync(taxonomyFile)) {
      const backupPath = path.join(backupDir, 'taxonomy.json');
      fs.copyFileSync(taxonomyFile, backupPath);
      console.log('✅ Taxonomy JSON file backed up successfully\n');
    } else {
      console.log('⚠️  Taxonomy JSON file not found, proceeding with empty migration\n');
    }

    // Step 3: Read existing taxonomy data
    console.log('📖 Step 3: Reading existing taxonomy data...');
    let existingData = { items: [] };
    
    if (fs.existsSync(taxonomyFile)) {
      const taxonomyData = fs.readFileSync(taxonomyFile, 'utf8');
      existingData = JSON.parse(taxonomyData);
      console.log(`📋 Found ${existingData.items.length} taxonomy items\n`);
    }

    // Step 4: Connect to database and migrate data
    console.log('🔄 Step 4: Migrating taxonomy data to database...');
    const db = new Database(DB_PATH);
    
    // Ensure taxonomy table exists
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
    
    // Check if taxonomy table has data
    const existingCount = db.prepare('SELECT COUNT(*) as count FROM taxonomy').get();
    if (existingCount.count > 0) {
      console.log(`⚠️  Taxonomy table already contains ${existingCount.count} items`);
      console.log('🔄 Clearing existing taxonomy data...');
      db.prepare('DELETE FROM taxonomy').run();
    }

    // Prepare insert statement
    const insertStmt = db.prepare(`
      INSERT INTO taxonomy (
        id, name, type, emoji, color, description, parent_id, 
        order_index, usage_count, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let migratedCount = 0;
    let errorCount = 0;

    for (const item of existingData.items) {
      try {
        const now = new Date().toISOString();
        insertStmt.run(
          item.id || generateId(),
          item.name,
          item.type,
          item.emoji || null,
          item.color || null,
          item.description || null,
          item.parentId || null,
          item.order || 0,
          item.usageCount || 0,
          item.isActive !== false ? 1 : 0,
          item.createdAt || now,
          item.updatedAt || now
        );
        migratedCount++;
        console.log(`  ✅ Migrated: ${item.name} (${item.type})`);
      } catch (error) {
        errorCount++;
        console.log(`  ❌ Failed to migrate: ${item.name} (${item.type}) - ${error.message}`);
      }
    }

    console.log(`\n📊 Migration Summary:`);
    console.log(`  ✅ Successfully migrated: ${migratedCount} items`);
    console.log(`  ❌ Failed to migrate: ${errorCount} items`);
    console.log(`  📁 Backup created at: ${backupDir}/taxonomy.json`);

    // Step 5: Verify migration
    console.log('\n🔍 Step 5: Verifying migration...');
    const finalCount = db.prepare('SELECT COUNT(*) as count FROM taxonomy').get();
    console.log(`📊 Database now contains ${finalCount.count} taxonomy items`);

    // Get stats by type
    const stats = db.prepare(`
      SELECT type, COUNT(*) as count 
      FROM taxonomy 
      WHERE is_active = 1 
      GROUP BY type
    `).all();
    
    console.log('📈 Taxonomy breakdown:');
    for (const stat of stats) {
      console.log(`  ${stat.type}: ${stat.count} items`);
    }

    db.close();

    console.log('\n🎉 Taxonomy migration completed successfully!');
    console.log('💡 You can now safely delete the src/data/taxonomy.json file if desired.');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateTaxonomyToDatabase();

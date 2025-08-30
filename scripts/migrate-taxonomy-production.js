#!/usr/bin/env node

/**
 * Production migration script to move taxonomy data from JSON files to SQLite database
 * This script is designed to run on the Fly.io production instance
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

// Production database path
const DB_PATH = '/data/porchrecords.db';

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

async function migrateTaxonomyToDatabase() {
  console.log('🚀 Starting production taxonomy migration...\n');

  try {
    // Step 1: Check if database exists
    console.log('📊 Step 1: Checking database...');
    if (!fs.existsSync(DB_PATH)) {
      console.log('❌ Database file not found at', DB_PATH);
      process.exit(1);
    }
    console.log('✅ Database found\n');

    // Step 2: Connect to database and check current state
    console.log('🔄 Step 2: Connecting to database...');
    const db = new Database(DB_PATH);
    
    // Check if taxonomy table exists
    const tableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='taxonomy'
    `).get();
    
    if (!tableExists) {
      console.log('❌ Taxonomy table does not exist. Please deploy the updated application first.');
      db.close();
      process.exit(1);
    }

    // Check current taxonomy count
    const currentCount = db.prepare('SELECT COUNT(*) as count FROM taxonomy').get();
    console.log(`📊 Current taxonomy items in database: ${currentCount.count}`);

    if (currentCount.count > 0) {
      console.log('✅ Taxonomy data already exists in database. Migration not needed.');
      db.close();
      return;
    }

    // Step 3: Check if JSON file exists (for backup purposes)
    console.log('📖 Step 3: Checking for JSON backup...');
    const taxonomyFile = path.join(process.cwd(), 'src', 'data', 'taxonomy.json');
    let existingData = { items: [] };
    
    if (fs.existsSync(taxonomyFile)) {
      const taxonomyData = fs.readFileSync(taxonomyFile, 'utf8');
      existingData = JSON.parse(taxonomyData);
      console.log(`📋 Found ${existingData.items.length} taxonomy items in JSON file`);
    } else {
      console.log('⚠️  No JSON file found, creating default taxonomy items');
      
      // Create default taxonomy items if no JSON file exists
      existingData = {
        items: [
          {
            name: "Island time",
            type: "mood",
            emoji: "🏝️",
            color: "#4ECDC4",
            description: "Relaxed, tropical vibes",
            isActive: true,
            order: 1
          },
          {
            name: "4 to the floor",
            type: "mood",
            emoji: "🕺",
            color: "#FF6B6B",
            description: "Steady, danceable rhythm",
            isActive: true,
            order: 2
          },
          {
            name: "Poolside",
            type: "mood",
            emoji: "🏊",
            color: "#45B7D1",
            description: "Chill, summer vibes",
            isActive: true,
            order: 3
          },
          {
            name: "Slow focus",
            type: "mood",
            emoji: "🧘",
            color: "#96CEB4",
            description: "Meditative, concentrated",
            isActive: true,
            order: 4
          },
          {
            name: "Memory lane",
            type: "mood",
            emoji: "💭",
            color: "#DDA0DD",
            description: "Nostalgic, reflective",
            isActive: true,
            order: 5
          },
          {
            name: "Expansions",
            type: "mood",
            emoji: "🌌",
            color: "#FFD93D",
            description: "Growing, evolving soundscapes",
            isActive: true,
            order: 6
          }
        ]
      };
    }

    // Step 4: Migrate data to database
    console.log('🔄 Step 4: Migrating taxonomy data to database...');
    
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

    console.log('\n🎉 Production taxonomy migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
migrateTaxonomyToDatabase();

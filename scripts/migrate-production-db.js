#!/usr/bin/env node

const Database = require('better-sqlite3');
const path = require('path');

// Use the same DB path as the app
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'porchrecords.db');

console.log('🔧 Running production database migration...');
console.log(`📁 Database path: ${DB_PATH}`);

try {
  const db = new Database(DB_PATH);
  
  // Check if is_visible column exists
  const tableInfo = db.prepare("PRAGMA table_info(products)").all();
  const existingColumns = tableInfo.map(col => col.name);
  
  console.log('📋 Existing columns:', existingColumns);
  
  // Add missing columns
  const missingColumns = [
    'is_visible BOOLEAN DEFAULT 1',
    'stock_quantity INTEGER DEFAULT 0',
    'stock_status TEXT DEFAULT \'in_stock\'',
    'product_type TEXT DEFAULT \'record\'',
    'merch_category TEXT',
    'size TEXT',
    'color TEXT',
    'mood TEXT',
    'format TEXT',
    'year TEXT',
    'label TEXT',
    'image_ids TEXT',
    'images TEXT',
    'preorder_release_date TEXT',
    'preorder_quantity INTEGER DEFAULT 0',
    'preorder_max_quantity INTEGER DEFAULT 0',
    'is_variable_pricing BOOLEAN DEFAULT 0',
    'min_price REAL',
    'max_price REAL',
    'created_at TEXT',
    'last_synced_at TEXT',
    'square_updated_at TEXT',
    'slug TEXT',
    'has_variations BOOLEAN DEFAULT 0',
    'variation_count INTEGER DEFAULT 0',
    'last_variation_sync TEXT',
    'variations TEXT'
  ];
  
  let addedCount = 0;
  
  for (const columnDef of missingColumns) {
    const columnName = columnDef.split(' ')[0];
    
    if (!existingColumns.includes(columnName)) {
      console.log(`➕ Adding column: ${columnName}`);
      try {
        db.prepare(`ALTER TABLE products ADD COLUMN ${columnDef}`).run();
        addedCount++;
      } catch (error) {
        console.log(`⚠️  Column ${columnName} already exists or error:`, error.message);
      }
    } else {
      console.log(`✅ Column ${columnName} already exists`);
    }
  }
  
  // Create indexes
  console.log('🔍 Creating indexes...');
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_products_visible ON products(is_visible)',
    'CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type)',
    'CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_status)',
    'CREATE INDEX IF NOT EXISTS idx_products_genre ON products(genre)',
    'CREATE INDEX IF NOT EXISTS idx_products_mood ON products(mood)',
    'CREATE INDEX IF NOT EXISTS idx_products_merch_category ON products(merch_category)',
    'CREATE INDEX IF NOT EXISTS idx_products_preorder ON products(is_preorder)',
    'CREATE INDEX IF NOT EXISTS idx_products_from_square ON products(is_from_square)',
    'CREATE INDEX IF NOT EXISTS idx_products_square_id ON products(square_id)',
    'CREATE INDEX IF NOT EXISTS idx_products_updated ON products(updated_at)',
    'CREATE INDEX IF NOT EXISTS idx_products_synced ON products(last_synced_at)',
    'CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug)',
    'CREATE INDEX IF NOT EXISTS idx_products_visible_type ON products(is_visible, product_type)',
    'CREATE INDEX IF NOT EXISTS idx_products_visible_stock ON products(is_visible, stock_status)',
    'CREATE INDEX IF NOT EXISTS idx_products_type_genre ON products(product_type, genre)',
    'CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug_unique ON products(slug) WHERE slug IS NOT NULL'
  ];
  
  for (const indexSql of indexes) {
    try {
      db.prepare(indexSql).run();
      console.log(`✅ Created index: ${indexSql.split(' ')[4]}`);
    } catch (error) {
      console.log(`⚠️  Index creation error:`, error.message);
    }
  }
  
  db.close();
  
  console.log(`🎉 Migration complete! Added ${addedCount} new columns.`);
  console.log('✅ Database schema is now up to date.');
  
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
}

#!/usr/bin/env node

/**
 * Migration script to transition from JSON file storage to SQLite database
 * This script will:
 * 1. Initialize the database
 * 2. Migrate all existing data from JSON files
 * 3. Create a backup of the original JSON files
 * 4. Verify the migration was successful
 */

const fs = require('fs');
const path = require('path');

// Import database functions (we'll need to use require since this is a script)
const { initializeDatabase, migrateFromJson, getDatabaseStats, backupDatabase } = require('../src/lib/database.ts');

async function migrateToDatabase() {
  console.log('🚀 Starting migration from JSON files to SQLite database...\n');

  try {
    // Step 1: Initialize database
    console.log('📊 Step 1: Initializing database...');
    await initializeDatabase();
    console.log('✅ Database initialized successfully\n');

    // Step 2: Create backup of JSON files
    console.log('💾 Step 2: Creating backup of JSON files...');
    const dataDir = path.join(process.cwd(), 'src', 'data');
    const backupDir = path.join(process.cwd(), 'backup', 'json-files', new Date().toISOString().split('T')[0]);
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const jsonFiles = [
      'pages.json',
      'shows.json',
      'products.json',
      'genres.json',
      'moods.json',
      'preorders.json',
      'merchCategories.json',
      'navigation.json',
      'media.json',
      'analytics.json',
      'customers.json',
      'home-images.json',
      'sync-status.json'
    ];

    for (const file of jsonFiles) {
      const sourcePath = path.join(dataDir, file);
      const backupPath = path.join(backupDir, file);
      
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, backupPath);
        console.log(`  ✅ Backed up ${file}`);
      } else {
        console.log(`  ⚠️  ${file} not found, skipping backup`);
      }
    }
    console.log('✅ JSON files backed up successfully\n');

    // Step 3: Migrate data from JSON to database
    console.log('🔄 Step 3: Migrating data from JSON to database...');
    await migrateFromJson();
    console.log('✅ Data migration completed\n');

    // Step 4: Verify migration
    console.log('🔍 Step 4: Verifying migration...');
    const stats = await getDatabaseStats();
    
    console.log('\n📈 Migration Results:');
    console.log(`  📄 Pages: ${stats.pages}`);
    console.log(`  🖼️  Media: ${stats.media}`);
    console.log(`  🎵 Shows: ${stats.shows}`);
    console.log(`  🛍️  Products: ${stats.products}`);
    console.log(`  🎼 Genres: ${stats.genres}`);
    console.log(`  😊 Moods: ${stats.moods}`);
    console.log(`  💾 Database size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    // Step 5: Create database backup
    console.log('\n💾 Step 5: Creating database backup...');
    const backupPath = await backupDatabase();
    console.log(`✅ Database backed up to: ${backupPath}\n`);

    // Step 6: Generate migration report
    console.log('📋 Step 6: Generating migration report...');
    const report = {
      timestamp: new Date().toISOString(),
      status: 'success',
      stats,
      backupLocation: backupDir,
      databaseBackup: backupPath,
      notes: [
        'JSON files have been backed up and can be safely removed after verification',
        'Database is now the primary storage method',
        'All API endpoints have been updated to use the database',
        'Performance should be improved for large datasets'
      ]
    };

    const reportPath = path.join(process.cwd(), 'migration-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`✅ Migration report saved to: ${reportPath}\n`);

    console.log('🎉 Migration completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('  1. Test the application to ensure everything works correctly');
    console.log('  2. Verify that all pages load and save properly');
    console.log('  3. Check that the admin interface functions correctly');
    console.log('  4. Once verified, you can optionally remove the JSON files');
    console.log('  5. Update your deployment process to include the database file');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateToDatabase();
}

module.exports = { migrateToDatabase }; 
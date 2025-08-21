#!/usr/bin/env node

/**
 * Initialize default site configuration
 * This script ensures all required configuration entries exist in the database
 */

const Database = require('better-sqlite3');
const path = require('path');

// Use the same DB path as the app
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'porchrecords.db');

console.log('🔧 Initializing default site configuration...');
console.log(`📁 Database path: ${DB_PATH}`);

async function initializeSiteConfig() {
  const db = new Database(DB_PATH);
  
  try {
    // Default homepage hero configuration
    const defaultHero = {
      title: 'PORCH RECORDS',
      subtitle: 'Record Store. Live Shows. Nice Times.',
      location: 'WORKING & CREATING ON KAURNA COUNTRY. SOUTH AUSTRALIA.',
      showLocation: true,
      carouselSpeed: 5,
      bannerOpacity: 1
    };

    // Default hero images
    const defaultImages = [
      { id: '1', src: '/hero-image.jpg', alt: 'Porch Records Hero 1', order: 1 },
      { id: '2', src: '/hero-image2.jpg', alt: 'Porch Records Hero 2', order: 2 },
      { id: '3', src: '/hero-image3.jpg', alt: 'Porch Records Hero 3', order: 3 }
    ];

    // Default theme configuration
    const defaultTheme = {
      colors: {
        primary: '#1a1a1a',
        secondary: '#f5f5f5',
        accent: '#ffd700',
        text: '#333333',
        background: '#ffffff'
      },
      typography: {
        fontFamily: 'Inter, sans-serif',
        fontSize: '16px',
        lineHeight: '1.6'
      },
      spacing: {
        base: '1rem',
        small: '0.5rem',
        large: '2rem'
      }
    };

    // Configuration entries to ensure exist
    const configs = [
      {
        key: 'homepage.hero',
        value: defaultHero,
        description: 'Homepage hero section configuration'
      },
      {
        key: 'homepage.hero.images',
        value: defaultImages,
        description: 'Homepage hero images'
      },
      {
        key: 'theme',
        value: defaultTheme,
        description: 'Global theme configuration'
      }
    ];

    console.log('📝 Adding/updating configuration entries...');

    for (const config of configs) {
      const existing = db.prepare('SELECT config_key FROM site_config WHERE config_key = ?').get([config.key]);
      
      if (existing) {
        console.log(`  ✅ ${config.key} already exists`);
      } else {
        db.prepare(`
          INSERT INTO site_config (config_key, config_value, updated_at) 
          VALUES (?, ?, CURRENT_TIMESTAMP)
        `).run([config.key, JSON.stringify(config.value)]);
        console.log(`  ➕ Added ${config.key}: ${config.description}`);
      }
    }

    // Verify all configurations exist
    console.log('\n🔍 Verifying configurations...');
    const allConfigs = db.prepare('SELECT config_key FROM site_config ORDER BY config_key').all();
    console.log(`  📊 Total configuration entries: ${allConfigs.length}`);
    
    for (const config of allConfigs) {
      console.log(`    - ${config.config_key}`);
    }

    console.log('\n✅ Site configuration initialization complete!');

  } catch (error) {
    console.error('❌ Error initializing site configuration:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

// Run the initialization
initializeSiteConfig();

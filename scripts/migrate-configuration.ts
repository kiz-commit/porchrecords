#!/usr/bin/env tsx

import { getDatabase, initializeDatabase } from '../src/lib/database';
import path from 'path';

// Default theme configuration
const defaultThemeConfig = {
  colors: {
    primary: '#E1B84B',
    secondary: '#B86B3A',
    background: '#F8F6F2',
    foreground: '#181818',
    mustard: '#E1B84B',
    clay: '#B86B3A',
    offwhite: '#F8F6F2',
    black: '#181818'
  },
  typography: {
    primaryFont: "'EB Garamond', serif",
    secondaryFont: "'Space Mono', monospace",
    sansFont: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    baseSize: 16,
    scale: 1.25
  },
  spacing: {
    unit: 8,
    scale: 1.5
  },
  effects: {
    transitionSpeed: 0.3,
    borderRadius: 4
  }
};

// Default homepage configuration
const defaultHomepageConfig = {
  hero: {
    title: 'PORCH RECORDS',
    subtitle: 'Record Store. Live Shows. Nice Times.',
    location: 'Working & Creating on Kaurna Country. South Australia',
    showLocation: true,
    carouselSpeed: 5000
  }
};

// Default theme presets
const defaultThemePresets = [
  {
    name: 'Classic Porch',
    description: 'The original Porch Records theme with warm colors and retro vibes',
    config_data: JSON.stringify(defaultThemeConfig),
    is_default: true
  },
  {
    name: 'Modern Minimal',
    description: 'Clean, minimal design with plenty of white space',
    config_data: JSON.stringify({
      ...defaultThemeConfig,
      colors: {
        primary: '#2D3748',
        secondary: '#4A5568',
        background: '#FFFFFF',
        foreground: '#1A202C',
        mustard: '#2D3748',
        clay: '#4A5568',
        offwhite: '#F7FAFC',
        black: '#1A202C'
      }
    }),
    is_default: false
  },
  {
    name: 'Retro Vinyl',
    description: 'Dark theme inspired by classic vinyl records',
    config_data: JSON.stringify({
      ...defaultThemeConfig,
      colors: {
        primary: '#FFD700',
        secondary: '#FF6B35',
        background: '#1A1A1A',
        foreground: '#FFFFFF',
        mustard: '#FFD700',
        clay: '#FF6B35',
        offwhite: '#2A2A2A',
        black: '#000000'
      }
    }),
    is_default: false
  },
  {
    name: 'High Contrast',
    description: 'High contrast theme for better accessibility',
    config_data: JSON.stringify({
      ...defaultThemeConfig,
      colors: {
        primary: '#000000',
        secondary: '#FFFFFF',
        background: '#FFFFFF',
        foreground: '#000000',
        mustard: '#000000',
        clay: '#FFFFFF',
        offwhite: '#F0F0F0',
        black: '#000000'
      }
    }),
    is_default: false
  }
];

// Default homepage sections
const defaultHomepageSections = [
  {
    section_type: 'store-highlights',
    section_data: JSON.stringify({
      title: 'Selling Fast',
      subtitle: 'Limited stock available on these popular releases',
      type: 'selling-fast',
      maxProducts: 4
    }),
    order_index: 1,
    is_active: true
  },
  {
    section_type: 'upcoming-shows',
    section_data: JSON.stringify({
      title: 'Upcoming Shows',
      subtitle: 'Live music and events at Porch Records',
      maxShows: 3,
      showTicketLinks: true
    }),
    order_index: 2,
    is_active: true
  },
  {
    section_type: 'mailchimp-subscribe',
    section_data: JSON.stringify({
      title: 'Stay in the Loop',
      subtitle: 'Get updates on new releases, shows, and exclusive offers',
      placeholder: 'Enter your email address',
      buttonText: 'Subscribe',
      successMessage: 'Thanks for subscribing!',
      errorMessage: 'Something went wrong. Please try again.'
    }),
    order_index: 3,
    is_active: true
  }
];

async function migrateConfiguration() {
  try {
    console.log('Starting configuration migration...');
    
    // Initialize database and create tables
    await initializeDatabase();
    const database = await getDatabase();
    
    // Insert default theme configuration
    console.log('Inserting default theme configuration...');
    for (const [key, value] of Object.entries(defaultThemeConfig)) {
      await database.run(`
        INSERT OR REPLACE INTO site_config (config_key, config_value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `, [`theme.${key}`, JSON.stringify(value)]);
    }
    
    // Insert default homepage configuration
    console.log('Inserting default homepage configuration...');
    for (const [key, value] of Object.entries(defaultHomepageConfig)) {
      await database.run(`
        INSERT OR REPLACE INTO site_config (config_key, config_value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `, [`homepage.${key}`, JSON.stringify(value)]);
    }

    // Insert default hero images
    console.log('Inserting default hero images...');
    const defaultHeroImages = [
      {
        id: '1',
        src: '/hero-image.jpg',
        alt: 'Porch Records Hero 1',
        order: 1
      },
      {
        id: '2',
        src: '/hero-image2.jpg',
        alt: 'Porch Records Hero 2',
        order: 2
      },
      {
        id: '3',
        src: '/hero-image3.jpg',
        alt: 'Porch Records Hero 3',
        order: 3
      }
    ];

    await database.run(`
      INSERT OR REPLACE INTO site_config (config_key, config_value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `, ['homepage.hero.images', JSON.stringify(defaultHeroImages)]);
    
    // Insert default theme presets
    console.log('Inserting default theme presets...');
    for (const preset of defaultThemePresets) {
      await database.run(`
        INSERT OR REPLACE INTO theme_presets (name, description, config_data, is_default, created_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [preset.name, preset.description, preset.config_data, preset.is_default ? 1 : 0]);
    }
    
    // Insert default homepage sections
    console.log('Inserting default homepage sections...');
    for (const section of defaultHomepageSections) {
      await database.run(`
        INSERT OR REPLACE INTO homepage_sections (section_type, section_data, order_index, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [section.section_type, section.section_data, section.order_index, section.is_active ? 1 : 0]);
    }
    
    console.log('Configuration migration completed successfully!');
    
    // Print summary
    const stats = await database.all(`
      SELECT 
        (SELECT COUNT(*) FROM site_config) as config_count,
        (SELECT COUNT(*) FROM homepage_sections) as sections_count,
        (SELECT COUNT(*) FROM theme_presets) as presets_count
    `);
    
    console.log('\nMigration Summary:');
    console.log(`- Site configuration entries: ${stats[0].config_count}`);
    console.log(`- Homepage sections: ${stats[0].sections_count}`);
    console.log(`- Theme presets: ${stats[0].presets_count}`);
    
  } catch (error) {
    console.error('Error during configuration migration:', error);
    process.exit(1);
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateConfiguration();
}

export { migrateConfiguration }; 
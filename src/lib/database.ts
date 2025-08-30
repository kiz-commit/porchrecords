import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';
import { initializeAnalyticsTables } from './analytics-db';

// Database file path
// Allow override via environment for containerized deployments (e.g., mounted volumes)
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'porchrecords.db');

// Ensure data directory exists
const ensureDataDir = () => {
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Database connection singleton
let db: Database | null = null;

// Get database connection
export async function getDatabase(): Promise<Database> {
  if (db) {
    return db;
  }

  ensureDataDir();
  
  db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  // Enable foreign keys
  await db.exec('PRAGMA foreign_keys = ON');
  
  return db;
}

// Initialize database tables
export async function initializeDatabase(): Promise<void> {
  const database = await getDatabase();
  
  // Create pages table
  await database.exec(`
    CREATE TABLE IF NOT EXISTS pages (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      meta_title TEXT,
      meta_description TEXT,
      is_published BOOLEAN DEFAULT 0,
      is_draft BOOLEAN DEFAULT 1,
      sections TEXT NOT NULL,
      versions TEXT,
      template TEXT,
      tags TEXT,
      publish_at TEXT,
      unpublish_at TEXT,
      cloned_from TEXT,
      created_at TEXT NOT NULL,
      last_modified TEXT NOT NULL
    )
  `);

  // Create media table
  await database.exec(`
    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      url TEXT NOT NULL,
      thumbnail TEXT,
      size INTEGER,
      dimensions TEXT,
      uploaded_at TEXT NOT NULL,
      tags TEXT,
      category TEXT
    )
  `);

  // Create navigation table
  await database.exec(`
    CREATE TABLE IF NOT EXISTS navigation (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      href TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      is_active BOOLEAN DEFAULT 1
    )
  `);

  // Create shows table with correct schema
  await database.exec(`
    CREATE TABLE IF NOT EXISTS shows (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      date TEXT,
      end_date TEXT,
      location TEXT,
      image TEXT,
      humanitix_embed TEXT,
      is_past BOOLEAN DEFAULT 0,
      is_published BOOLEAN DEFAULT 0,
      last_modified TEXT
    )
  `);

  // Create products table with complete schema
  await database.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      price REAL,
      description TEXT,
      image TEXT,
      in_stock BOOLEAN DEFAULT 1,
      artist TEXT,
      genre TEXT,
      curation_tags TEXT,
      is_preorder BOOLEAN DEFAULT 0,
      square_id TEXT,
      is_from_square BOOLEAN DEFAULT 0,
      updated_at TEXT,
      is_visible BOOLEAN DEFAULT 1,
      stock_quantity INTEGER DEFAULT 0,
      stock_status TEXT DEFAULT 'in_stock',
      product_type TEXT DEFAULT 'record',
      merch_category TEXT,
      size TEXT,
      color TEXT,
      mood TEXT,
      format TEXT,
      year TEXT,
      label TEXT,
      image_ids TEXT,
      images TEXT,
      preorder_release_date TEXT,
      preorder_quantity INTEGER DEFAULT 0,
      preorder_max_quantity INTEGER DEFAULT 0,
      is_variable_pricing BOOLEAN DEFAULT 0,
      min_price REAL,
      max_price REAL,
      created_at TEXT,
      last_synced_at TEXT,
      square_updated_at TEXT,
      slug TEXT,
      has_variations BOOLEAN DEFAULT 0,
      variation_count INTEGER DEFAULT 0,
      last_variation_sync TEXT,
      variations TEXT
    )
  `);

  // Create genres table (simple array of strings)
  await database.exec(`
    CREATE TABLE IF NOT EXISTS genres (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    )
  `);

  // Create moods table (simple array of strings)
  await database.exec(`
    CREATE TABLE IF NOT EXISTS moods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    )
  `);

  // Create taxonomy table for unified taxonomy management
  await database.exec(`
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

  // Create preorders table
  await database.exec(`
    CREATE TABLE IF NOT EXISTS preorders (
      product_id TEXT PRIMARY KEY,
      is_preorder BOOLEAN DEFAULT 0,
      preorder_release_date TEXT,
      preorder_quantity INTEGER DEFAULT 0,
      preorder_max_quantity INTEGER DEFAULT 0
    )
  `);

  // Create merch categories table
  await database.exec(`
    CREATE TABLE IF NOT EXISTS merch_categories (
      product_id TEXT PRIMARY KEY,
      product_type TEXT DEFAULT 'merch',
      merch_category TEXT,
      size TEXT,
      color TEXT
    )
  `);

  // Create site_config table for global theme and site configuration
  await database.exec(`
    CREATE TABLE IF NOT EXISTS site_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      config_key TEXT UNIQUE NOT NULL,
      config_value TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create homepage_sections table for configurable homepage sections
  await database.exec(`
    CREATE TABLE IF NOT EXISTS homepage_sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_type TEXT NOT NULL,
      section_data TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create theme_presets table for pre-built theme configurations
  await database.exec(`
    CREATE TABLE IF NOT EXISTS theme_presets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      config_data TEXT NOT NULL,
      is_default BOOLEAN DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create admin_security table for storing admin authentication data
  await database.exec(`
    CREATE TABLE IF NOT EXISTS admin_security (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      totp_secret TEXT,
      backup_codes TEXT,
      failed_attempts INTEGER DEFAULT 0,
      locked_until TEXT,
      last_login TEXT,
      last_ip TEXT,
      session_token TEXT,
      session_expires_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create admin_audit_log table for security event logging
  await database.exec(`
    CREATE TABLE IF NOT EXISTS admin_audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      user_agent TEXT,
      success BOOLEAN NOT NULL,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes for better performance
  await database.exec(`
    CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
    CREATE INDEX IF NOT EXISTS idx_pages_published ON pages(is_published);
    CREATE INDEX IF NOT EXISTS idx_media_type ON media(type);
    CREATE INDEX IF NOT EXISTS idx_media_category ON media(category);
    CREATE INDEX IF NOT EXISTS idx_navigation_order ON navigation(order_index);
    CREATE INDEX IF NOT EXISTS idx_shows_date ON shows(date);
    CREATE INDEX IF NOT EXISTS idx_products_title ON products(title);
    CREATE INDEX IF NOT EXISTS idx_site_config_key ON site_config(config_key);
    CREATE INDEX IF NOT EXISTS idx_homepage_sections_order ON homepage_sections(order_index);
    CREATE INDEX IF NOT EXISTS idx_homepage_sections_active ON homepage_sections(is_active);
    CREATE INDEX IF NOT EXISTS idx_theme_presets_default ON theme_presets(is_default);
    CREATE INDEX IF NOT EXISTS idx_admin_security_username ON admin_security(username);
    CREATE INDEX IF NOT EXISTS idx_admin_security_session ON admin_security(session_token);
    CREATE INDEX IF NOT EXISTS idx_admin_audit_username ON admin_audit_log(username);
    CREATE INDEX IF NOT EXISTS idx_admin_audit_timestamp ON admin_audit_log(timestamp);
    CREATE INDEX IF NOT EXISTS idx_taxonomy_type ON taxonomy(type);
    CREATE INDEX IF NOT EXISTS idx_taxonomy_active ON taxonomy(is_active);
    CREATE INDEX IF NOT EXISTS idx_taxonomy_order ON taxonomy(order_index);
    CREATE INDEX IF NOT EXISTS idx_taxonomy_parent ON taxonomy(parent_id);
    CREATE INDEX IF NOT EXISTS idx_admin_audit_action ON admin_audit_log(action);
  `);

  // Initialize analytics tables
  try {
    await initializeAnalyticsTables();
  } catch (error) {
    console.error('Error initializing analytics tables:', error);
  }
}

// Migrate data from JSON files to database
export async function migrateFromJson(): Promise<void> {
  const database = await getDatabase();
  
  console.log('Starting JSON to database migration...');

  // Migrate pages
  try {
    const pagesFile = path.join(process.cwd(), 'src', 'data', 'pages.json');
    if (fs.existsSync(pagesFile)) {
      const pagesData = JSON.parse(fs.readFileSync(pagesFile, 'utf8'));
      
      for (const page of pagesData) {
        await database.run(`
          INSERT OR REPLACE INTO pages (
            id, title, slug, description, meta_title, meta_description,
            is_published, is_draft, sections, versions, template, tags,
            publish_at, unpublish_at, cloned_from, created_at, last_modified
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          page.id,
          page.title,
          page.slug,
          page.description || '',
          page.metaTitle || '',
          page.metaDescription || '',
          page.isPublished ? 1 : 0,
          page.isDraft ? 1 : 0,
          JSON.stringify(page.sections || []),
          JSON.stringify(page.versions || []),
          page.template || '',
          JSON.stringify(page.tags || []),
          page.publishAt || null,
          page.unpublishAt || null,
          page.clonedFrom || null,
          page.createdAt || new Date().toISOString(),
          page.lastModified || new Date().toISOString()
        ]);
      }
      console.log(`Migrated ${pagesData.length} pages`);
    }
  } catch (error) {
    console.error('Error migrating pages:', error);
  }

  // Migrate shows
  try {
    const showsFile = path.join(process.cwd(), 'src', 'data', 'shows.json');
    if (fs.existsSync(showsFile)) {
      const showsData = JSON.parse(fs.readFileSync(showsFile, 'utf8'));
      
      for (const show of showsData) {
        await database.run(`
          INSERT OR REPLACE INTO shows (
            id, title, description, date, end_date, location, image,
            humanitix_embed, is_past, is_published, last_modified
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          show.id,
          show.title,
          show.description || '',
          show.date || null,
          show.endDate || null,
          show.location || '',
          show.image || '',
          show.humanitixEmbed || '',
          show.isPast ? 1 : 0,
          show.isPublished ? 1 : 0,
          show.lastModified || new Date().toISOString()
        ]);
      }
      console.log(`Migrated ${showsData.length} shows`);
    }
  } catch (error) {
    console.error('Error migrating shows:', error);
  }

  // Migrate products
  try {
    const productsFile = path.join(process.cwd(), 'src', 'data', 'products.json');
    if (fs.existsSync(productsFile)) {
      const productsData = JSON.parse(fs.readFileSync(productsFile, 'utf8'));
      
      for (const product of productsData) {
        await database.run(`
          INSERT OR REPLACE INTO products (
            id, title, price, description, image, in_stock, artist, genre,
            curation_tags, is_preorder, square_id, is_from_square, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          product.id,
          product.title,
          product.price || 0,
          product.description || '',
          product.image || '',
          product.inStock ? 1 : 0,
          product.artist || '',
          product.genre || '',
          JSON.stringify(product.curationTags || []),
          product.isPreorder ? 1 : 0,
          product.squareId || '',
          product.isFromSquare ? 1 : 0,
          product.updatedAt || new Date().toISOString()
        ]);
      }
      console.log(`Migrated ${productsData.length} products`);
    }
  } catch (error) {
    console.error('Error migrating products:', error);
  }

  // Migrate genres (array of strings)
  try {
    const genresFile = path.join(process.cwd(), 'src', 'data', 'genres.json');
    if (fs.existsSync(genresFile)) {
      const genresData = JSON.parse(fs.readFileSync(genresFile, 'utf8'));
      
      for (const genre of genresData) {
        await database.run(`
          INSERT OR IGNORE INTO genres (name) VALUES (?)
        `, [genre]);
      }
      console.log(`Migrated ${genresData.length} genres`);
    }
  } catch (error) {
    console.error('Error migrating genres:', error);
  }

  // Migrate moods (array of strings)
  try {
    const moodsFile = path.join(process.cwd(), 'src', 'data', 'moods.json');
    if (fs.existsSync(moodsFile)) {
      const moodsData = JSON.parse(fs.readFileSync(moodsFile, 'utf8'));
      
      for (const mood of moodsData) {
        await database.run(`
          INSERT OR IGNORE INTO moods (name) VALUES (?)
        `, [mood]);
      }
      console.log(`Migrated ${moodsData.length} moods`);
    }
  } catch (error) {
    console.error('Error migrating moods:', error);
  }

  // Migrate preorders (object with product IDs as keys)
  try {
    const preordersFile = path.join(process.cwd(), 'src', 'data', 'preorders.json');
    if (fs.existsSync(preordersFile)) {
      const preordersData = JSON.parse(fs.readFileSync(preordersFile, 'utf8'));
      
      for (const [productId, preorderData] of Object.entries(preordersData)) {
        const data = preorderData as any;
        await database.run(`
          INSERT OR REPLACE INTO preorders (
            product_id, is_preorder, preorder_release_date,
            preorder_quantity, preorder_max_quantity
          ) VALUES (?, ?, ?, ?, ?)
        `, [
          productId,
          data.isPreorder ? 1 : 0,
          data.preorderReleaseDate || null,
          data.preorderQuantity || 0,
          data.preorderMaxQuantity || 0
        ]);
      }
      console.log(`Migrated ${Object.keys(preordersData).length} preorders`);
    }
  } catch (error) {
    console.error('Error migrating preorders:', error);
  }

  // Migrate merch categories (object with product IDs as keys)
  try {
    const merchFile = path.join(process.cwd(), 'src', 'data', 'merchCategories.json');
    if (fs.existsSync(merchFile)) {
      const merchData = JSON.parse(fs.readFileSync(merchFile, 'utf8'));
      
      for (const [productId, merchItem] of Object.entries(merchData)) {
        const data = merchItem as any;
        await database.run(`
          INSERT OR REPLACE INTO merch_categories (
            product_id, product_type, merch_category, size, color
          ) VALUES (?, ?, ?, ?, ?)
        `, [
          productId,
          data.productType || 'merch',
          data.merchCategory || '',
          data.size || null,
          data.color || null
        ]);
      }
      console.log(`Migrated ${Object.keys(merchData).length} merch categories`);
    }
  } catch (error) {
    console.error('Error migrating merch categories:', error);
  }

  // Migrate navigation
  try {
    const navigationFile = path.join(process.cwd(), 'src', 'data', 'navigation.json');
    if (fs.existsSync(navigationFile)) {
      const navigationData = JSON.parse(fs.readFileSync(navigationFile, 'utf8'));
      
      for (const item of navigationData) {
        await database.run(`
          INSERT OR REPLACE INTO navigation (
            id, label, href, order_index, is_active
          ) VALUES (?, ?, ?, ?, ?)
        `, [
          item.id,
          item.label,
          item.href,
          item.order || 0,
          item.isActive !== false ? 1 : 0
        ]);
      }
      console.log(`Migrated ${navigationData.length} navigation items`);
    }
  } catch (error) {
    console.error('Error migrating navigation:', error);
  }

  console.log('JSON to database migration completed');
}

// Close database connection
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
  }
}

// Database utility functions
export async function backupDatabase(): Promise<string> {
  const backupPath = `${DB_PATH}.backup.${Date.now()}`;
  const database = await getDatabase();
  await database.close();
  
  // Copy database file
  fs.copyFileSync(DB_PATH, backupPath);
  
  // Reopen database
  await getDatabase();
  
  return backupPath;
}

// Get database statistics
export async function getDatabaseStats(): Promise<{
  pages: number;
  media: number;
  shows: number;
  products: number;
  genres: number;
  moods: number;
  siteConfig: number;
  homepageSections: number;
  themePresets: number;
  size: number;
}> {
  const database = await getDatabase();
  
  const pagesResult = await database.get('SELECT COUNT(*) as count FROM pages');
  const mediaResult = await database.get('SELECT COUNT(*) as count FROM media');
  const showsResult = await database.get('SELECT COUNT(*) as count FROM shows');
  const productsResult = await database.get('SELECT COUNT(*) as count FROM products');
  const genresResult = await database.get('SELECT COUNT(*) as count FROM genres');
  const moodsResult = await database.get('SELECT COUNT(*) as count FROM moods');
  const siteConfigResult = await database.get('SELECT COUNT(*) as count FROM site_config');
  const homepageSectionsResult = await database.get('SELECT COUNT(*) as count FROM homepage_sections');
  const themePresetsResult = await database.get('SELECT COUNT(*) as count FROM theme_presets');
  
  const stats = fs.statSync(DB_PATH);
  
  return {
    pages: pagesResult?.count || 0,
    media: mediaResult?.count || 0,
    shows: showsResult?.count || 0,
    products: productsResult?.count || 0,
    genres: genresResult?.count || 0,
    moods: moodsResult?.count || 0,
    siteConfig: siteConfigResult?.count || 0,
    homepageSections: homepageSectionsResult?.count || 0,
    themePresets: themePresetsResult?.count || 0,
    size: stats.size
  };
} 
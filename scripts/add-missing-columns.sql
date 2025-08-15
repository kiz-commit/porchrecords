-- Add missing columns to products table (safe migration)
-- This script only adds columns that don't exist

-- Add is_visible column if it doesn't exist
ALTER TABLE products ADD COLUMN is_visible BOOLEAN DEFAULT 1;

-- Add other missing columns that the code expects
ALTER TABLE products ADD COLUMN stock_quantity INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN stock_status TEXT DEFAULT 'in_stock';
ALTER TABLE products ADD COLUMN product_type TEXT DEFAULT 'record';
ALTER TABLE products ADD COLUMN merch_category TEXT;
ALTER TABLE products ADD COLUMN size TEXT;
ALTER TABLE products ADD COLUMN color TEXT;
ALTER TABLE products ADD COLUMN mood TEXT;
ALTER TABLE products ADD COLUMN format TEXT;
ALTER TABLE products ADD COLUMN year TEXT;
ALTER TABLE products ADD COLUMN label TEXT;
ALTER TABLE products ADD COLUMN image_ids TEXT;
ALTER TABLE products ADD COLUMN images TEXT;
ALTER TABLE products ADD COLUMN preorder_release_date TEXT;
ALTER TABLE products ADD COLUMN preorder_quantity INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN preorder_max_quantity INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN is_variable_pricing BOOLEAN DEFAULT 0;
ALTER TABLE products ADD COLUMN min_price REAL;
ALTER TABLE products ADD COLUMN max_price REAL;
ALTER TABLE products ADD COLUMN created_at TEXT;
ALTER TABLE products ADD COLUMN last_synced_at TEXT;
ALTER TABLE products ADD COLUMN square_updated_at TEXT;
ALTER TABLE products ADD COLUMN slug TEXT;
ALTER TABLE products ADD COLUMN has_variations BOOLEAN DEFAULT 0;
ALTER TABLE products ADD COLUMN variation_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN last_variation_sync TEXT;
ALTER TABLE products ADD COLUMN variations TEXT;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_visible ON products(is_visible);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock_status);
CREATE INDEX IF NOT EXISTS idx_products_genre ON products(genre);
CREATE INDEX IF NOT EXISTS idx_products_mood ON products(mood);
CREATE INDEX IF NOT EXISTS idx_products_merch_category ON products(merch_category);
CREATE INDEX IF NOT EXISTS idx_products_preorder ON products(is_preorder);
CREATE INDEX IF NOT EXISTS idx_products_from_square ON products(is_from_square);
CREATE INDEX IF NOT EXISTS idx_products_square_id ON products(square_id);
CREATE INDEX IF NOT EXISTS idx_products_updated ON products(updated_at);
CREATE INDEX IF NOT EXISTS idx_products_synced ON products(last_synced_at);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_products_visible_type ON products(is_visible, product_type);
CREATE INDEX IF NOT EXISTS idx_products_visible_stock ON products(is_visible, stock_status);
CREATE INDEX IF NOT EXISTS idx_products_type_genre ON products(product_type, genre);

-- Unique index for slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug_unique ON products(slug) WHERE slug IS NOT NULL;

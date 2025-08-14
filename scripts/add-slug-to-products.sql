-- Add slug field to products table for SEO-friendly URLs
ALTER TABLE products ADD COLUMN slug TEXT;

-- Create index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

-- Create unique index to ensure slugs are unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug_unique ON products(slug) WHERE slug IS NOT NULL;


-- Add available_at_location field to products table
-- This field tracks whether a product is available at the configured Square location
-- It gets populated during sync to avoid rate limiting on the products API

ALTER TABLE products ADD COLUMN available_at_location BOOLEAN DEFAULT 1;

-- Create an index for better query performance
CREATE INDEX idx_products_location_available ON products(available_at_location);

-- Update all existing products to be available by default
-- (they will be properly updated during the next sync)
UPDATE products SET available_at_location = 1 WHERE available_at_location IS NULL;

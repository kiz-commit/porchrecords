-- Create taxonomy table for unified taxonomy management
CREATE TABLE IF NOT EXISTS taxonomy (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('genre', 'mood', 'category', 'tag')),
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
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_taxonomy_type ON taxonomy(type);
CREATE INDEX IF NOT EXISTS idx_taxonomy_active ON taxonomy(is_active);
CREATE INDEX IF NOT EXISTS idx_taxonomy_order ON taxonomy(order_index);
CREATE INDEX IF NOT EXISTS idx_taxonomy_parent ON taxonomy(parent_id);

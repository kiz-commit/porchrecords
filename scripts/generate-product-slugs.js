const Database = require('better-sqlite3');
const path = require('path');

// Import slug utilities
function generateSlug(title, artist) {
  let text = title;
  if (artist && artist !== 'Unknown Artist') {
    text = `${title} ${artist}`;
  }
  
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 60);
}

function generateUniqueSlug(title, artist, existingSlugs = []) {
  const baseSlug = generateSlug(title, artist);
  
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }
  
  let counter = 1;
  let uniqueSlug = `${baseSlug}-${counter}`;
  
  while (existingSlugs.includes(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }
  
  return uniqueSlug;
}

async function generateProductSlugs() {
  const dbPath = path.join(process.cwd(), 'data', 'porchrecords.db');
  const db = new Database(dbPath);
  
  try {
    console.log('🔄 Generating slugs for existing products...');
    
    // First, run the migration to add the slug column (if it doesn't exist)
    console.log('📝 Checking/adding slug column to products table...');
    try {
      db.exec('ALTER TABLE products ADD COLUMN slug TEXT');
      console.log('✅ Added slug column');
    } catch (error) {
      if (error.message.includes('duplicate column name')) {
        console.log('✅ Slug column already exists');
      } else {
        throw error;
      }
    }
    
    // Create indexes
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug_unique ON products(slug) WHERE slug IS NOT NULL;
    `);
    
    // Get all products
    const products = db.prepare('SELECT id, title, artist FROM products WHERE slug IS NULL OR slug = \'\'').all();
    console.log(`📦 Found ${products.length} products without slugs`);
    
    // Get existing slugs to avoid duplicates
    const existingSlugs = db.prepare('SELECT slug FROM products WHERE slug IS NOT NULL AND slug != \'\'').all()
      .map(row => row.slug);
    
    console.log(`📋 Found ${existingSlugs.length} existing slugs`);
    
    // Generate slugs for each product
    const updateStmt = db.prepare('UPDATE products SET slug = ? WHERE id = ?');
    let updatedCount = 0;
    
    for (const product of products) {
      const slug = generateUniqueSlug(product.title, product.artist, existingSlugs);
      
      try {
        updateStmt.run(slug, product.id);
        existingSlugs.push(slug);
        updatedCount++;
        
        console.log(`✅ ${product.title} -> ${slug}`);
      } catch (error) {
        console.error(`❌ Failed to update ${product.title}:`, error.message);
      }
    }
    
    console.log(`🎉 Successfully generated slugs for ${updatedCount} products`);
    
    // Show some examples
    const examples = db.prepare('SELECT title, artist, slug FROM products WHERE slug IS NOT NULL LIMIT 5').all();
    console.log('\n📝 Example slugs:');
    examples.forEach(product => {
      console.log(`  "${product.title}" by ${product.artist} -> /store/${product.slug}`);
    });
    
  } catch (error) {
    console.error('❌ Error generating product slugs:', error);
  } finally {
    db.close();
  }
}

// Run the script
generateProductSlugs();

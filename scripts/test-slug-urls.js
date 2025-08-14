const Database = require('better-sqlite3');
const path = require('path');

async function testSlugUrls() {
  const dbPath = path.join(process.cwd(), 'data', 'porchrecords.db');
  const db = new Database(dbPath);
  
  try {
    console.log('🧪 Testing slug-based URLs...\n');
    
    // Get a few products with their slugs
    const products = db.prepare(`
      SELECT id, title, artist, slug 
      FROM products 
      WHERE slug IS NOT NULL AND slug != '' 
      LIMIT 5
    `).all();
    
    console.log('📦 Products with slugs:');
    products.forEach(product => {
      console.log(`  "${product.title}" by ${product.artist || 'Unknown Artist'}`);
      console.log(`    ID: ${product.id}`);
      console.log(`    Slug: ${product.slug}`);
      console.log(`    New URL: /store/${product.slug}`);
      console.log(`    Old URL: /store/${product.id}`);
      console.log('');
    });
    
    // Test slug lookup
    console.log('🔍 Testing slug lookup...');
    const testSlug = products[0]?.slug;
    if (testSlug) {
      const productBySlug = db.prepare(`
        SELECT id, title, slug FROM products WHERE slug = ?
      `).get(testSlug);
      
      if (productBySlug) {
        console.log(`✅ Found product by slug "${testSlug}": ${productBySlug.title}`);
      } else {
        console.log(`❌ Product not found by slug "${testSlug}"`);
      }
    }
    
    // Test ID lookup (backward compatibility)
    console.log('\n🔍 Testing ID lookup (backward compatibility)...');
    const testId = products[0]?.id;
    if (testId) {
      const productById = db.prepare(`
        SELECT id, title, slug FROM products WHERE id = ?
      `).get(testId);
      
      if (productById) {
        console.log(`✅ Found product by ID "${testId}": ${productById.title}`);
      } else {
        console.log(`❌ Product not found by ID "${testId}"`);
      }
    }
    
    console.log('\n🎉 Slug URL testing complete!');
    console.log('\n📝 Example URLs you can now use:');
    products.forEach(product => {
      console.log(`  http://localhost:3000/store/${product.slug}`);
    });
    
  } catch (error) {
    console.error('❌ Error testing slug URLs:', error);
  } finally {
    db.close();
  }
}

// Run the test
testSlugUrls();


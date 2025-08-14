import { NextRequest, NextResponse } from 'next/server';
import { StoreProduct } from '@/lib/types';
import Database from 'better-sqlite3';

function safeString(val: unknown): string {
  return typeof val === 'string' ? val : '';
}

// Helper function to get product visibility from database
function getProductVisibility(squareId: string, title: string): boolean {
  const db = new Database('data/porchrecords.db');
  
  try {
    // Check if product exists in database
    const existingProduct = db.prepare('SELECT is_visible FROM products WHERE square_id = ?').get(squareId);
    
    if (existingProduct && typeof existingProduct === 'object' && 'is_visible' in existingProduct) {
      return Boolean(existingProduct.is_visible);
    }
    
    // Product doesn't exist, create it with default visibility (true)
    const insertProduct = db.prepare(`
      INSERT OR IGNORE INTO products (id, title, square_id, is_visible, is_from_square, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const productId = `square_${squareId}`;
    insertProduct.run(productId, title, squareId, 1, 1, new Date().toISOString());
    
    return true; // Default to visible for new products
  } catch (error) {
    console.error('❌ Error checking product visibility:', error);
    return true; // Default to visible on error
  } finally {
    db.close();
  }
}

// GET - Fetch a single product by ID or slug (public endpoint)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // Fetch the product from our local database
    const db = new Database('data/porchrecords.db');
    
    try {
      // Try to find by slug first, then by ID as fallback
      let product = db.prepare(`
        SELECT * FROM products 
        WHERE slug = ? AND is_visible = 1
      `).get(id) as any;
      
      // If not found by slug, try by ID (for backward compatibility)
      if (!product) {
        product = db.prepare(`
          SELECT * FROM products 
          WHERE id = ? AND is_visible = 1
        `).get(id) as any;
      }
      
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      
      // Parse JSON fields
      const imageIds = product?.image_ids ? JSON.parse(product.image_ids) : [];
      const images = product?.images ? JSON.parse(product.images) : [];
      
      // Format the product for the frontend
      const formattedProduct: StoreProduct = {
        id: product.id,
        title: product.title,
        artist: product.artist || 'Unknown Artist',
        price: product.price,
        description: product.description || '',
        image: product.image || '/store.webp',
        images: images,
        imageIds: imageIds,
        genre: product.genre || 'Uncategorized',
        inStock: Boolean(product.in_stock),
        isPreorder: Boolean(product.is_preorder),
        isVisible: Boolean(product.is_visible),
        squareId: product.square_id,
        productType: product.product_type || 'record',
        merchCategory: product.merch_category || '',
        size: product.size || '',
        color: product.color || '',
        mood: product.mood || '',
        format: product.format || '',
        year: product.year || '',
        label: product.label || '',
        preorderReleaseDate: product.preorder_release_date || '',
        preorderQuantity: product.preorder_quantity || 0,
        preorderMaxQuantity: product.preorder_max_quantity || 0,
        stockQuantity: product.stock_quantity || 0,
        stockStatus: product.stock_status || 'in_stock',
        isVariablePricing: Boolean(product.is_variable_pricing),
        minPrice: product.min_price,
        maxPrice: product.max_price,
        createdAt: product.created_at,
        // Non-typed fields kept internal; omit from response to satisfy StoreProduct
        // updatedAt: product.updated_at,
        // lastSyncedAt: product.last_synced_at,
        // squareUpdatedAt: product.square_updated_at,
        slug: product.slug
      };
      
      return NextResponse.json({ 
        success: true, 
        product: formattedProduct 
      });
      
    } finally {
      db.close();
    }
    
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

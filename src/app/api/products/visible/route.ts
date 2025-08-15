import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import { StoreProduct } from '@/lib/types';

// GET - Retrieve only visible products from database
export async function GET() {
  const db = new Database('data/porchrecords.db');
  
  try {
    // Get all visible products from database
    const query = `
      SELECT 
        id, title, artist, price, description, image, images, image_ids,
        genre, in_stock, is_preorder, is_visible, preorder_release_date,
        preorder_quantity, preorder_max_quantity, product_type, merch_category,
        size, color, mood, stock_quantity, stock_status, is_variable_pricing,
        min_price, max_price, created_at, slug
      FROM products 
      WHERE is_visible = 1 AND is_from_square = 1
      ORDER BY title ASC
    `;

    const rows = db.prepare(query).all() as any[];

    // Transform database rows to StoreProduct format
    const products: StoreProduct[] = rows.map((row: any) => ({
      id: row.id,
      title: row.title || 'No title',
      artist: row.artist || 'Unknown Artist',
      price: row.price || 0,
      description: row.description || '',
      image: row.image || '/store.webp',
      images: row.images ? JSON.parse(row.images) : [],
      imageIds: row.image_ids ? JSON.parse(row.image_ids) : [],
      genre: row.genre || 'Uncategorized',
      inStock: Boolean(row.in_stock),
      isPreorder: Boolean(row.is_preorder),
      isVisible: Boolean(row.is_visible),
      preorderReleaseDate: row.preorder_release_date || '',
      preorderQuantity: row.preorder_quantity || 0,
      preorderMaxQuantity: row.preorder_max_quantity || 0,
      productType: row.product_type || 'record',
      merchCategory: row.merch_category || '',
      size: row.size || '',
      color: row.color || '',
      mood: row.mood || '',
      stockQuantity: row.stock_quantity || 0,
      stockStatus: row.stock_status || 'out_of_stock',
      isVariablePricing: Boolean(row.is_variable_pricing),
      minPrice: row.min_price,
      maxPrice: row.max_price,
      slug: row.slug
    }));

    console.log(`📱 Public store: Showing ${products.length} visible products from database`);
    
    return NextResponse.json({
      success: true,
      products: products,
      totalProducts: products.length,
      visibleProducts: products.length,
      fromDatabase: true,
      cacheTime: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error fetching visible products from database:', error);
    
    return NextResponse.json({
      success: false,
      products: [],
      error: errorMessage
    }, { status: 500 });
  } finally {
    db.close();
  }
}

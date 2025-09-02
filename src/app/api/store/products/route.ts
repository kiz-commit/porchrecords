import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import { type StoreProduct } from '@/lib/types';

// GET - Retrieve visible products from database (fast, no Square API calls)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const productType = searchParams.get('type');
    const genre = searchParams.get('genre');
    const mood = searchParams.get('mood');

    console.log(`📊 Store API: Fetching products from database (limit: ${limit}, offset: ${offset})`);

    // Get products from database only - no Square API calls
    const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'porchrecords.db');
    const db = new Database(DB_PATH);
    
    try {
      // Build WHERE conditions
      let whereConditions = ['is_from_square = 1', 'available_at_location = 1', 'is_visible = 1'];
      let params: any[] = [];

      if (productType) {
        whereConditions.push('product_type = ?');
        params.push(productType);
      }
      
      if (genre) {
        whereConditions.push('genre = ?');
        params.push(genre);
      }
      
      if (mood) {
        whereConditions.push('mood = ?');
        params.push(mood);
      }

      const whereClause = whereConditions.join(' AND ');

      // Get total count for pagination
      const countQuery = `SELECT COUNT(*) as count FROM products WHERE ${whereClause}`;
      const countResult = db.prepare(countQuery).get(...params) as any;
      const totalCount = countResult.count;

      // Get paginated products
      const query = `
        SELECT 
          id, title, artist, price, description, image, images, image_ids,
          genre, in_stock, is_preorder, is_visible, preorder_release_date,
          preorder_quantity, preorder_max_quantity, product_type, merch_category,
          size, color, mood, stock_quantity, stock_status, is_variable_pricing,
          min_price, max_price, created_at, slug, square_id, available_at_location
        FROM products
        WHERE ${whereClause}
        ORDER BY title ASC
        LIMIT ? OFFSET ?
      `;

      params.push(limit, offset);
      const rows = db.prepare(query).all(...params) as any[];

      // Transform database rows to StoreProduct format
      const products: StoreProduct[] = rows.map(row => ({
        id: row.id,
        title: row.title || 'Unknown Product',
        artist: row.artist || 'Various Artists',
        price: row.price || 0,
        description: row.description || '',
        image: row.image || '/store.webp',
        images: row.images ? (typeof row.images === 'string' ? JSON.parse(row.images) : row.images) : [],
        imageIds: row.image_ids ? (typeof row.image_ids === 'string' ? JSON.parse(row.image_ids) : row.image_ids) : [],
        genre: row.genre || '',
        inStock: Boolean(row.in_stock),
        stockQuantity: row.stock_quantity || 0,
        stockStatus: row.stock_status || 'out_of_stock',
        isVisible: Boolean(row.is_visible),
        isPreorder: Boolean(row.is_preorder),
        preorderReleaseDate: row.preorder_release_date || '',
        preorderQuantity: row.preorder_quantity || 0,
        preorderMaxQuantity: row.preorder_max_quantity || 0,
        productType: row.product_type || 'record',
        merchCategory: row.merch_category || '',
        size: row.size || '',
        color: row.color || '',
        mood: row.mood || '',
        isVariablePricing: Boolean(row.is_variable_pricing),
        minPrice: row.min_price,
        maxPrice: row.max_price,
        createdAt: row.created_at,
        slug: row.slug,
        squareId: row.square_id
      }));

      console.log(`✅ Store API: Returning ${products.length}/${totalCount} products from database (page ${Math.floor(offset/limit) + 1})`);

      return NextResponse.json({
        success: true,
        products: products,
        totalCount: totalCount,
        hasMore: offset + limit < totalCount,
        page: Math.floor(offset/limit) + 1,
        totalPages: Math.ceil(totalCount / limit)
      });

    } finally {
      db.close();
    }

  } catch (error) {
    console.error('❌ Store API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch products',
        products: [],
        totalCount: 0,
        hasMore: false
      },
      { status: 500 }
    );
  }
}
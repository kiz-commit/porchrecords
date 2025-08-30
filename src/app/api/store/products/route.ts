import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

interface StoreProduct {
  id: string;
  title: string;
  artist: string;
  price: number;
  description: string;
  image: string;
  images: { id: string; url: string }[];
  imageIds: string[];
  genre: string;
  inStock: boolean;
  isPreorder: boolean;
  isVisible: boolean;
  preorderReleaseDate: string;
  preorderQuantity: number;
  preorderMaxQuantity: number;
  productType: 'record' | 'merch' | 'accessory' | 'voucher';
  merchCategory: string;
  size: string;
  color: string;
  mood: string;
  stockQuantity: number;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  isVariablePricing?: boolean;
  minPrice?: number;
  maxPrice?: number;
  slug: string;
}



import { getProductsByLocation } from '@/lib/product-database-utils';

// GET - Retrieve visible products from local database (super fast!)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeHidden = searchParams.get('includeHidden') === 'true';
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get products available at location (filtered by visibility for store)
    const allProducts = getProductsByLocation(includeHidden);
    
    // Apply additional filters if needed
    let filteredProducts = allProducts;
    
    const productType = searchParams.get('type');
    if (productType && productType !== 'all') {
      filteredProducts = filteredProducts.filter(p => p.productType === productType);
    }
    
    const genre = searchParams.get('genre');
    if (genre && genre !== 'all') {
      filteredProducts = filteredProducts.filter(p => p.genre === genre);
    }
    
    const mood = searchParams.get('mood');
    if (mood && mood !== 'all') {
      filteredProducts = filteredProducts.filter(p => p.mood === mood);
    }

    const totalProducts = filteredProducts.length;
    
    // Apply pagination
    const paginatedProducts = filteredProducts.slice(offset, offset + limit);
    
    console.log(`🚀 Database query: Found ${paginatedProducts.length} products from local database`);

    return NextResponse.json({
      success: true,
      products: paginatedProducts,
      totalProducts,
      currentPage: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(totalProducts / limit),
      hasMore: offset + limit < totalProducts,
      fromDatabase: true,
      cacheTime: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error fetching products from database:', error);
    
    return NextResponse.json({
      success: false,
      products: [],
      error: errorMessage
    }, { status: 500 });
  }
}

// GET by ID - Retrieve single product from database (internal helper)
async function getProductById(id: string): Promise<StoreProduct | null> {
  const db = await getDatabase();
  
  try {
    const query = `
      SELECT 
        id, title, artist, price, description, image, images, image_ids,
        genre, in_stock, is_preorder, is_visible, preorder_release_date,
        preorder_quantity, preorder_max_quantity, product_type, merch_category,
        size, color, mood, stock_quantity, stock_status, is_variable_pricing,
        min_price, max_price, created_at, slug
      FROM products 
      WHERE id = ? AND is_from_square = 1 AND is_visible = 1
    `;

    const row = await db.get(query, id) as any;
    
    if (!row) {
      return null;
    }

    const product: StoreProduct = {
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
    };

    return product;

  } catch (error) {
    console.error('❌ Error fetching product by ID from database:', error);
    return null;
  }
}

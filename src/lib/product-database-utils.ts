import Database from 'better-sqlite3';
import { StoreProduct } from '@/lib/types';

const DB_PATH = process.env.DB_PATH || 'data/porchrecords.db';

/**
 * Get products available at the configured location from database
 */
export function getProductsByLocation(
  includeHidden: boolean = false,
  limit: number = 100,
  offset: number = 0
): StoreProduct[] {
  const db = new Database(DB_PATH);
  
  try {
    let whereConditions = ['is_from_square = 1', 'available_at_location = 1'];
    let params: any[] = [];

    if (!includeHidden) {
      whereConditions.push('is_visible = 1');
    }

    const whereClause = whereConditions.join(' AND ');

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

    return products;
  } finally {
    db.close();
  }
}

/**
 * Get existing admin-managed fields for a product to preserve during sync
 */
export function getAdminFields(squareId: string): {
  genre: string;
  mood: string;
  productType: string;
  merchCategory: string;
  isVisible: boolean;
  size: string;
  color: string;
} {
  const db = new Database(DB_PATH);
  
  try {
    const query = `
      SELECT genre, mood, product_type, merch_category, is_visible, size, color
      FROM products 
      WHERE square_id = ? AND is_from_square = 1
    `;

    const row = db.prepare(query).get(squareId) as any;
    
    if (!row) {
      return {
        genre: '',
        mood: '',
        productType: 'record',
        merchCategory: '',
        isVisible: true,
        size: '',
        color: ''
      };
    }

    return {
      genre: row.genre || '',
      mood: row.mood || '',
      productType: row.product_type || 'record',
      merchCategory: row.merch_category || '',
      isVisible: Boolean(row.is_visible),
      size: row.size || '',
      color: row.color || ''
    };
  } finally {
    db.close();
  }
}

/**
 * Update only inventory-related fields for a product (preserves admin fields)
 */
export function updateProductInventory(
  squareId: string,
  inventoryData: {
    stockQuantity: number;
    stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
    availableAtLocation: boolean;
  }
): boolean {
  const db = new Database(DB_PATH);
  
  try {
    const now = new Date().toISOString();
    
    const updateQuery = `
      UPDATE products 
      SET stock_quantity = ?, 
          stock_status = ?, 
          available_at_location = ?,
          in_stock = ?,
          last_synced_at = ?
      WHERE square_id = ? AND is_from_square = 1
    `;

    const result = db.prepare(updateQuery).run(
      inventoryData.stockQuantity,
      inventoryData.stockStatus,
      inventoryData.availableAtLocation ? 1 : 0,
      inventoryData.stockQuantity > 0 ? 1 : 0,
      now,
      squareId
    );

    return result.changes > 0;
  } finally {
    db.close();
  }
}

/**
 * Reset all products to not available at location (for sync preparation)
 */
export function resetLocationAvailability(): void {
  const db = new Database(DB_PATH);
  
  try {
    console.log('🔄 Resetting all products to available_at_location = 0');
    db.prepare('UPDATE products SET available_at_location = 0 WHERE is_from_square = 1').run();
  } finally {
    db.close();
  }
}

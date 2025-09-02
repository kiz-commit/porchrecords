import Database from 'better-sqlite3';
import { StoreProduct } from '@/lib/types';
import { generateSlug } from '@/lib/slug-utils';

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
 * Update admin-managed fields for a product
 */
export function updateAdminFields(
  squareId: string,
  adminFields: {
    genre?: string;
    mood?: string;
    productType?: string;
    merchCategory?: string;
    isVisible?: boolean;
    size?: string;
    color?: string;
  }
): boolean {
  const db = new Database(DB_PATH);
  
  try {
    const now = new Date().toISOString();
    
    const updateQuery = `
      UPDATE products 
      SET genre = COALESCE(?, genre),
          mood = COALESCE(?, mood),
          product_type = COALESCE(?, product_type),
          merch_category = COALESCE(?, merch_category),
          is_visible = COALESCE(?, is_visible),
          size = COALESCE(?, size),
          color = COALESCE(?, color),
          updated_at = ?
      WHERE square_id = ? AND is_from_square = 1
    `;

    const result = db.prepare(updateQuery).run(
      adminFields.genre,
      adminFields.mood,
      adminFields.productType,
      adminFields.merchCategory,
      adminFields.isVisible !== undefined ? (adminFields.isVisible ? 1 : 0) : undefined,
      adminFields.size,
      adminFields.color,
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

/**
 * Create or update a product from Square data (upsert operation)
 */
export function upsertProductFromSquare(productData: {
  squareId: string;
  title: string;
  price: number;
  description: string;
  image: string;
  artist: string;
  imageIds: string[];
  images: { id: string; url: string }[];
  slug: string;
}, inventoryData: {
  stockQuantity: number;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  availableAtLocation: boolean;
}): boolean {
  const db = new Database(DB_PATH);
  
  try {
    const now = new Date().toISOString();
    
    // Check if product already exists
    const existingProduct = db.prepare('SELECT id FROM products WHERE square_id = ?').get(productData.squareId);
    
    if (existingProduct) {
      // Update existing product with new data and inventory
      const updateQuery = `
        UPDATE products 
        SET title = ?, 
            price = ?, 
            description = ?, 
            image = ?, 
            artist = ?, 
            image_ids = ?, 
            images = ?, 
            slug = ?,
            stock_quantity = ?, 
            stock_status = ?, 
            available_at_location = ?,
            in_stock = ?,
            last_synced_at = ?,
            updated_at = ?
        WHERE square_id = ? AND is_from_square = 1
      `;

      const result = db.prepare(updateQuery).run(
        productData.title,
        productData.price,
        productData.description,
        productData.image,
        productData.artist,
        JSON.stringify(productData.imageIds),
        JSON.stringify(productData.images),
        productData.slug,
        inventoryData.stockQuantity,
        inventoryData.stockStatus,
        inventoryData.availableAtLocation ? 1 : 0,
        inventoryData.stockQuantity > 0 ? 1 : 0,
        now,
        now,
        productData.squareId
      );

      return result.changes > 0;
    } else {
      // Create new product
      const productId = `square_${productData.squareId}`;
      
      const insertQuery = `
        INSERT INTO products (
          id, title, price, description, image, artist, genre, 
          is_preorder, square_id, is_from_square, is_visible, 
          stock_quantity, stock_status, product_type, updated_at, 
          created_at, last_synced_at, image_ids, images, slug,
          available_at_location, in_stock
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const result = db.prepare(insertQuery).run(
        productId,
        productData.title,
        productData.price,
        productData.description,
        productData.image,
        productData.artist,
        'Uncategorized', // default genre
        0, // is_preorder
        productData.squareId,
        1, // is_from_square
        1, // is_visible (default to visible)
        inventoryData.stockQuantity,
        inventoryData.stockStatus,
        'record', // default product_type
        now, // updated_at
        now, // created_at
        now, // last_synced_at
        JSON.stringify(productData.imageIds),
        JSON.stringify(productData.images),
        productData.slug,
        inventoryData.availableAtLocation ? 1 : 0,
        inventoryData.stockQuantity > 0 ? 1 : 0
      );

      return result.changes > 0;
    }
  } finally {
    db.close();
  }
}

/**
 * Get inventory data for a product from Square
 */
export async function getSquareInventoryData(squareId: string): Promise<{
  stockQuantity: number;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  availableAtLocation: boolean;
}> {
  try {
    const locationId = process.env.SQUARE_LOCATION_ID;
    if (!locationId) {
      return { stockQuantity: 0, stockStatus: 'in_stock', availableAtLocation: true };
    }

    const squareClient = (await import('@/lib/square')).default;
    const inventory = await squareClient.inventory();
    const inventoryResponse = await inventory.batchGetCounts({
      locationIds: [locationId],
      catalogObjectIds: [squareId],
    });

    if (inventoryResponse && inventoryResponse.data && inventoryResponse.data.length > 0) {
      const quantity = Number(inventoryResponse.data[0].quantity) || 0;
      const stockStatus = quantity === 0 ? 'out_of_stock' : 
                         quantity < 3 ? 'low_stock' : 'in_stock';
      
      return { stockQuantity: quantity, stockStatus, availableAtLocation: true };
    }
    
    return { stockQuantity: 0, stockStatus: 'out_of_stock', availableAtLocation: false };
  } catch (error) {
    console.error('❌ Error fetching inventory for variation:', squareId, error);
    return { stockQuantity: 0, stockStatus: 'out_of_stock', availableAtLocation: false };
  }
}

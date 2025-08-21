import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import squareClient from '@/lib/square';

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
}

// Helper function to check if product is available at the configured location
async function isProductAvailableAtLocation(squareId: string): Promise<boolean> {
  try {
    const locationId = process.env.SQUARE_LOCATION_ID;
    if (!locationId) {
      console.log('⚠️  No SQUARE_LOCATION_ID configured - including all products');
      return true; // Include all products if no location configured
    }

    console.log(`🔍 Checking location availability for product ${squareId} at location ${locationId}`);

    // First, check if this product has inventory at the configured location
    const inventory = await squareClient.inventory();
    const inventoryResponse = await inventory.batchGetCounts({
      locationIds: [locationId],
      catalogObjectIds: [squareId],
    });
    
    if (inventoryResponse && inventoryResponse.data && inventoryResponse.data.length > 0) {
      const inventoryData = inventoryResponse.data[0] as any;
      if (inventoryData && inventoryData.counts && inventoryData.counts.length > 0) {
        const count = inventoryData.counts[0];
        if (count && count.state === 'IN_STOCK' && count.quantity && count.quantity > 0) {
          console.log(`✅ Product ${squareId} has inventory (${count.quantity}) at location ${locationId}`);
          return true;
        }
      }
    }
    
    // If no inventory found, check if the product is explicitly enabled at this location
    try {
      const catalog = await squareClient.catalog();
      const productResponse = await catalog.object.get({ objectId: squareId });
      
      if (productResponse.object && productResponse.object.type === 'ITEM') {
        const itemData = productResponse.object.itemData;
        if (itemData && itemData.variations && itemData.variations.length > 0) {
          const variation = itemData.variations[0];
          if (variation.type === 'ITEM_VARIATION' && variation.itemVariationData) {
            const locationOverrides = variation.itemVariationData.locationOverrides || [];
            
            // Check if there's an explicit override for this location
            const locationOverride = locationOverrides.find(
              (override: any) => override.locationId === locationId
            );
            
            if (locationOverride) {
              // If there's an override, check if it's enabled
              if (locationOverride.trackInventory !== false) {
                console.log(`✅ Product ${squareId} explicitly enabled at location ${locationId}`);
                return true;
              } else {
                console.log(`❌ Product ${squareId} explicitly disabled at location ${locationId}`);
                return false;
              }
            } else {
              // No location override found - this means the product is not specifically configured for this location
              console.log(`❌ Product ${squareId} has no location override for ${locationId} - excluding`);
              return false;
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error checking product ${squareId} location availability:`, error);
    }
    
    console.log(`❌ Product ${squareId} not available at location ${locationId}`);
    return false;
  } catch (error) {
    console.error(`Error checking location availability for ${squareId}:`, error);
    return false; // Default to exclude on error
  }
}

// GET - Retrieve visible products from local database (super fast!)
export async function GET(request: NextRequest) {
  const db = await getDatabase();
  
  try {
    const { searchParams } = new URL(request.url);
    const includeHidden = searchParams.get('includeHidden') === 'true';
    const productType = searchParams.get('type');
    const genre = searchParams.get('genre');
    const mood = searchParams.get('mood');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build dynamic query based on filters
    let whereConditions = ['is_from_square = 1']; // Only Square products
    let params: any[] = [];

    if (!includeHidden) {
      whereConditions.push('is_visible = 1');
    }

    if (productType && productType !== 'all') {
      whereConditions.push('product_type = ?');
      params.push(productType);
    }

    if (genre && genre !== 'all') {
      whereConditions.push('genre = ?');
      params.push(genre);
    }

    if (mood && mood !== 'all') {
      whereConditions.push('mood = ?');
      params.push(mood);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count for pagination
    const countQuery = `SELECT COUNT(*) as total FROM products ${whereClause}`;
    const countResult = await db.get(countQuery, ...params) as { total: number };
    const totalProducts = countResult.total;

    // Get products with pagination
    const query = `
      SELECT 
        id, title, artist, price, description, image, images, image_ids,
        genre, in_stock, is_preorder, is_visible, preorder_release_date,
        preorder_quantity, preorder_max_quantity, product_type, merch_category,
        size, color, mood, stock_quantity, stock_status, is_variable_pricing,
        min_price, max_price, created_at, slug, square_id
      FROM products
      ${whereClause}
      ORDER BY title ASC
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const rows = await db.all(query, ...params) as any[];

    // Transform database rows to StoreProduct format and filter by location
    const allProducts = rows.map((row: any) => ({
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
      slug: row.slug,
      squareId: row.square_id
    }));

    // Filter products by location availability
    const products: StoreProduct[] = [];
    let includedCount = 0;
    let excludedCount = 0;
    
    for (const product of allProducts) {
      if (product.squareId) {
        const isAvailable = await isProductAvailableAtLocation(product.squareId);
        if (isAvailable) {
          // Remove squareId from final product object
          const { squareId, ...productWithoutSquareId } = product;
          products.push(productWithoutSquareId);
          includedCount++;
        } else {
          excludedCount++;
        }
      } else {
        // Include products without square_id (legacy products)
        const { squareId, ...productWithoutSquareId } = product;
        products.push(productWithoutSquareId);
        includedCount++;
      }
    }
    
    console.log(`📍 Location filtering complete: ${includedCount} products included, ${excludedCount} products excluded`);

    console.log(`🚀 Database query: Found ${products.length} products in ${Date.now() - Date.now()}ms`);

    return NextResponse.json({
      success: true,
      products,
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
        min_price, max_price, created_at, slug, square_id
      FROM products 
      WHERE id = ? AND is_from_square = 1
    `;

    const row = await db.get(query, id) as any;
    
    if (!row) {
      return null;
    }

    const product = {
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
      slug: row.slug,
      squareId: row.square_id
    };

    // Check location availability for Square products
    if (product.squareId) {
      const isAvailable = await isProductAvailableAtLocation(product.squareId);
      if (!isAvailable) {
        return null; // Product not available at current location
      }
    }

    // Remove squareId from final product object
    const { squareId, ...productWithoutSquareId } = product;
    return productWithoutSquareId as StoreProduct;

  } catch (error) {
    console.error('❌ Error fetching product by ID from database:', error);
    return null;
  }
}

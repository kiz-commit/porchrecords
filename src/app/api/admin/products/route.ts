import { NextRequest, NextResponse } from 'next/server';
import squareClient from '@/lib/square';
import { StoreProduct } from '@/lib/types';
import { Square } from 'square';
import { withAdminAuth } from '@/lib/route-protection';
import { invalidateProductsCache } from '@/lib/cache-utils';
import Database from 'better-sqlite3';

// GET - Fetch all products from database (protected with admin auth)
async function getHandler(request: NextRequest) {
  const db = new Database('data/porchrecords.db');
  
  try {
    // Get all products from database
    const query = `
      SELECT 
        id, title, artist, price, description, image, images, image_ids,
        genre, in_stock, is_preorder, is_visible, preorder_release_date,
        preorder_quantity, preorder_max_quantity, product_type, merch_category,
        size, color, mood, stock_quantity, stock_status, is_variable_pricing,
        min_price, max_price, created_at, slug, square_id, is_from_square
      FROM products 
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

    console.log(`📊 Admin: Showing ${products.length} products from database`);
    
    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching products from database:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  } finally {
    db.close();
  }
}

// Export GET with admin authentication
export const GET = withAdminAuth(getHandler);

// POST - Create a new product (protected with sensitive admin auth)
async function postHandler(request: NextRequest) {
  try {
    const productData = await request.json();
    // Validate required fields
    if (!productData.title || !productData.artist || !productData.price) {
      return NextResponse.json(
        { error: 'Title, artist, and price are required' },
        { status: 400 }
      );
    }

    // Set default visibility if not provided
    if (productData.isVisible === undefined) {
      productData.isVisible = true;
    }

    // Create product in Square
    const locationId = process.env.SQUARE_LOCATION_ID;
    if (!locationId) {
      return NextResponse.json(
        { error: 'SQUARE_LOCATION_ID not configured' },
        { status: 500 }
      );
    }

    // Prepare Square item object
    const itemId = `#${Date.now()}`;
    const variationId = `#${itemId}_variation`;
    
    // Keep description as-is; visibility and preorder are tracked in DB tables now
    const enhancedDescription = productData.description || '';

    const batchUpsertBody: Square.BatchUpsertCatalogObjectsRequest = {
      batches: [
        {
          objects: [
            {
              type: 'ITEM',
              id: itemId,
              presentAtAllLocations: true,
              itemData: {
                name: productData.title,
                description: enhancedDescription,
                variations: [
                  {
                    type: 'ITEM_VARIATION',
                    id: variationId,
                    presentAtAllLocations: true,
                    itemVariationData: {
                      itemId: itemId,
                      name: productData.title,
                      pricingType: 'FIXED_PRICING',
                      priceMoney: {
                        amount: BigInt(Math.round(productData.price * 100)),
                        currency: 'AUD',
                      },
                      trackInventory: true,
                      inventoryAlertType: 'LOW_QUANTITY',
                      inventoryAlertThreshold: BigInt(5),
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
      idempotencyKey: `create-product-${Date.now()}`,
    };

    let squareResponse;
    try {
              const catalog = await squareClient.catalog();
        squareResponse = await catalog.batchUpsert(batchUpsertBody);
    } catch (error) {
      console.error('Error creating product in Square:', error);
      return NextResponse.json(
        { error: 'Failed to create product in Square' },
        { status: 500 }
      );
    }

    // Also create the product in our database
    const db = new Database('data/porchrecords.db');
    try {
      const now = new Date().toISOString();
      const createdItem = squareResponse.objects?.find((obj: Square.CatalogObject) => obj.type === 'ITEM');
      const createdVariation = createdItem?.itemData?.variations?.[0];
      
      if (createdItem && createdVariation) {
        db.prepare(`
          INSERT INTO products (
            id, title, price, description, image, artist, genre,
            is_preorder, square_id, is_from_square, is_visible, stock_quantity,
            stock_status, product_type, updated_at, created_at, last_synced_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          `square_${createdVariation.id}`,
          productData.title,
          productData.price,
          productData.description || '',
          '/store.webp',
          productData.artist,
          productData.genre || 'Uncategorized',
          0, // is_preorder
          createdVariation.id,
          1, // is_from_square
          productData.isVisible ? 1 : 0,
          10, // stock_quantity
          'in_stock',
          'record',
          now,
          now,
          now
        );
      }
    } finally {
      db.close();
    }

    // Invalidate the products cache so new product appears immediately in the store
    invalidateProductsCache('product creation');

    // Return the created Square product (basic info)
    const createdItem = squareResponse.objects?.find((obj: Square.CatalogObject) => obj.type === 'ITEM');
    return NextResponse.json({
      success: true,
      product: createdItem,
      message: 'Product created in Square and database successfully',
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

// Export POST with sensitive admin authentication (product creation is sensitive)
export const POST = withAdminAuth(postHandler, true); 
import { NextRequest, NextResponse } from 'next/server';
import squareClient from '@/lib/square';
import { StoreProduct } from '@/lib/types';
import { Square } from 'square';
import { withAdminAuth } from '@/lib/route-protection';
import { invalidateProductsCache } from '@/lib/cache-utils';
import Database from 'better-sqlite3';



import { getProductsByLocation } from '@/lib/product-database-utils';

// GET - Fetch all products from database (protected with admin auth)
async function getHandler(request: NextRequest) {
  try {
    // Get all products available at the configured location (including hidden for admin)
    const products = getProductsByLocation(true); // includeHidden = true for admin

    console.log(`📊 Admin: Showing ${products.length} products from database`);
    
    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching products from database:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
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
    const DB_PATH = process.env.DB_PATH || 'data/porchrecords.db';
    const db = new Database(DB_PATH);
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
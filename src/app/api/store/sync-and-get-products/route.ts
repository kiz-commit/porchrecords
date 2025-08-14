import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import squareClient from '@/lib/square';
import { generateUniqueSlug } from '@/lib/slug-utils';

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

// GET - Auto-sync products from Square and return store products
export async function GET(request: NextRequest) {
  const db = new Database('data/porchrecords.db');
  
  try {
    console.log('🔄 Auto-syncing products from Square...');
    
    // Step 1: Fetch ALL products from Square (handle pagination)
    const locationId = process.env.SQUARE_LOCATION_ID;
    let allItems: any[] = [];
    let cursor: string | undefined = undefined;
    do {
      const searchRequest: any = locationId ? { enabledLocationIds: [locationId], cursor } : { cursor };
      const resp = await squareClient.catalog.searchItems(searchRequest);
      if (resp.items) {
        allItems.push(...resp.items);
      }
      cursor = (resp as any).cursor;
    } while (cursor);

    if (allItems.length === 0) {
      console.log('⚠️  No items returned from Square API');
      return NextResponse.json({
        success: true,
        products: [],
        syncedCount: 0,
        message: 'No items to sync'
      });
    }

    console.log(`✅ Fetched ${allItems.length} items from Square`);

    // Step 2: Sync to database
    const insertOrUpdateProduct = db.prepare(`
      INSERT OR REPLACE INTO products (
        id, title, price, description, image, artist, genre, 
        is_preorder, square_id, is_from_square, is_visible,
        stock_quantity, stock_status, product_type, merch_category,
        size, color, mood, format, year, label, image_ids, images,
        preorder_release_date, preorder_quantity, preorder_max_quantity,
        is_variable_pricing, min_price, max_price, created_at,
        updated_at, last_synced_at, square_updated_at, in_stock, slug
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const now = new Date().toISOString();
    let syncedCount = 0;

    // Process items
    const syncedSquareIds: string[] = [];
    for (const item of allItems) {
      try {
        if (item.type !== 'ITEM' || !(item as any).itemData?.variations?.length) {
          continue;
        }

        const itemData = (item as any).itemData;
        const variation = itemData.variations[0];
        
        if (variation.type !== 'ITEM_VARIATION' || !variation.id) {
          continue;
        }

        // Determine product type
        let productType = 'record';
        const description = itemData.description || '';
        const isVoucher = itemData.name?.toLowerCase().includes('voucher') || 
                         description.toLowerCase().includes('voucher');
        
        if (isVoucher) {
          productType = 'voucher';
        } else if (description.includes('merch') || description.includes('Merch')) {
          productType = 'merch';
        }

        // Extract price
        let price = 0;
        if (isVoucher) {
          price = 0;
        } else if (variation.itemVariationData?.priceMoney?.amount) {
          price = Number(variation.itemVariationData.priceMoney.amount) / 100;
        } else {
          const priceMatch = description.match(/\$(\d+(?:\.\d{2})?)/);
          if (priceMatch) {
            price = Number(priceMatch[1]);
          } else {
            price = 19.99;
          }
        }

        // Get image IDs
        const imageIds = itemData.imageIds || [];
        const imageIdsJson = JSON.stringify(imageIds);

        // Fetch image URLs if we have image IDs
        let images = [];
        if (imageIds.length > 0) {
          for (const imageId of imageIds) {
            try {
              const imageResponse = await squareClient.catalog.object.get({ objectId: imageId });
              if (imageResponse.object && imageResponse.object.type === 'IMAGE') {
                const url = (imageResponse.object as any).imageData.url;
                images.push({ id: imageId, url });
              }
            } catch (error) {
              console.error(`Error fetching image ${imageId}:`, error);
            }
          }
        }

        const imagesJson = JSON.stringify(images);
        const mainImage = images.length > 0 ? images[0].url : '/store.webp';

        // Prefer existing product by square_id; fallback to title match only if needed
        let existingProduct = db.prepare('SELECT id, slug, is_visible, title, price, description, genre, product_type, merch_category, size, color FROM products WHERE square_id = ?').get(variation.id) as any;
        if (!existingProduct) {
          existingProduct = db.prepare('SELECT id, slug, is_visible, title, price, description, genre, product_type, merch_category, size, color FROM products WHERE title = ? AND is_from_square = 1').get(itemData.name) as any;
        }
        
        if (existingProduct) {
          // Update existing product instead of creating duplicate
          console.log(`   🔄 Updating existing product: ${itemData.name} (ID: ${existingProduct.id})`);
          
          // Generate slug if it doesn't exist
          let slug = existingProduct.slug;
          if (!slug) {
            const existingSlugs = (db.prepare('SELECT slug FROM products WHERE slug IS NOT NULL AND slug != \'\'').all() as any[])
              .map((row: any) => row.slug);
            slug = generateUniqueSlug(itemData.name || 'No title', 'Unknown Artist', existingSlugs);
          }
          
          // Preserve admin-managed fields; update only Square-derived and operational fields
          const updateProduct = db.prepare(`
            UPDATE products SET 
              image = ?, artist = ?,
              stock_quantity = ?, stock_status = ?,
              image_ids = ?, images = ?,
              updated_at = ?, last_synced_at = ?,
              slug = COALESCE(?, slug),
              square_id = COALESCE(square_id, ?)
            WHERE id = ?
          `);

          updateProduct.run(
            mainImage,
            'Unknown Artist',
            10,
            'in_stock',
            imageIdsJson,
            imagesJson,
            now,
            now,
            slug,
            variation.id,
            existingProduct.id
          );
        } else {
          // Insert new product, default to visible; admin can later edit and we preserve those edits on update
          const productId = `square_${variation.id}`;
          
          // Generate slug for new product
          const existingSlugs = (db.prepare('SELECT slug FROM products WHERE slug IS NOT NULL AND slug != \'\'').all() as any[])
            .map((row: any) => row.slug);
          const slug = generateUniqueSlug(itemData.name || 'No title', 'Unknown Artist', existingSlugs);
          
           // Pull preorder info to seed new records with correct flags
           const preorderInfo = db.prepare(
             `SELECT is_preorder, preorder_release_date, preorder_quantity, preorder_max_quantity FROM preorders WHERE product_id = ?`
           ).get(variation.id) as
             | { is_preorder: number; preorder_release_date: string; preorder_quantity: number; preorder_max_quantity: number }
             | undefined;

           insertOrUpdateProduct.run(
            productId,
            itemData.name || 'No title',
             price,
             description,
            mainImage,
            'Unknown Artist',
            'Uncategorized',
             preorderInfo ? Boolean(preorderInfo.is_preorder) : 0,
            variation.id,
            1, // is_from_square
             1, // is_visible (admin can hide later; preserved on updates)
            10, // stock_quantity
            'in_stock',
            productType,
            '',
            '',
            '',
            '',
            '',
            '',
            '',
            imageIdsJson,
            imagesJson,
             preorderInfo?.preorder_release_date || '',
             preorderInfo?.preorder_quantity ?? 0,
             preorderInfo?.preorder_max_quantity ?? 0,
            0,
            null,
            null,
            now,
            now,
            now,
            now,
            1,
            slug
          );
        }

        // Track this product's Square ID as present in this sync
        syncedSquareIds.push(variation.id);

        syncedCount++;
        console.log(`   ✅ Synced: ${itemData.name}`);

      } catch (error) {
        console.error(`   ❌ Error syncing item:`, error);
      }
    }

    console.log(`✅ Synced ${syncedCount} products to database`);

    // Step 2.5: Hide any Square-sourced products not present in this sync run
    if (syncedSquareIds.length > 0) {
      const placeholders = syncedSquareIds.map(() => '?').join(',');
      const hideStmt = db.prepare(`
        UPDATE products
        SET is_visible = 0
        WHERE is_from_square = 1
          AND (square_id IS NULL OR square_id NOT IN (${placeholders}))
      `);
      const result = hideStmt.run(...syncedSquareIds);
      console.log(`🧹 Hidden ${result.changes ?? 0} products not in current sync set`);
    }

    // Step 3: Return store products (same logic as /api/store/products)
    const { searchParams } = new URL(request.url);
    const includeHidden = searchParams.get('includeHidden') === 'true';
    const productType = searchParams.get('type');
    const genre = searchParams.get('genre');
    const mood = searchParams.get('mood');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build dynamic query
    let whereConditions = ['is_from_square = 1'];
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

    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM products ${whereClause}`;
    const countResult = db.prepare(countQuery).get(...params) as { total: number };
    const totalProducts = countResult.total;

    // Get products
    const query = `
      SELECT 
        id, title, artist, price, description, image, images, image_ids,
        genre, in_stock, is_preorder, is_visible, preorder_release_date,
        preorder_quantity, preorder_max_quantity, product_type, merch_category,
        size, color, mood, stock_quantity, stock_status, is_variable_pricing,
        min_price, max_price, created_at, slug
      FROM products 
      ${whereClause}
      ORDER BY title ASC
      LIMIT ? OFFSET ?
    `;

    params.push(limit, offset);
    const rows = db.prepare(query).all(...params);

    // Transform to StoreProduct format
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

    return NextResponse.json({
      success: true,
      products,
      totalProducts,
      currentPage: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(totalProducts / limit),
      hasMore: offset + limit < totalProducts,
      syncedCount,
      fromDatabase: true,
      autoSynced: true,
      cacheTime: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error in auto-sync:', error);
    
    return NextResponse.json({
      success: false,
      products: [],
      error: errorMessage
    }, { status: 500 });
  } finally {
    db.close();
  }
}

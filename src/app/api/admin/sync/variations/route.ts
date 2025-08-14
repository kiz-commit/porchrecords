import { NextRequest, NextResponse } from 'next/server';
import { SquareClient, SquareEnvironment } from 'square';
import Database from 'better-sqlite3';

export async function POST(request: NextRequest) {
  try {
    const squareClient = new SquareClient({
      token: process.env.SQUARE_ACCESS_TOKEN!,
      environment: process.env.NODE_ENV === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
    });

    const db = new Database('data/porchrecords.db');
    
    try {
      // Optional scoping to a single product via query params
      const url = new URL(request.url);
      const squareIdParam = url.searchParams.get('squareId');
      const productIdParam = url.searchParams.get('productId');

      let merchProducts: any[] = [];
      if (squareIdParam || productIdParam) {
        const row = db.prepare(`
          SELECT id, title, square_id, product_type, merch_category 
          FROM products 
          WHERE (square_id = ? OR id = ?)
        `).get(squareIdParam || '', productIdParam || '') as { id: string; title: string; square_id: string; product_type?: string; merch_category?: string } | undefined;
        if (row && row.product_type === 'merch' && row.square_id) {
          merchProducts = [row];
        } else if (row && row.square_id) {
          // Allow on-demand variation fetch even if product_type not yet set to merch
          merchProducts = [row];
        }
      } else {
        // Get all merch products with Square IDs
        merchProducts = db.prepare(`
          SELECT id, title, square_id, product_type, merch_category 
          FROM products 
          WHERE product_type = 'merch' AND square_id IS NOT NULL AND square_id != ''
        `).all();
      }

      console.log(`Found ${merchProducts.length} merch products to sync variations for`);

      const results: any[] = [];
      const locationId = process.env.SQUARE_LOCATION_ID;

      for (const product of merchProducts) {
        try {
          console.log(`Syncing variations for: ${product.title} (${product.square_id})`);

          // Fetch the object from Square (product.square_id may be a variation ID)
          let objectResponse = await squareClient.catalog.object.get({ objectId: product.square_id });

          // If we were given a variation ID, fetch the parent ITEM
          if (objectResponse.object && objectResponse.object.type === 'ITEM_VARIATION') {
            const parentItemId = (objectResponse.object as any).itemVariationData?.itemId;
            if (parentItemId) {
              objectResponse = await squareClient.catalog.object.get({ objectId: parentItemId });
            }
          }

          if (!objectResponse.object || objectResponse.object.type !== 'ITEM' || !objectResponse.object.itemData?.variations) {
            console.log(`  ⚠️  No variations found for ${product.title}`);
            results.push({
              product: product.title,
              status: 'no_variations',
              message: 'No variations found in Square'
            });
            continue;
          }

          const variations = objectResponse.object.itemData.variations;
          console.log(`  Found ${variations.length} variations for ${product.title}`);

          // Process each variation
          const processedVariations = [];
          for (const variation of variations) {
            if (variation.type !== 'ITEM_VARIATION') continue;

            // Get inventory for this variation
            let stockQuantity = 0;
            let stockStatus = 'out_of_stock';

            if (locationId) {
              try {
                const inventoryResponse = await squareClient.inventory.batchGetCounts({
                  locationIds: [locationId],
                  catalogObjectIds: [variation.id],
                });

                if (inventoryResponse.data && inventoryResponse.data.length > 0) {
                  stockQuantity = Number(inventoryResponse.data[0].quantity) || 0;
                }
              } catch (error) {
                console.error(`    Error fetching inventory for variation ${variation.id}:`, error);
              }
            }

            // Determine stock status
            if (stockQuantity > 10) {
              stockStatus = 'in_stock';
            } else if (stockQuantity > 0) {
              stockStatus = 'low_stock';
            } else {
              stockStatus = 'out_of_stock';
            }

            const price = Number(variation.itemVariationData?.priceMoney?.amount || 0) / 100;

            processedVariations.push({
              id: variation.id,
              name: variation.itemVariationData?.name || 'Default',
              price: price,
              size: variation.itemVariationData?.name || '',
              color: '',
              stockQuantity: stockQuantity,
              stockStatus: stockStatus,
              isAvailable: stockQuantity > 0
            });
          }

          // Store variations in database (persist JSON so admin page can show them later)
          const hasVariations = processedVariations.length > 1;
          const variationCount = processedVariations.length;

          db.prepare(`
            UPDATE products 
            SET has_variations = ?, variation_count = ?, last_variation_sync = ?, variations = ?
            WHERE id = ? OR square_id = ?
          `).run(
            hasVariations ? 1 : 0,
            variationCount,
            new Date().toISOString(),
            JSON.stringify(processedVariations),
            product.id,
            product.square_id
          );

          results.push({
            product: product.title,
            status: 'success',
            variations: processedVariations,
            variationCount: variationCount,
            hasVariations: hasVariations
          });

          console.log(`  ✅ Synced ${variationCount} variations for ${product.title}`);

        } catch (error: any) {
          console.error(`  ❌ Error syncing ${product.title}:`, error);
          results.push({
            product: product.title,
            status: 'error',
            message: error.message
          });
        }
      }

      const summary = {
        totalProducts: merchProducts.length,
        successful: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'error').length,
        noVariations: results.filter(r => r.status === 'no_variations').length,
        results: results
      };

      console.log('Variation sync completed:', summary);

      return NextResponse.json({
        success: true,
        message: `Synced variations for ${summary.successful} products`,
        summary: summary
      });

    } finally {
      db.close();
    }

  } catch (error: any) {
    console.error('Error in variation sync:', error);
    return NextResponse.json(
      { error: 'Failed to sync variations', details: error.message },
      { status: 500 }
    );
  }
}

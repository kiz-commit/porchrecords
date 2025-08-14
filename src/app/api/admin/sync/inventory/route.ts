import { NextRequest, NextResponse } from 'next/server';
import squareClient from '@/lib/square';
import Database from 'better-sqlite3';

// Helper function to get inventory for a specific variation
async function getSquareInventory(variationId: string): Promise<{ quantity: number; status: string }> {
  try {
    const locationId = process.env.SQUARE_LOCATION_ID;
    if (!locationId) {
      return { quantity: 0, status: 'out_of_stock' };
    }

    const inventoryResponse = await squareClient.inventory.batchGetCounts({
      locationIds: [locationId],
      catalogObjectIds: [variationId],
    });
    
    if (inventoryResponse && inventoryResponse.data && inventoryResponse.data.length > 0) {
      const quantity = Number(inventoryResponse.data[0].quantity) || 0;
      const status = quantity === 0 ? 'out_of_stock' : 
                   quantity < 3 ? 'low_stock' : 'in_stock';
      return { quantity, status };
    }
    
    return { quantity: 0, status: 'out_of_stock' };
  } catch (error) {
    console.error('Error fetching Square inventory:', error);
    return { quantity: 0, status: 'out_of_stock' };
  }
}

// POST - Sync inventory levels from Square to local database
export async function POST() {
  const db = new Database('data/porchrecords.db');
  let syncedCount = 0;
  let errorCount = 0;

  try {
    console.log('🔄 Starting inventory sync from Square to local database...');

    // Get all products from our database that are from Square (excluding vouchers)
    const products = db.prepare(`
      SELECT id, square_id, product_type, title
      FROM products 
      WHERE is_from_square = 1 AND product_type != 'voucher'
    `).all() as { id: string; square_id: string; product_type: string; title: string }[];

    console.log(`📦 Found ${products.length} products to sync inventory for`);

    // Prepare update statement
    const updateInventory = db.prepare(`
      UPDATE products 
      SET stock_quantity = ?, stock_status = ?, in_stock = ?, updated_at = ?
      WHERE square_id = ?
    `);

    const now = new Date().toISOString();

    // Process each product
    for (const product of products) {
      try {
        const { quantity, status } = await getSquareInventory(product.square_id);
        
        updateInventory.run(
          quantity,
          status,
          quantity > 0 ? 1 : 0,
          now,
          product.square_id
        );

        console.log(`   ✅ Updated ${product.title}: ${quantity} units (${status})`);
        syncedCount++;

      } catch (error) {
        console.error(`   ❌ Error syncing inventory for ${product.title}:`, error);
        errorCount++;
      }
    }

    console.log(`🎉 Inventory sync completed! Updated: ${syncedCount}, Errors: ${errorCount}`);

    return NextResponse.json({
      success: true,
      syncedCount,
      errorCount,
      message: `Successfully synced inventory for ${syncedCount} products`
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error during inventory sync:', error);
    
    return NextResponse.json({
      success: false,
      syncedCount,
      errorCount,
      error: errorMessage
    }, { status: 500 });
  } finally {
    db.close();
  }
}

// GET - Get inventory sync status
export async function GET() {
  const db = new Database('data/porchrecords.db');
  
  try {
    const inventoryStats = db.prepare(`
      SELECT 
        stock_status,
        COUNT(*) as count
      FROM products 
      WHERE is_from_square = 1 AND product_type != 'voucher'
      GROUP BY stock_status
    `).all();

    const totalProducts = db.prepare(`
      SELECT COUNT(*) as total 
      FROM products 
      WHERE is_from_square = 1 AND product_type != 'voucher'
    `).get() as { total: number };

    const lowStockProducts = db.prepare(`
      SELECT id, title, stock_quantity, stock_status
      FROM products 
      WHERE is_from_square = 1 AND stock_status = 'low_stock'
      ORDER BY stock_quantity ASC
      LIMIT 10
    `).all();

    const outOfStockProducts = db.prepare(`
      SELECT id, title, stock_quantity, stock_status
      FROM products 
      WHERE is_from_square = 1 AND stock_status = 'out_of_stock'
      ORDER BY title ASC
      LIMIT 10
    `).all();

    return NextResponse.json({
      success: true,
      totalProducts: totalProducts.total,
      inventoryStats,
      lowStockProducts,
      outOfStockProducts
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error getting inventory status:', error);
    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  } finally {
    db.close();
  }
}

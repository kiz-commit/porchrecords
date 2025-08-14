import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import squareClient from '@/lib/square';

// GET - Get sync status between Square and local database
export async function GET() {
  const db = new Database('data/porchrecords.db');
  
  try {
    // Get Square products count
    let squareProductCount = 0;
    try {
      const locationId = process.env.SQUARE_LOCATION_ID;
      const searchRequest = locationId 
        ? { enabledLocationIds: [locationId] }
        : {};
      
      const response = await squareClient.catalog.searchItems(searchRequest);
      squareProductCount = response.items?.length || 0;
    } catch (error) {
      console.error('Error fetching Square products:', error);
    }

    // Get database products count
    const dbProductCount = db.prepare('SELECT COUNT(*) as count FROM products WHERE is_from_square = 1').get() as { count: number };

    // Get recent sync info
    const lastSyncInfo = db.prepare(`
      SELECT 
        MAX(last_synced_at) as last_sync,
        COUNT(*) as total_products,
        SUM(CASE WHEN is_visible = 1 THEN 1 ELSE 0 END) as visible_products
      FROM products 
      WHERE is_from_square = 1
    `).get() as { last_sync: string; total_products: number; visible_products: number };

    // Get some example products from both sources
    const dbProducts = db.prepare(`
      SELECT title, square_id, is_visible, last_synced_at 
      FROM products 
      WHERE is_from_square = 1 
      ORDER BY last_synced_at DESC 
      LIMIT 5
    `).all() as any[];

    return NextResponse.json({
      success: true,
      sync: {
        squareProductCount,
        dbProductCount: dbProductCount.count,
        lastSync: lastSyncInfo.last_sync,
        totalProducts: lastSyncInfo.total_products,
        visibleProducts: lastSyncInfo.visible_products,
        syncStatus: squareProductCount === dbProductCount.count ? 'synced' : 'out_of_sync',
        missingProducts: Math.max(0, squareProductCount - dbProductCount.count)
      },
      recentProducts: dbProducts,
      autoSyncEnabled: true,
      autoSyncEndpoint: '/api/store/sync-and-get-products'
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error getting sync status:', error);
    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  } finally {
    db.close();
  }
}
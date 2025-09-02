import { NextRequest, NextResponse } from 'next/server';
import { type StoreProduct } from '@/lib/types';
import { withAdminAuth } from '@/lib/route-protection';
import { invalidateProductsCache } from '@/lib/cache-utils';
import { fetchProductsFromSquareWithRateLimit } from '@/lib/square-api-service';
import { getProductsByLocation } from '@/lib/product-database-utils';
import Database from 'better-sqlite3';



// GET - Fetch all products with inventory data
async function getHandler() {
  try {
    // Try to fetch from Square with proper rate limiting
    const inventoryProducts = await fetchProductsFromSquareWithRateLimit();
    
    console.log(`📊 Inventory: Showing ${inventoryProducts.length} products from Square`);

    return NextResponse.json({ products: inventoryProducts });
  } catch (error) {
    console.error('Error fetching inventory from Square:', error);
    
    // Fallback to database if Square is unavailable
    console.log('⚠️ Falling back to database for inventory');
    try {
      const dbProducts = getProductsByLocation(true); // includeHidden = true for admin
      console.log(`📊 Inventory: Fallback showing ${dbProducts.length} products from database`);
      return NextResponse.json({ products: dbProducts });
    } catch (dbError) {
      console.error('Error fetching products from database fallback:', dbError);
      return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
    }
  }
}

// Export with admin authentication
export const GET = withAdminAuth(getHandler); 
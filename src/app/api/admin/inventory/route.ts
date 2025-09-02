import { NextRequest, NextResponse } from 'next/server';
import squareClient from '@/lib/square';
import { Square } from 'square';
import { type StoreProduct } from '@/lib/types';
import { withAdminAuth } from '@/lib/route-protection';
import { invalidateProductsCache } from '@/lib/cache-utils';
import { fetchProductsFromSquare } from '@/lib/square-inventory-utils';
import Database from 'better-sqlite3';



// GET - Fetch all products with inventory data
async function getHandler() {
  try {
    // Use the shared function to fetch from Square
    const inventoryProducts = await fetchProductsFromSquare();
    
    console.log(`📊 Inventory: Showing ${inventoryProducts.length} products from Square`);

    return NextResponse.json({ products: inventoryProducts });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

// Export with admin authentication
export const GET = withAdminAuth(getHandler); 
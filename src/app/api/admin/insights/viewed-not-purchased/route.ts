import { NextRequest, NextResponse } from 'next/server';
import { getViewedNotPurchasedProducts, initializeAnalyticsTables } from '@/lib/analytics-db';
import { verifyAdminAuth } from '@/lib/admin-security';

// Initialize analytics tables on first use
let tablesInitialized = false;

async function ensureTablesInitialized() {
  if (!tablesInitialized) {
    try {
      await initializeAnalyticsTables();
      tablesInitialized = true;
    } catch (error) {
      console.error('Error initializing analytics tables:', error);
    }
  }
}

export async function GET(req: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyAdminAuth(req);
    if (!authResult.isValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await ensureTablesInitialized();

    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');

    // Get viewed but not purchased products from analytics database
    const products = await getViewedNotPurchasedProducts(limit);

    // Transform data to match frontend expectations
    const transformedProducts = products.map(product => ({
      id: product.id,
      title: product.title,
      views: product.views,
      purchases: product.purchases,
      lastViewed: product.lastViewed,
      squareId: product.squareId
    }));

    return NextResponse.json({
      success: true,
      products: transformedProducts,
      criteria: 'Products with 3+ views and 0 purchases in 14 days',
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching viewed not purchased products:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch viewed not purchased products',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
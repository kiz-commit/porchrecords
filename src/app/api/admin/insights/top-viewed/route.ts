import { NextRequest, NextResponse } from 'next/server';
import { getTopViewedProducts, initializeAnalyticsTables } from '@/lib/analytics-db';
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
    const range = url.searchParams.get('range') as 'weekly' | 'monthly' || 'weekly';
    const limit = parseInt(url.searchParams.get('limit') || '10');

    // Get top viewed products from analytics database
    const products = await getTopViewedProducts(range, limit);

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
      range,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching top viewed products:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch top viewed products',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
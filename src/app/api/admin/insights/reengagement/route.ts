import { NextRequest, NextResponse } from 'next/server';
import { getReengagementItems, initializeAnalyticsTables } from '@/lib/analytics-db';
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

    // Get re-engagement items from analytics database
    const items = await getReengagementItems(limit);

    return NextResponse.json({
      success: true,
      items,
      criteria: 'Products with 2+ views and 1+ days since last view',
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching reengagement items:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch reengagement items',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
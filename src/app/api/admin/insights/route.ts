import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsSummary, initializeAnalyticsTables } from '@/lib/analytics-db';
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

    // Get analytics summary from database
    const summary = await getAnalyticsSummary(range);

    return NextResponse.json({
      success: true,
      summary,
      range,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching analytics summary:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch analytics summary',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}
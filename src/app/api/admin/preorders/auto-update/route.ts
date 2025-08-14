import { NextRequest, NextResponse } from 'next/server';
import { releaseMaturedPreorders, getPreordersByStatus } from '@/lib/preorder-utils';

/**
 * API endpoint to automatically update preorder statuses
 * This should be called periodically (e.g., daily via cron job)
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Starting automatic preorder status update...');
    
    // Release preorders that have reached their release date
    const releasedProductIds = await releaseMaturedPreorders();
    
    // Get statistics about the update
    const activePreorders = await getPreordersByStatus('active');
    const releasedPreorders = await getPreordersByStatus('released');
    
    const updateStats = {
      releasedCount: releasedProductIds.length,
      releasedProductIds,
      totalActivePreorders: activePreorders.length,
      totalReleasedPreorders: releasedPreorders.length,
      timestamp: new Date().toISOString(),
    };
    
    console.log('Preorder status update completed:', updateStats);
    
    return NextResponse.json({
      success: true,
      message: 'Preorder statuses updated successfully',
      stats: updateStats,
    });
  } catch (error) {
    console.error('Failed to update preorder statuses:', error);
    return NextResponse.json(
      { error: 'Failed to update preorder statuses' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check what would be updated without making changes
 */
export async function GET() {
  try {
    const { getDatabase } = await import('@/lib/database');
    const db = await getDatabase();
    
    // Get preorders that would be released
    const maturedPreorders = await db.all(`
      SELECT 
        product_id as productId,
        preorder_release_date as preorderReleaseDate
      FROM preorders 
      WHERE is_preorder = 1 
      AND DATE(preorder_release_date) <= DATE('now')
    `);
    
    const stats = {
      preordersToRelease: maturedPreorders.length,
      products: maturedPreorders,
      currentDate: new Date().toISOString().split('T')[0],
    };
    
    return NextResponse.json({
      success: true,
      message: 'Preview of preorder status updates',
      stats,
    });
  } catch (error) {
    console.error('Failed to preview preorder status updates:', error);
    return NextResponse.json(
      { error: 'Failed to preview preorder status updates' },
      { status: 500 }
    );
  }
}
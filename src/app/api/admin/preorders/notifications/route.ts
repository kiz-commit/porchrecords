import { NextRequest, NextResponse } from 'next/server';
import {
  generateUpcomingReleaseNotifications,
  generateReleaseNotifications,
  processPendingNotifications,
  getNotificationStats,
} from '@/lib/preorder-notifications';
import { getPreordersReleasingSoon, calculateDaysUntilRelease } from '@/lib/preorder-utils';

/**
 * POST - Generate and process preorder notifications
 */
export async function POST(request: NextRequest) {
  try {
    const { action, daysAhead, releasedProductIds } = await request.json();

    let notifications: any[] = [];
    let message = '';

    switch (action) {
      case 'generate_upcoming':
        notifications = await generateUpcomingReleaseNotifications(daysAhead || 3);
        message = `Generated ${notifications.length} upcoming release notifications`;
        break;

      case 'generate_released':
        if (!releasedProductIds || !Array.isArray(releasedProductIds)) {
          return NextResponse.json(
            { error: 'Released product IDs array is required for this action' },
            { status: 400 }
          );
        }
        notifications = await generateReleaseNotifications(releasedProductIds);
        message = `Generated ${notifications.length} release notifications`;
        break;

      case 'process_pending':
        // In a real implementation, you would load pending notifications from a database
        const pendingNotifications: any[] = []; // Placeholder
        const results = await processPendingNotifications(pendingNotifications);
        return NextResponse.json({
          success: true,
          message: `Processed notifications: ${results.sent} sent, ${results.failed} failed`,
          results,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: generate_upcoming, generate_released, or process_pending' },
          { status: 400 }
        );
    }

    const stats = getNotificationStats(notifications);

    console.log('Generated preorder notifications:', { action, message, stats });

    return NextResponse.json({
      success: true,
      message,
      notifications,
      stats,
    });
  } catch (error) {
    console.error('Failed to handle preorder notifications:', error);
    return NextResponse.json(
      { error: 'Failed to handle preorder notifications' },
      { status: 500 }
    );
  }
}

/**
 * GET - Get notification preview and statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const daysAhead = parseInt(searchParams.get('daysAhead') || '7');

    // Get preorders releasing soon
    const upcomingPreorders = await getPreordersReleasingSoon(daysAhead);

    // Generate preview notifications (without scheduling them)
    const previewNotifications = await generateUpcomingReleaseNotifications(daysAhead);

    const preview = {
      daysAhead,
      upcomingPreorders: upcomingPreorders.length,
      potentialNotifications: previewNotifications.length,
      preorders: upcomingPreorders.map(preorder => ({
        productId: preorder.productId,
        releaseDate: preorder.preorderReleaseDate,
        daysUntilRelease: calculateDaysUntilRelease(preorder.preorderReleaseDate),
        currentOrders: preorder.preorderQuantity,
        maxOrders: preorder.preorderMaxQuantity,
      })),
    };

    return NextResponse.json({
      success: true,
      preview,
    });
  } catch (error) {
    console.error('Failed to get notification preview:', error);
    return NextResponse.json(
      { error: 'Failed to get notification preview' },
      { status: 500 }
    );
  }
}
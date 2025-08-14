import { NextRequest, NextResponse } from 'next/server';
import squareClient from '@/lib/square';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ref = searchParams.get('ref');

    if (!ref) {
      return NextResponse.json({ error: 'ref query parameter is required' }, { status: 400 });
    }

    const locationId = process.env.SQUARE_LOCATION_ID;
    if (!locationId) {
      throw new Error('SQUARE_LOCATION_ID environment variable is required');
    }

    // Try direct reference filter (may not be supported in all SDK versions)
    let order: any = null;
    try {
      const searchRequest: any = {
        locationIds: [locationId],
        query: {
          filter: {
            referenceIdFilter: {
              referenceId: ref
            }
          }
        }
      };
      const response: any = await (squareClient as any).orders.search(searchRequest);
      if (response?.orders && response.orders.length > 0) {
        order = response.orders[0];
      }
    } catch {}

    // Fallback: fetch a batch of recent orders and filter by referenceId locally
    if (!order) {
      try {
        const fallbackReq: any = {
          locationIds: [locationId],
          limit: 100
        };
        const respFallback: any = await (squareClient as any).orders.search(fallbackReq);
        if (respFallback?.orders && respFallback.orders.length > 0) {
          order = respFallback.orders.find((o: any) => (o?.referenceId || '').toString() === ref);
        }
      } catch (e) {
        console.error('lookup-by-ref fallback search failed:', e);
      }
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found for reference id' }, { status: 404 });
    }

    return NextResponse.json({ success: true, orderId: order.id, order });
  } catch (error: any) {
    console.error('lookup-by-ref error:', error);
    const message = (error && (error.message || error.toString())) || 'Failed to lookup order by reference id';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}



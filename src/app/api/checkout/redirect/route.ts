import { NextRequest, NextResponse } from 'next/server';
import squareClient from '@/lib/square';

// This endpoint is used as the redirect_url for Square hosted checkout.
// It guarantees we redirect the buyer to /store/success?orderId=... even if Square
// does not append orderId in the sandbox environment.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ref = searchParams.get('ref');

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // If Square provided an orderId already, pass it through
    const squareOrderId = searchParams.get('orderId');
    if (squareOrderId) {
      return NextResponse.redirect(`${baseUrl}/store/success?orderId=${encodeURIComponent(squareOrderId)}`);
    }

    // Otherwise, look up by our reference id
    if (ref) {
      const locationId = process.env.SQUARE_LOCATION_ID;
      if (!locationId) throw new Error('SQUARE_LOCATION_ID is required');

      // Try reference filter first
      let orderId: string | null = null;
      try {
        const resp: any = await (squareClient as any).orders.search({
          locationIds: [locationId],
          query: { filter: { referenceIdFilter: { referenceId: ref } } }
        });
        orderId = resp?.orders?.[0]?.id || null;
      } catch {}

      // Fallback: fetch a page and filter locally
      if (!orderId) {
        try {
          const fallback: any = await (squareClient as any).orders.search({ locationIds: [locationId], limit: 100 });
          const found = (fallback?.orders || []).find((o: any) => (o?.referenceId || '') === ref);
          orderId = found?.id || null;
        } catch {}
      }

      if (orderId) {
        return NextResponse.redirect(`${baseUrl}/store/success?orderId=${encodeURIComponent(orderId)}`);
      }
    }

    // If all else fails, go to success without id so the page shows a friendly error
    return NextResponse.redirect(`${baseUrl}/store/success`);
  } catch (e) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${baseUrl}/store/success`);
  }
}



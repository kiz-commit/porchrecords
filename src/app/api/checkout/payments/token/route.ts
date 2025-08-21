import { NextRequest, NextResponse } from 'next/server';
import squareClient from '@/lib/square';

/**
 * Generates a payment token (aka paymentIdempotencyKey and order linkage) for Web Payments SDK.
 * The client will use this token with Square.payments to tokenize and confirm payment.
 */
export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();
    if (!orderId) {
      return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
    }

    const locationId = process.env.SQUARE_LOCATION_ID;
    const applicationId = process.env.SQUARE_APPLICATION_ID;
    const environment = (process.env.SQUARE_ENVIRONMENT || 'sandbox').toLowerCase();
    if (!locationId || !applicationId) {
      return NextResponse.json({ error: 'Square env not configured' }, { status: 500 });
    }

    // Guard against common env mismatch: sandbox app id with production server env (or vice versa)
    const isSandboxAppId = applicationId.startsWith('sandbox-');
    if ((environment === 'production' && isSandboxAppId) || (environment !== 'production' && !isSandboxAppId)) {
      return NextResponse.json({
        error: 'Environment mismatch: applicationId and SQUARE_ENVIRONMENT do not align. Use matching sandbox or production credentials.',
        details: { applicationIdPrefix: applicationId.split('-')[0], environment }
      }, { status: 400 });
    }

    // Optionally fetch order to verify existence
    try {
      const orders = await squareClient.orders();
      await orders.search({
        locationIds: [locationId],
        query: { filter: { orderIdFilter: { orderIds: [orderId] } } }
      } as any);
    } catch (e) {
      // Continue; not fatal if search fails in sandbox
      console.warn('Order verification failed (continuing):', e);
    }

    // Verify the provided locationId exists in this environment (best-effort; API surface may vary by SDK version)
    try {
      const locsResp: any = await (squareClient as any).locationsApi?.listLocations?.();
      const locations = locsResp?.result?.locations || locsResp?.locations || [];
      const found = locations.some((l: any) => l?.id === locationId);
      if (!found && Array.isArray(locations) && locations.length > 0) {
        return NextResponse.json({
          error: 'The configured SQUARE_LOCATION_ID does not exist in the current environment. Use a sandbox location when using a sandbox application ID.',
          details: { locationId, environment }
        }, { status: 400 });
      }
    } catch (e) {
      // If locations API fails, continue; the SDK will still error if mismatched
      console.warn('Locations verification failed (non-fatal):', e);
    }

    // Generate a compact idempotency key (Square limit: <= 45 chars)
    const ts = Date.now().toString(36);
    const rand = Math.random().toString(36).slice(2, 10);
    const orderFrag = String(orderId).replace(/[^a-zA-Z0-9]/g, '').slice(0, 12);
    const idemRaw = `pay-${orderFrag}-${ts}-${rand}`;
    const idempotencyKey = idemRaw.slice(0, 45);
    return NextResponse.json({
      success: true,
      applicationId,
      locationId,
      orderId,
      idempotencyKey,
      environment
    });
  } catch (error: any) {
    console.error('Payment token error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create payment token' }, { status: 500 });
  }
}



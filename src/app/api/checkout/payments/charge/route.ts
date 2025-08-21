import { NextRequest, NextResponse } from 'next/server';
import squareClient from '@/lib/square';
import { getCustomerByEmail, upsertCustomerByEmail } from '@/lib/square-customer';

/**
 * Complete payment using Web Payments SDK token (sourceId) against an existing Order.
 * Handles inventory finalization for physical items and preorder quantity updates.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { orderId, sourceId, customerId = undefined, idempotencyKey } = body || {};

    const locationId = process.env.SQUARE_LOCATION_ID;
    if (!locationId) return NextResponse.json({ error: 'SQUARE_LOCATION_ID not set' }, { status: 500 });

    if (!orderId || !sourceId || !idempotencyKey) {
      return NextResponse.json({ error: 'orderId, sourceId, idempotencyKey are required' }, { status: 400 });
    }

    // Optionally ensure order exists
    try {
      const orders = await squareClient.orders();
      await orders.search({
        locationIds: [locationId],
        query: { filter: { orderIdFilter: { orderIds: [orderId] } } }
      } as any);
    } catch (e) {
      console.warn('Order lookup failed (continuing):', e);
    }

    // Fetch order total to satisfy Payments API requirement for amount_money
    let amountCents: number | bigint | null = null;
    let orderBuyerEmail: string | undefined = undefined;
    try {
      const ord = await (squareClient as any).orders.search({
        locationIds: [locationId],
        query: { filter: { orderIdFilter: { orderIds: [orderId] } } }
      });
      const foundOrder: any = ord?.orders?.[0];
      const totalA = foundOrder?.totalMoney?.amount ?? foundOrder?.total_money?.amount;
      orderBuyerEmail = foundOrder?.buyerEmailAddress || foundOrder?.buyer_email_address;
      // If order has a linked customer, prefer that id
      if (!customerId && (foundOrder?.customerId || foundOrder?.customer_id)) {
        customerId = foundOrder.customerId || foundOrder.customer_id;
      }
      if (typeof totalA === 'bigint') {
        amountCents = totalA;
      } else if (Number.isFinite(Number(totalA))) {
        amountCents = Math.round(Number(totalA));
      }
    } catch (e) {
      console.warn('Unable to fetch order total; will attempt payment with provided amount:', e);
    }

    if (!(typeof amountCents === 'bigint' || Number.isFinite(Number(amountCents)))) {
      return NextResponse.json({ error: 'Unable to determine order total for payment' }, { status: 400 });
    }

    // If still no customerId but we have an email, upsert a customer for linkage
    if (!customerId && orderBuyerEmail) {
      try {
        const c = await upsertCustomerByEmail({ emailAddress: orderBuyerEmail });
        if (c?.id) customerId = c.id;
      } catch {}
    }

    // Create payment, including required amount_money
    const paymentBody: any = {
      idempotencyKey,
      sourceId,
      locationId,
      orderId,
      amountMoney: { amount: (typeof amountCents === 'bigint' ? amountCents : BigInt(Math.round(Number(amountCents)))), currency: 'AUD' },
      autocomplete: true,
      customerId: customerId || undefined
    };

    const paymentResp: any = await (squareClient as any).payments.create(paymentBody);
    const payment = paymentResp?.payment;
    if (!payment?.id) {
      return NextResponse.json({ error: 'Payment failed' }, { status: 502 });
    }

    // Fetch order to inspect line items for inventory finalization and preorder updates
    let order: any = null;
    try {
      const ordersApi = await squareClient.orders();
      const ord = await ordersApi.search({
        locationIds: [locationId],
        query: { filter: { orderIdFilter: { orderIds: [orderId] } } }
      } as any);
      order = ord?.orders?.[0] || null;
    } catch {}

    // Finalize inventory: IN_STOCK -> SOLD for physical items
    if (order && Array.isArray(order.lineItems)) {
      const changes: any[] = [];
      const nowIso = new Date().toISOString();
      for (const li of order.lineItems) {
        const catalogObjectId = li.catalogObjectId || (li as any).catalog_object_id;
        const q = parseInt(String(li.quantity ?? '1')) || 1;
        if (!catalogObjectId || !Number.isFinite(q) || q <= 0) continue;
        changes.push({
          type: 'ADJUSTMENT',
          adjustment: {
            catalogObjectId,
            locationId,
            fromState: 'IN_STOCK',
            toState: 'SOLD',
            quantity: String(q),
            occurredAt: nowIso,
            reason: `Order ${orderId} payment ${payment.id}`
          }
        });
      }
      if (changes.length) {
        try {
          const inventory = await squareClient.inventory();
          await inventory.batchCreateChanges({ idempotencyKey: `finalize-${orderId}-${Date.now()}`, changes } as any);
        } catch (e) {
          console.warn('Inventory finalize failed:', e);
        }
      }
    }

    // Preorder updates via existing endpoint (best-effort, loop items)
    try {
      if (order && Array.isArray(order.lineItems)) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        for (const li of order.lineItems) {
          const catalogObjectId = li.catalogObjectId || (li as any).catalog_object_id;
          const q = parseInt(String(li.quantity ?? '1')) || 1;
          if (!catalogObjectId || !Number.isFinite(q) || q <= 0) continue;
          try {
            const resp = await fetch(`${baseUrl}/api/admin/preorders/update-quantity`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ productId: String(catalogObjectId), quantityChange: q, orderId })
            });
            // Ignore 404 (not a preorder) and other non-fatal issues
          } catch {}
        }
      }
    } catch {}

    return NextResponse.json({ success: true, paymentId: payment.id, status: payment.status });
  } catch (error: any) {
    console.error('Charge error:', error);
    return NextResponse.json({ error: error?.message || 'Payment failed' }, { status: 500 });
  }
}



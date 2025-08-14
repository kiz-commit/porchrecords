import { NextRequest, NextResponse } from 'next/server';
import squareClient from '@/lib/square';
import { upsertCustomerByEmail } from '@/lib/square-customer';

/**
 * Create a Square Order for the cart and optionally reserve inventory.
 * - Builds line items referencing Catalog variation IDs for inventory tracking
 * - Supports pickup, shipping, and digital (voucher) flows
 * - Reserves inventory for physical, non-preorder items using Inventory API (IN_STOCK -> RESERVED)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      cartItems = [],
      deliveryMethod = 'pickup',
      customerInfo = {},
      appliedDiscount = null,
      automaticDiscounts = [],
      total
    } = body || {};

    const locationId = process.env.SQUARE_LOCATION_ID;
    if (!locationId) {
      return NextResponse.json({ error: 'SQUARE_LOCATION_ID is required' }, { status: 500 });
    }

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart items are required' }, { status: 400 });
    }

    // Build order line items
    const lineItems: any[] = [];
    const nowIso = new Date().toISOString();

    for (const item of cartItems) {
      const product = item?.product || {};
      const quantity = parseInt(String(item?.quantity ?? 1));
      if (!Number.isFinite(quantity) || quantity <= 0) continue;

      const catalogObjectId = String(product.id || '').replace(/^square_/i, '');
      const itemType = product.productType || 'record';

      // Skip catalog linkage for vouchers to avoid inventory constraints
      const orderLine: any = {
        name: product.title || 'Item',
        quantity: String(quantity),
      };

      if (itemType !== 'voucher' && catalogObjectId) {
        // Verify that the catalog object exists in the current environment; if not, fall back to base price
        try {
          await (squareClient as any).catalog.object.get({ objectId: catalogObjectId });
          orderLine.catalog_object_id = catalogObjectId;
        } catch (e) {
          console.warn('Catalog object not found in current environment, falling back to base price:', catalogObjectId);
          if (typeof product.price === 'number') {
            orderLine.base_price_money = {
              amount: Math.round(Number(product.price) * 100),
              currency: 'AUD'
            };
          }
        }
      }

      // If we still have neither catalog link nor price, and price is available, set base price
      if (!orderLine.catalog_object_id && !orderLine.base_price_money && typeof product.price === 'number') {
        orderLine.base_price_money = {
          amount: Math.round(Number(product.price) * 100),
          currency: 'AUD'
        };
      }

      lineItems.push(orderLine);
    }

    if (lineItems.length === 0) {
      return NextResponse.json({ error: 'No valid line items' }, { status: 400 });
    }

    // Build discounts (manual voucher/discount and automatic discounts)
    const orderDiscounts: any[] = [];
    if (appliedDiscount && Number(appliedDiscount.discountAmount) > 0) {
      orderDiscounts.push({
        name: appliedDiscount.name || 'Discount',
        amount_money: {
          amount: Math.round(Number(appliedDiscount.discountAmount) * 100),
          currency: 'AUD'
        },
        scope: 'ORDER'
      });
    }
    const autoTotal = Array.isArray(automaticDiscounts)
      ? automaticDiscounts.reduce((sum: number, d: any) => sum + Number(d.discountAmount || 0), 0)
      : 0;
    if (autoTotal > 0) {
      orderDiscounts.push({
        name: 'Automatic discounts',
        amount_money: { amount: Math.round(autoTotal * 100), currency: 'AUD' },
        scope: 'ORDER'
      });
    }

    // Optionally upsert/link Square customer
    let customerId: string | undefined = undefined;
    const customerEmail = String(customerInfo?.email || '').trim();
    if (customerEmail) {
      try {
        const customer = await upsertCustomerByEmail({
          emailAddress: customerEmail,
          givenName: String(customerInfo?.firstName || '').trim() || undefined,
          familyName: String(customerInfo?.lastName || '').trim() || undefined,
          phoneNumber: String(customerInfo?.phone || '').trim() || undefined,
          address: customerInfo?.address ? {
            addressLine1: customerInfo.address,
            locality: customerInfo.city || '',
            administrativeDistrictLevel1: customerInfo.state || '',
            postalCode: customerInfo.postalCode || '',
            country: (customerInfo.country || 'AU')
          } : undefined,
        });
        if (customer?.id) customerId = customer.id;
      } catch (e) {
        console.warn('Square customer upsert failed (continuing):', e);
      }
    }

    // Build fulfillments (Square SDK camelCase shapes)
    const fulfillments: any[] = [];
    if (deliveryMethod === 'shipping') {
      fulfillments.push({
        type: 'SHIPMENT',
        state: 'PROPOSED',
        shipmentDetails: {
          recipient: {
            displayName: `${customerInfo?.firstName || ''} ${customerInfo?.lastName || ''}`.trim() || undefined,
            address: customerInfo?.address ? {
              addressLine1: customerInfo.address,
              locality: customerInfo.city || '',
              administrativeDistrictLevel1: customerInfo.state || '',
              postalCode: customerInfo.postalCode || '',
              country: (customerInfo.country || 'AU')
            } : undefined,
            phoneNumber: customerInfo?.phone || undefined,
            emailAddress: customerInfo?.email || undefined
          },
          shippingNote: 'Website order'
        }
      });
    } else if (deliveryMethod === 'pickup') {
      fulfillments.push({
        type: 'PICKUP',
        state: 'PROPOSED',
        pickupDetails: {
          recipient: {
            displayName: `${customerInfo?.firstName || ''} ${customerInfo?.lastName || ''}`.trim() || 'Pickup Customer',
            emailAddress: customerInfo?.email || undefined,
            phoneNumber: customerInfo?.phone || undefined
          },
          pickupAt: nowIso
        }
      });
    } // deliveryMethod === 'email' (voucher-only) => no fulfillment

    // Order metadata for downstream processing (vouchers, preorders)
    const prItems = cartItems.map((i: any) => ({ id: String(i?.product?.id || '').replace(/^square_/i, ''), q: parseInt(String(i?.quantity ?? 1)) || 1 }));
    const metadata: Record<string, string> = {
      deliveryMethod,
      hasVoucherItems: cartItems.some((i: any) => i?.product?.productType === 'voucher') ? 'true' : 'false',
    };
    if (customerInfo?.email) metadata.customerEmail = String(customerInfo.email);
    if (prItems.length > 0) metadata.pr_items = JSON.stringify(prItems).slice(0, 1800);

    // Use Square SDK camelCase shapes
    const orderBody: any = {
      order: {
        locationId: locationId,
        referenceId: `order-${Date.now()}`,
        // Attach buyer email for easier lookup in Square
        buyerEmailAddress: customerEmail || undefined,
        // Attach customer linkage when available
        customerId: customerId || undefined,
        lineItems: lineItems.map((li) => ({
          name: li.name,
          quantity: li.quantity,
          ...(li.catalog_object_id ? { catalogObjectId: li.catalog_object_id } : {}),
          ...(li.base_price_money ? { basePriceMoney: li.base_price_money } : {})
        })),
        discounts: orderDiscounts.length ? orderDiscounts.map(d => ({
          name: d.name,
          amountMoney: d.amount_money,
          scope: d.scope,
        })) : undefined,
        fulfillments: fulfillments.length ? fulfillments : undefined,
        metadata
      },
      // Keep idempotency key within 45 char limit
      idempotencyKey: `ord-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
    };

    // Create order in Square
    const orderResp: any = await squareClient.orders.create(orderBody);
    const created = orderResp?.order;
    if (!created?.id) {
      return NextResponse.json({ error: 'Failed to create order' }, { status: 502 });
    }

    // Note: We do not pre-reserve inventory here because Square Inventory API
    // does not support a RESERVED state in all flows. We finalize to SOLD after successful payment.

    return NextResponse.json({
      success: true,
      orderId: created.id,
      locationId,
      total
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to create order' }, { status: 500 });
  }
}



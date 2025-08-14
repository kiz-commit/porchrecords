import { NextRequest, NextResponse } from 'next/server';
import squareClient from '@/lib/square';
import { withAdminAuth } from '@/lib/route-protection';

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log('Fetching order details:', { orderId: id });

    // Validate required environment variables
    const locationId = process.env.SQUARE_LOCATION_ID;
    if (!locationId) {
      throw new Error('SQUARE_LOCATION_ID environment variable is required');
    }

    // Fetch real order data from Square
    const searchRequest = {
      locationIds: [locationId],
      filter: {
        orderIds: [id]
      }
    };
    
    const searchResponse = await squareClient.orders.search(searchRequest);
    
    if (!searchResponse.orders || searchResponse.orders.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    const order = searchResponse.orders[0];

    // Proactively update preorder counts when the order has a successful tender (paid)
    try {
      const isPaidOrder = Array.isArray(order.tenders) && order.tenders.length > 0;
      if (isPaidOrder && Array.isArray(order.lineItems) && order.lineItems.length > 0) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        for (const item of order.lineItems as any[]) {
          const catalogObjectId = (item as any).catalogObjectId;
          const qty = parseInt(String((item as any).quantity || '1'));
          if (catalogObjectId && Number.isFinite(qty) && qty > 0) {
            try {
              const resp = await fetch(`${baseUrl}/api/admin/preorders/update-quantity`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: String(catalogObjectId), quantityChange: qty, orderId: order.id })
              });
              const json = await resp.json().catch(() => ({}));
              console.log('Preorder update from admin order view:', {
                ok: resp.ok,
                status: resp.status,
                productId: String(catalogObjectId),
                qty,
                alreadyApplied: json?.alreadyApplied || false
              });
            } catch (e) {
              console.warn('Failed to update preorder from admin order view:', e);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Preorder update attempt skipped:', e);
    }
    
    // Process line items
    const lineItems = (order.lineItems || []).map((item: any) => ({
      name: item.name,
      quantity: item.quantity,
      basePriceMoney: item.basePriceMoney ? {
        amount: item.basePriceMoney.amount ? item.basePriceMoney.amount.toString() : '0',
        currency: item.basePriceMoney.currency
      } : null
    }));
    
    // Process payment information from tenders
    const payment = order.tenders && order.tenders.length > 0 ? {
      id: order.tenders[0].id,
      status: 'COMPLETED', // Assume completed if tender exists
      amount: order.tenders[0].amountMoney ? {
        amount: order.tenders[0].amountMoney.amount ? order.tenders[0].amountMoney.amount.toString() : '0',
        currency: order.tenders[0].amountMoney.currency
      } : null,
      createdAt: order.tenders[0].createdAt,
      receiptUrl: `https://squareup.com/receipt/preview/${order.tenders[0].id}`
    } : null;
    
    const processedOrder = {
      id: order.id || '',
      orderNumber: order.referenceId || `ORD-${(order.id || '').slice(-6).toUpperCase()}`,
      state: order.state,
      totalMoney: order.totalMoney ? {
        amount: order.totalMoney.amount ? order.totalMoney.amount.toString() : '0',
        currency: order.totalMoney.currency
      } : null,
      totalTaxMoney: order.totalTaxMoney ? {
        amount: order.totalTaxMoney.amount ? order.totalTaxMoney.amount.toString() : '0',
        currency: order.totalTaxMoney.currency
      } : null,
      totalDiscountMoney: order.totalDiscountMoney ? {
        amount: order.totalDiscountMoney.amount ? order.totalDiscountMoney.amount.toString() : '0',
        currency: order.totalDiscountMoney.currency
      } : null,
      totalTipMoney: order.totalTipMoney ? {
        amount: order.totalTipMoney.amount ? order.totalTipMoney.amount.toString() : '0',
        currency: order.totalTipMoney.currency
      } : null,
      lineItems,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      customerId: order.customerId,
      fulfillment: order.fulfillments || [],
      payment,
      // Calculated fields for easier display
      totalAmount: order.totalMoney ? Number(order.totalMoney.amount) / 100 : 0,
      itemCount: lineItems.reduce((sum: number, item: { quantity: string }) => sum + Number(item.quantity), 0),
      status: order.state,
      isPaid: payment ? payment.status === 'COMPLETED' : false,
      isFulfilled: (order.fulfillments || []).some((f: any) => f.state === 'COMPLETED')
    };

    return NextResponse.json({
      order: processedOrder
    });

  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// Export with admin authentication
export const GET = withAdminAuth(getHandler); 
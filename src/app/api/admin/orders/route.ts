import { NextRequest, NextResponse } from 'next/server';
import squareClient from '@/lib/square';
import { withAdminAuth } from '@/lib/route-protection';

async function getHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const cursor = searchParams.get('cursor');

    // Validate required environment variables
    const locationId = process.env.SQUARE_LOCATION_ID;
    if (!locationId) {
      throw new Error('SQUARE_LOCATION_ID environment variable is required');
    }

    console.log('Fetching orders from Square:', { status, limit, cursor });

    // Build the search request with correct state string
    const searchRequest: any = {
      locationIds: [locationId],
      limit,
      cursor: cursor || undefined,
      query: status && status !== 'all' ? {
        filter: {
          stateFilter: {
            states: [status.toUpperCase()]
          }
        }
      } : undefined
    };

    const ordersApi = await squareClient.orders();
    const response = await ordersApi.search(searchRequest);
    const orders = (response.orders || []).map((order: any) => {
      const lineItems = (order.lineItems || []).map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        basePriceMoney: item.basePriceMoney ? {
          amount: item.basePriceMoney.amount ? item.basePriceMoney.amount.toString() : '0',
          currency: item.basePriceMoney.currency
        } : null
      }));
      const payment = order.tenders && order.tenders.length > 0 ? {
        id: order.tenders[0].id,
        status: order.tenders[0].status || 'COMPLETED',
        amount: order.tenders[0].amountMoney ? {
          amount: order.tenders[0].amountMoney.amount ? order.tenders[0].amountMoney.amount.toString() : '0',
          currency: order.tenders[0].amountMoney.currency
        } : null,
        createdAt: order.tenders[0].createdAt,
        receiptUrl: order.tenders[0].receiptUrl || ''
      } : null;
      return {
        id: order.id,
        orderNumber: order.referenceId || `ORD-${order.id.slice(-6).toUpperCase()}`,
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
        totalAmount: order.totalMoney ? Number(order.totalMoney.amount) / 100 : 0,
        itemCount: lineItems.reduce((sum: number, item: { quantity: string }) => sum + Number(item.quantity), 0),
        status: order.state,
        isPaid: payment ? payment.status === 'COMPLETED' : false,
        isFulfilled: (order.fulfillments || []).some((f: any) => f.state === 'COMPLETED')
      };
    });

    return NextResponse.json({
      orders,
      cursor: response.cursor || null,
      totalCount: orders.length
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

// Export with admin authentication
export const GET = withAdminAuth(getHandler); 
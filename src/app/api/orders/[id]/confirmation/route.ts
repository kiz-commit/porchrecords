import { NextRequest, NextResponse } from 'next/server';
import squareClient from '@/lib/square';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    console.log('Fetching order confirmation:', { orderId: id, paymentId });

    // Validate required environment variables
    const locationId = process.env.SQUARE_LOCATION_ID;
    if (!locationId) {
      throw new Error('SQUARE_LOCATION_ID environment variable is required');
    }

    // Fetch real order data from Square
    console.log('Attempting to fetch order from Square:', id);
    
    let orderData = null;
    let paymentData = null;
    
    try {
      // Fetch order data from Square using search API (correct query structure)
      const searchRequest: any = {
        locationIds: [locationId],
        query: {
          filter: {
            orderIdFilter: {
              orderIds: [id]
            }
          }
        }
      };

      const searchResponse: any = await (squareClient as any).orders.search(searchRequest);
      
      if (!searchResponse.orders || searchResponse.orders.length === 0) {
        throw new Error('Order not found');
      }
      
      orderData = searchResponse.orders[0];
      console.log('Order data retrieved from Square:', {
        orderId: orderData.id,
        state: orderData.state,
        totalAmount: orderData.totalMoney?.amount
      });
      
      // Try to fetch payment data from the order's tenders
      if (orderData.tenders && orderData.tenders.length > 0) {
        const tender = orderData.tenders[0];
        paymentData = {
          id: tender.id,
          status: 'COMPLETED', // Tender status is typically COMPLETED when order is paid
          receiptUrl: `/api/orders/${id}/receipt?paymentId=${tender.id}`,
          totalMoney: orderData.totalMoney // Use order total since tender doesn't have totalMoney
        };
        console.log('Payment data found from order tenders:', {
          paymentId: paymentData.id,
          status: paymentData.status
        });
      } else if (paymentId) {
        // Fallback to paymentId parameter if no tenders found
        paymentData = {
          id: paymentId,
          status: 'COMPLETED',
          receiptUrl: `/api/orders/${id}/receipt?paymentId=${paymentId}`,
          totalMoney: orderData.totalMoney
        };
        console.log('Payment data prepared from parameter:', {
          paymentId: paymentData.id,
          status: paymentData.status
        });
      }
      
      console.log('Order and payment data prepared for confirmation');
    } catch (orderError) {
      console.error('Error fetching order data:', orderError);
      return NextResponse.json(
        { error: 'Order not found or could not be retrieved' },
        { status: 404 }
      );
    }

    // Extract customer information from order
    let customerInfo = {
      name: '',
      email: '',
      deliveryMethod: 'pickup' as 'pickup' | 'shipping'
    };

    if (orderData.fulfillments && orderData.fulfillments.length > 0) {
      const fulfillment = orderData.fulfillments[0];
      if (fulfillment.type === 'PICKUP') {
        customerInfo.deliveryMethod = 'pickup';
      } else if (fulfillment.type === 'SHIPMENT') {
        customerInfo.deliveryMethod = 'shipping';
      }
    }

    // Extract customer details from order metadata
    if (orderData.metadata) {
      customerInfo.name = orderData.metadata.customerName || '';
      customerInfo.email = orderData.metadata.customerEmail || '';
    }

    // Format line items
    const lineItems = orderData.lineItems?.map((item: any) => ({
      name: item.name || 'Unknown Item',
      quantity: item.quantity ? parseInt(item.quantity) : 1,
      price: item.basePriceMoney ? Number(item.basePriceMoney.amount) / 100 : 0,
      totalPrice: item.grossSalesMoney ? Number(item.grossSalesMoney.amount) / 100 : 0
    })) || [];

    // Calculate total amount
    const totalAmount = orderData.totalMoney ? Number(orderData.totalMoney.amount) / 100 : 0;
    const currency = orderData.totalMoney?.currency || 'AUD';

    // Create order confirmation object
    const orderConfirmation = {
      orderId: orderData.id || id,
      orderNumber: orderData.referenceId || `ORD-${(orderData.id || id).slice(-6).toUpperCase()}`,
      totalAmount: totalAmount,
      currency: currency,
      status: orderData.state || 'UNKNOWN',
      createdAt: orderData.createdAt || new Date().toISOString(),
      lineItems: lineItems,
      payment: paymentData ? {
        id: paymentData.id,
        status: paymentData.status,
        receiptUrl: paymentData.receiptUrl || null,
        amount: paymentData.totalMoney?.amount ? Number(paymentData.totalMoney.amount) / 100 : 0,
        currency: paymentData.totalMoney?.currency || 'AUD'
      } : {
        id: 'unknown',
        status: 'UNKNOWN',
        receiptUrl: null
      },
      customerInfo: customerInfo,
      // Additional order details
      subtotal: orderData.totalMoney ? Number(orderData.totalMoney.amount) / 100 : 0,
      taxAmount: 0, // Will be calculated when we have real order data
      discountAmount: 0, // Will be calculated when we have real order data
      shippingAmount: 0 // Will be calculated when we have real order data
    };

    console.log('Order confirmation prepared:', {
      orderId: orderConfirmation.orderId,
      totalAmount: orderConfirmation.totalAmount,
      itemCount: orderConfirmation.lineItems.length
    });

    return NextResponse.json({
      order: orderConfirmation
    });

  } catch (error) {
    console.error('Error fetching order confirmation:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('not found') || error.message.includes('404')) {
        return NextResponse.json(
          { error: 'Order not found. Please check your order ID.' },
          { status: 404 }
        );
      }
      if (error.message.includes('unauthorized') || error.message.includes('401')) {
        return NextResponse.json(
          { error: 'Authentication error. Please contact support.' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to fetch order confirmation. Please try again later.' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import squareClient from '@/lib/square';

export async function POST(request: NextRequest) {
  try {
    const { email, orderNumber } = await request.json();

    console.log('Customer verification request:', { email, orderNumber });

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Validate required environment variables
    const locationId = process.env.SQUARE_LOCATION_ID;
    if (!locationId) {
      throw new Error('SQUARE_LOCATION_ID environment variable is required');
    }

    console.log('Searching for orders with email:', email);

    let foundOrders: Array<{
      id: string;
      orderNumber: string;
      totalAmount: number;
      currency: string;
      status: string;
      createdAt: string;
      itemCount: number;
      deliveryMethod: 'pickup' | 'shipping';
      customerEmail: string;
    }> = [];
    let isVerified = false;

    try {
      // Search for orders using Square Orders API
      // We'll search for orders and then filter by customer email from metadata
      const searchRequest = {
        locationIds: [locationId],
        limit: 100 // Get more orders to search through
      };

      console.log('Searching Square orders with request:', searchRequest);

      const orders = await squareClient.orders();
      const searchResponse = await orders.search(searchRequest);
      
      if (searchResponse.orders) {
        console.log(`Found ${searchResponse.orders.length} total orders, filtering by email...`);
        
        // Filter orders by customer email in metadata
        const customerOrders = searchResponse.orders.filter((order: any) => {
          // Check if order has metadata with customer email
          if (order.metadata && order.metadata.customerEmail) {
            const emailMatches = order.metadata.customerEmail.toLowerCase() === email.toLowerCase();
            return emailMatches;
          }
          return false;
        });

        // Sort orders: completed orders (with payments) first, then incomplete orders
        customerOrders.sort((a: any, b: any) => {
          const aHasPayments = a.paymentIds && a.paymentIds.length > 0;
          const bHasPayments = b.paymentIds && b.paymentIds.length > 0;
          
          if (aHasPayments && !bHasPayments) return -1;
          if (!aHasPayments && bHasPayments) return 1;
          return 0;
        });

        // Update order status based on payment association
        customerOrders.forEach((order: any) => {
          if (order.paymentIds && order.paymentIds.length > 0) {
            order.state = 'COMPLETED';
          } else if (order.state === 'OPEN') {
            order.state = 'PENDING';
          }
        });

        console.log(`Found ${customerOrders.length} orders for email: ${email}`);

        if (customerOrders.length > 0) {
          isVerified = true;
          
                     // Convert Square orders to our format
           foundOrders = customerOrders.map((order: any) => {
             const totalAmount = order.totalMoney ? 
               Number(order.totalMoney.amount) / 100 : 0; // Convert from cents
             
             const itemCount = order.lineItems ? 
               order.lineItems.reduce((total: number, item: any) => total + (parseInt(item.quantity) || 0), 0) : 0;
             
             const deliveryMethod = order.fulfillments && order.fulfillments.length > 0 ?
               (order.fulfillments[0].type === 'PICKUP' ? 'pickup' : 'shipping') : 'pickup';
             
             return {
               id: order.id || '',
               orderNumber: order.referenceId || `ORD-${(order.id || '').slice(-6).toUpperCase()}`,
               totalAmount: totalAmount,
               currency: order.totalMoney?.currency || 'AUD',
               status: order.state || 'UNKNOWN',
               createdAt: order.createdAt || new Date().toISOString(),
               itemCount: itemCount,
               deliveryMethod: deliveryMethod,
               customerEmail: email
             };
           });

          // If order number provided, verify it exists and belongs to this email
          if (orderNumber) {
            const orderExists = foundOrders.some(order => order.orderNumber === orderNumber);
            if (!orderExists) {
              return NextResponse.json({
                verified: false,
                error: 'Order number not found or does not match this email address'
              });
            }
            
            // Filter to only show the specific order if order number provided
            foundOrders = foundOrders.filter(order => order.orderNumber === orderNumber);
          }

          console.log(`Successfully processed ${foundOrders.length} orders for email:`, email);
        } else {
          console.log('No orders found for email:', email);
          isVerified = false;
        }
      } else {
        console.log('No orders returned from Square API');
        isVerified = false;
      }

    } catch (searchError) {
      console.error('Error searching for orders:', searchError);
      return NextResponse.json(
        { error: 'Failed to search for orders. Please try again later.' },
        { status: 500 }
      );
    }

    // Return the verification result
    if (isVerified && foundOrders.length > 0) {
      // Format orders for frontend consumption
      const formattedOrders = foundOrders.map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        currency: order.currency,
        status: order.status,
        createdAt: order.createdAt,
        itemCount: order.itemCount,
        deliveryMethod: order.deliveryMethod
      }));

      console.log('Customer verification successful:', {
        email,
        orderCount: formattedOrders.length,
        orderNumbers: formattedOrders.map(o => o.orderNumber)
      });

      return NextResponse.json({
        verified: true,
        orders: formattedOrders
      });
    } else {
      console.log('Customer verification failed - no orders found:', email);
      return NextResponse.json({
        verified: false,
        error: 'No orders found for this email address. Please check your email or contact us for assistance.'
      });
    }

  } catch (error) {
    console.error('Error verifying customer:', error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('SQUARE_LOCATION_ID')) {
        return NextResponse.json(
          { error: 'System configuration error. Please contact support.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to verify customer. Please try again later.' },
      { status: 500 }
    );
  }
} 
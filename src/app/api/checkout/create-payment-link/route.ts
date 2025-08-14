import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { cartItems, total, appliedDiscount, automaticDiscounts, customerInfo, deliveryMethod, hasVouchers, voucherItems } = await request.json();
    
    // Validate required environment variables
    const locationId = process.env.SQUARE_LOCATION_ID;
    if (!locationId) {
      throw new Error('SQUARE_LOCATION_ID environment variable is required');
    }

    // Validate input data
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Cart items are required' },
        { status: 400 }
      );
    }

    if (!total || typeof total !== 'number' || total <= 0) {
      return NextResponse.json(
        { error: 'Valid total amount is required' },
        { status: 400 }
      );
    }

    // Generate a unique reference ID for tracking
    const orderReferenceId = `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('Creating Square payment link with Quick Pay:', {
      referenceId: orderReferenceId,
      cartItemsCount: cartItems.length,
      total: total,
      deliveryMethod: deliveryMethod
    });

    // Create a real Square Checkout payment link
    // Use the request origin to ensure we redirect to the correct URL
    const origin = request.headers.get('origin');
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                   (origin && origin.includes('localhost') ? 'http://localhost:3000' : 'https://your-domain.com') ||
                   'http://localhost:3000';
    
    console.log('Using redirect base URL:', baseUrl);
    
    try {
      // Create payment link using Square Checkout API via direct REST call
      const squareAccessToken = process.env.SQUARE_ACCESS_TOKEN;
      if (!squareAccessToken) {
        throw new Error('SQUARE_ACCESS_TOKEN is required');
      }

      // Create a descriptive name from cart items
      const itemNames = cartItems.map(item => item.product.title).join(', ');
      const orderName = cartItems.length === 1 
        ? cartItems[0].product.title 
        : itemNames.length > 50 
          ? `${cartItems.length} items from Porch Records` // Fallback if names are too long
          : `${cartItems.length} items: ${itemNames}`; // Show count + product names
      
      // Build compact preorder items metadata (keep keys short; values must be strings)
      const prItems = (cartItems || []).map((item: any) => ({
        id: String((item.product?.id || '')).replace(/^square_/i, ''),
        q: parseInt(String(item.quantity || '1')) || 1,
      }));

      const paymentLinkData = {
        idempotency_key: `payment-link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          quick_pay: {
          name: orderName,
          price_money: {
            amount: Math.round(total * 100), // Convert to cents
            currency: 'AUD'
          },
          location_id: locationId,
            checkout_options: {
            allow_tipping: false,
            collect_shipping_address: deliveryMethod === 'shipping',
            // Route back through our redirect endpoint so we can guarantee an orderId param on the final URL
            redirect_url: hasVouchers 
            ? `${baseUrl}/store/voucher/success?voucherAmount=${voucherItems[0].product.price}&customerEmail=__CUSTOMER_EMAIL__&customerName=__CUSTOMER_NAME__&ref=${encodeURIComponent(orderReferenceId)}`
            : `${baseUrl}/api/checkout/redirect?ref=${encodeURIComponent(orderReferenceId)}`,
            ask_for_shipping_address: deliveryMethod === 'shipping',
            enable_coupon: false,
            enable_loyalty: false
          },
          // Add order metadata for tracking
          order_request: {
            order: {
              reference_id: orderReferenceId,
              metadata: {
                customerName: `${customerInfo?.firstName || 'Customer'} ${customerInfo?.lastName || 'Name'}`,
                customerEmail: customerInfo?.email || 'customer@example.com',
                customerPhone: customerInfo?.phone || '+61400000000',
                deliveryMethod: deliveryMethod || 'pickup',
                total: total.toFixed(2),
                source: 'porch-records-web',
                // Store voucher redemption info for post-payment processing
                hasVoucherRedemption: appliedDiscount?.isVoucher ? 'true' : 'false',
                voucherCode: appliedDiscount?.isVoucher ? appliedDiscount.code : '',
                voucherAmount: appliedDiscount?.isVoucher ? appliedDiscount.discountAmount.toString() : '0',
                // Compact preorder items payload so webhooks can increment counts even with Quick Pay
                pr_items: JSON.stringify(prItems).slice(0, 1800), // stay well under metadata limits
                pr_count: String(prItems.length),
                pr_titles: (cartItems || []).map((i: any) => i.product?.title).slice(0, 5).join('|').slice(0, 200)
              }
            }
          }
        }
      };

      const squareApiUrl = process.env.SQUARE_ENVIRONMENT === 'production' 
        ? 'https://connect.squareup.com/v2/online-checkout/payment-links'
        : 'https://connect.squareupsandbox.com/v2/online-checkout/payment-links';

      // Create payment link using quick pay approach
      console.log('Sending payment link request:', JSON.stringify(paymentLinkData, null, 2));
      
      const paymentLinkResponse = await fetch(squareApiUrl, {
        method: 'POST',
        headers: {
          'Square-Version': '2022-03-16',
          'Authorization': `Bearer ${squareAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentLinkData)
      });

      console.log('Payment link response status:', paymentLinkResponse.status);

      if (!paymentLinkResponse.ok) {
        const errorData = await paymentLinkResponse.json();
        console.error('Square Checkout API error response:', errorData);
        throw new Error(`Square Checkout API error: ${paymentLinkResponse.status} - ${JSON.stringify(errorData)}`);
      }

      const paymentLinkResult = await paymentLinkResponse.json();

      if (!paymentLinkResult.payment_link) {
        throw new Error('Failed to create payment link');
      }

      console.log('Square Checkout payment link created successfully:', {
        orderReferenceId: orderReferenceId,
        quickPayOrderId: paymentLinkResult.payment_link.order_id, // This is the ONLY order ID we need
        paymentLinkId: paymentLinkResult.payment_link.id,
        checkoutUrl: paymentLinkResult.payment_link.url,
        totalAmount: total
      });

      // Log the full payment link response for debugging
      console.log('Full payment link response:', JSON.stringify(paymentLinkResult, null, 2));

      return NextResponse.json({
        success: true,
        checkoutUrl: paymentLinkResult.payment_link.url,
        orderId: paymentLinkResult.payment_link.order_id, // Use the Quick Pay order ID
        orderNumber: orderReferenceId,
        paymentLinkId: paymentLinkResult.payment_link.id
      });

    } catch (checkoutError) {
      console.error('Square Checkout API error:', checkoutError);
      throw new Error(`Failed to create Square Checkout payment link: ${checkoutError instanceof Error ? checkoutError.message : 'Unknown error'}`);
    }

  } catch (error) {
    console.error('Payment link creation error:', error);
    
    // Return appropriate error response
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
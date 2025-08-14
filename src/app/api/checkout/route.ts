import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { cartItems, total } = await request.json();

    // Validate required environment variables
    const locationId = process.env.SQUARE_LOCATION_ID;
    if (!locationId) {
      throw new Error('SQUARE_LOCATION_ID environment variable is required');
    }

    // Redirect to your existing Square hosted checkout
    // This uses Square's modern hosted checkout with all features
    const checkoutUrl = `https://www.porchrecords.com.au/s/checkout?total=${total}&items=${cartItems.length}`;

    return NextResponse.json({
      checkoutUrl: checkoutUrl,
      message: 'Redirecting to Square hosted checkout'
    });

  } catch (error) {
    console.error('Checkout API error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 
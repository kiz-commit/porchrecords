import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, squareId, discountPercent } = body;

    if (!productId || !squareId || !discountPercent) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, squareId, discountPercent' },
        { status: 400 }
      );
    }

    // TODO: Integrate with Square API to create actual discount
    // For now, return mock success response
    console.log(`Creating ${discountPercent}% discount for product ${productId} (Square ID: ${squareId})`);

    // Mock Square API integration
    const mockDiscountResponse = {
      id: `disc_${Date.now()}`,
      name: `${discountPercent}% Off`,
      discountType: 'PERCENTAGE',
      percentage: discountPercent.toString(),
      applicableItems: [squareId],
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      discount: mockDiscountResponse,
      message: `Successfully created ${discountPercent}% discount for product`
    });
  } catch (error) {
    console.error('Error creating discount:', error);
    return NextResponse.json(
      { error: 'Failed to create discount' },
      { status: 500 }
    );
  }
} 
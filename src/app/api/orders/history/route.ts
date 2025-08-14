import { NextRequest, NextResponse } from 'next/server';
import squareClient from '@/lib/square';

export async function GET(request: NextRequest) {
  try {
    console.log('Order history endpoint accessed - redirecting to verification system');
    
    // This endpoint is deprecated - order history now requires customer verification
    return NextResponse.json(
      { 
        error: 'Order history requires customer verification. Please use the order history page with email verification.',
        redirectTo: '/order-history'
      },
      { status: 401 }
    );

  } catch (error) {
    console.error('Error in order history endpoint:', error);
    return NextResponse.json(
      { error: 'Failed to access order history' },
      { status: 500 }
    );
  }
} 
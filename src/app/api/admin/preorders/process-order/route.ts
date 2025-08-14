import { NextRequest, NextResponse } from 'next/server';
import { updatePreorderQuantity } from '@/lib/preorder-utils';

/**
 * API endpoint to process preorder updates for a specific order
 * This can be used to retroactively update preorder counts for orders
 * that were completed before the automatic tracking was implemented
 */
export async function POST(request: NextRequest) {
  try {
    const { orderId, cartItems } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Cart items are required' },
        { status: 400 }
      );
    }

    console.log('Processing preorder updates for order:', {
      orderId,
      itemCount: cartItems.length
    });

    const results = [];
    let totalUpdated = 0;

    // Process each cart item for potential preorder updates
    for (const item of cartItems) {
      if (!item.product || !item.product.id || !item.quantity) {
        results.push({
          productId: item.product?.id || 'unknown',
          productName: item.product?.title || 'Unknown Product',
          success: false,
          error: 'Invalid item data'
        });
        continue;
      }

      try {
        const quantityChange = parseInt(item.quantity);
        const success = await updatePreorderQuantity(item.product.id, quantityChange);

        if (success) {
          results.push({
            productId: item.product.id,
            productName: item.product.title,
            quantityAdded: quantityChange,
            success: true
          });
          totalUpdated++;
          
          console.log('Preorder quantity updated:', {
            orderId,
            productId: item.product.id,
            productName: item.product.title,
            quantityAdded: quantityChange
          });
        } else {
          results.push({
            productId: item.product.id,
            productName: item.product.title,
            success: false,
            error: 'Product is not a preorder or update failed'
          });
        }

      } catch (error) {
        console.error('Error updating preorder quantity for item:', {
          orderId,
          productId: item.product.id,
          error: error
        });
        
        results.push({
          productId: item.product.id,
          productName: item.product.title,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed preorder updates for order ${orderId}`,
      orderId,
      totalItemsProcessed: cartItems.length,
      preordersUpdated: totalUpdated,
      results
    });

  } catch (error) {
    console.error('Failed to process preorder updates:', error);
    return NextResponse.json(
      { error: 'Failed to process preorder updates' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to get information about this API
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/admin/preorders/process-order',
    description: 'Process preorder quantity updates for a specific order',
    method: 'POST',
    parameters: {
      orderId: 'string - The order ID to process',
      cartItems: 'array - Array of cart items with product.id and quantity'
    },
    example: {
      orderId: 'order-123',
      cartItems: [
        {
          product: { id: 'TAY7GQZEWWVPIVRVG5WXF7BF', title: 'Test API Response' },
          quantity: 1
        }
      ]
    }
  });
}
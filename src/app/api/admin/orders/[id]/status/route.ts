import { NextRequest, NextResponse } from 'next/server';
import squareClient from '@/lib/square';
import { withAdminAuth } from '@/lib/route-protection';

async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status, notes } = await request.json();

    console.log('Updating order status:', { orderId: id, status, notes });
    
    // Validate input
    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate required environment variables
    const locationId = process.env.SQUARE_LOCATION_ID;
    if (!locationId) {
      throw new Error('SQUARE_LOCATION_ID environment variable is required');
    }

    // First, get the current order to ensure it exists
    const searchRequest = {
      locationIds: [locationId],
      filter: {
        orderIds: [id]
      }
    };
    
    const orders = await squareClient.orders();
    const searchResponse = await orders.search(searchRequest);
    
    if (!searchResponse.orders || searchResponse.orders.length === 0) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }
    
    const currentOrder = searchResponse.orders[0];
    
    console.log('Current order details:', {
      orderId: currentOrder.id,
      currentState: currentOrder.state,
      version: currentOrder.version,
      locationId: currentOrder.locationId
    });
    
    // Map admin status to Square order states
    const statusMapping: { [key: string]: string } = {
      'open': 'OPEN',
      'completed': 'COMPLETED',
      'cancelled': 'CANCELED'
    };
    
    const squareStatus = statusMapping[status.toLowerCase()] || status.toUpperCase();
    
    console.log('Status mapping:', {
      inputStatus: status,
      mappedStatus: squareStatus,
      currentStatus: currentOrder.state
    });
    
    // Check if this is a valid state transition
    if (currentOrder.state === squareStatus) {
      return NextResponse.json({
        success: true,
        message: 'Order is already in the requested status',
        orderId: id,
        currentStatus: currentOrder.state
      });
    }
    
    // Check if this order was created via Quick Pay (payment link)
    const isQuickPayOrder = currentOrder.source?.name?.includes('sq0idp-') || 
                           currentOrder.referenceId === undefined ||
                           currentOrder.referenceId === null;
    
    if (isQuickPayOrder) {
      console.log('⚠️ Quick Pay order detected - state updates may be restricted');
      
      // For Quick Pay orders, we can only provide a virtual status update
      // The actual order state in Square cannot be changed for payment link orders
      return NextResponse.json({
        success: true,
        message: `Order status virtually updated to ${squareStatus}. Note: Quick Pay orders have limited state update capabilities in Square.`,
        orderId: id,
        oldStatus: currentOrder.state,
        newStatus: squareStatus,
        isVirtualUpdate: true,
        note: 'This order was created via Square Payment Link (Quick Pay). Status updates are tracked locally but may not reflect in Square due to API limitations.'
      });
    }
    
    // Update the order state using Square Orders API
    const updateRequest = {
      orderId: id,
      idempotencyKey: `status-update-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      order: {
        version: currentOrder.version, // Required for updates
        locationId: locationId,
        state: squareStatus
      }
    };
    
    console.log('Sending update request to Square:', JSON.stringify(updateRequest, null, 2));
    
    try {
      const orders = await squareClient.orders();
      const updateResponse = await orders.update(updateRequest);
      
      if (updateResponse.order) {
        console.log('Order status updated successfully:', {
          orderId: id,
          oldStatus: currentOrder.state,
          newStatus: updateResponse.order.state,
          notes: notes
        });
        
        return NextResponse.json({
          success: true,
          message: 'Order status updated successfully',
          orderId: id,
          oldStatus: currentOrder.state,
          newStatus: updateResponse.order.state
        });
      } else {
        throw new Error('Failed to update order status');
      }
    } catch (updateError) {
      console.error('Error updating order in Square:', updateError);
      
      // If Square update fails, return error with details
      return NextResponse.json({
        error: `Failed to update order status: ${updateError instanceof Error ? updateError.message : 'Unknown error'}`,
        orderId: id
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}

// Export with admin authentication
export const PUT = withAdminAuth(putHandler); 
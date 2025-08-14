require('dotenv').config({ path: '.env.local' });
const { SquareClient, SquareEnvironment } = require('square');

// Initialize Square client
const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: SquareEnvironment.Sandbox,
});

async function debugOrderUpdate() {
  try {
    console.log('🔍 Debugging order update process...');
    
    const locationId = process.env.SQUARE_LOCATION_ID;
    if (!locationId) {
      throw new Error('SQUARE_LOCATION_ID environment variable is required');
    }

    // Use the order ID that failed to update
    const orderId = 'xn93Dud9Hg7KFUd98zGRa5SFaVIZY';
    
    console.log(`\n1. Fetching order: ${orderId}`);
    
    // First, search for the order
    const searchRequest = {
      locationIds: [locationId],
      filter: {
        orderIds: [orderId]
      }
    };
    
    const searchResponse = await client.orders.search(searchRequest);
    
    if (!searchResponse.orders || searchResponse.orders.length === 0) {
      console.log('❌ Order not found');
      return;
    }
    
    const order = searchResponse.orders[0];
    
    console.log('✅ Order found:');
    console.log({
      id: order.id,
      referenceId: order.referenceId,
      state: order.state,
      version: order.version,
      locationId: order.locationId,
      source: order.source,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    });
    
    console.log('\nOrder details:');
    console.log('- Line items:', order.lineItems?.length || 0);
    console.log('- Tenders:', order.tenders?.length || 0);
    console.log('- Fulfillments:', order.fulfillments?.length || 0);
    
    // Check if this order has any special properties that might prevent updates
    if (order.source) {
      console.log('- Order source:', order.source.name);
    }
    
    console.log(`\n2. Attempting to update order state from ${order.state} to COMPLETED...`);
    
    // To complete an order, we need to also complete the fulfillments
    const fulfillments = order.fulfillments?.map(fulfillment => ({
      uid: fulfillment.uid,
      state: 'COMPLETED'
    })) || [];
    
    const updateRequest = {
      idempotencyKey: `debug-update-${Date.now()}`,
      order: {
        version: order.version,
        locationId: locationId,
        state: 'COMPLETED',
        fulfillments: fulfillments
      }
    };
    
    console.log('Update request:', JSON.stringify(updateRequest, null, 2));
    
    try {
      const updateResponse = await client.orders.update(orderId, updateRequest);
      
      if (updateResponse.order) {
        console.log('✅ Order updated successfully!');
        console.log({
          id: updateResponse.order.id,
          oldState: order.state,
          newState: updateResponse.order.state,
          newVersion: updateResponse.order.version
        });
      } else {
        console.log('❌ Update response did not contain order data');
      }
    } catch (updateError) {
      console.log('❌ Update failed with error:');
      console.log(updateError);
      
      // Try to extract more specific error information
      if (updateError.errors) {
        console.log('\nDetailed errors:');
        updateError.errors.forEach((error, index) => {
          console.log(`${index + 1}. ${error.category}: ${error.code}`);
          console.log(`   Detail: ${error.detail}`);
          if (error.field) {
            console.log(`   Field: ${error.field}`);
          }
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

debugOrderUpdate();
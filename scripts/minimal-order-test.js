require('dotenv').config({ path: '.env.local' });
const { SquareClient, SquareEnvironment } = require('square');

// Initialize Square client
const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: SquareEnvironment.Sandbox,
});

async function minimalOrderTest() {
  try {
    console.log('🔍 Testing minimal order update...');
    
    const locationId = process.env.SQUARE_LOCATION_ID;
    const orderId = 'xn93Dud9Hg7KFUd98zGRa5SFaVIZY';
    
    // First, get the order
    console.log('\n1. Searching for order...');
    const searchResponse = await client.orders.search({
      locationIds: [locationId],
      filter: {
        orderIds: [orderId]
      }
    });
    
    if (!searchResponse.orders || searchResponse.orders.length === 0) {
      console.log('❌ Order not found');
      return;
    }
    
    const order = searchResponse.orders[0];
    console.log('✅ Found order:', {
      id: order.id,
      state: order.state,
      version: order.version
    });
    
    // Try the simplest possible update - just bump version
    console.log('\n2. Attempting minimal update (no state change)...');
    
    const updateRequest = {
      idempotencyKey: `minimal-test-${Date.now()}`,
      order: {
        version: order.version,
        locationId: locationId
        // No state change, just version bump
      }
    };
    
    console.log('Update request:', JSON.stringify(updateRequest, null, 2));
    
    try {
      const updateResponse = await client.orders.update(orderId, updateRequest);
      console.log('✅ Minimal update successful!');
      console.log('New version:', updateResponse.order?.version);
      
      // Now try state change
      console.log('\n3. Attempting state change to COMPLETED...');
      
      const stateUpdateRequest = {
        idempotencyKey: `state-test-${Date.now()}`,
        order: {
          version: updateResponse.order.version,
          locationId: locationId,
          state: 'COMPLETED'
        }
      };
      
      const stateUpdateResponse = await client.orders.update(orderId, stateUpdateRequest);
      console.log('✅ State update successful!');
      console.log('New state:', stateUpdateResponse.order?.state);
      
    } catch (updateError) {
      console.log('❌ Update failed:', updateError.message);
      if (updateError.errors) {
        updateError.errors.forEach(err => {
          console.log(`  - ${err.category}: ${err.code} - ${err.detail} (field: ${err.field})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

minimalOrderTest();
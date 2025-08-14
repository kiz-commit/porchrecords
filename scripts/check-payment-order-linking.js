require('dotenv').config({ path: '.env.local' });
const { SquareClient, SquareEnvironment } = require('square');

const client = new SquareClient({
  environment: SquareEnvironment.Sandbox,
  token: process.env.SQUARE_ACCESS_TOKEN,
});

async function checkPaymentOrderLinking() {
  try {
    console.log('🔍 Checking payment-order linking...\n');
    
    // Get recent orders
    console.log('📦 Fetching recent orders...');
    const ordersResponse = await client.orders.search({
      locationIds: [process.env.SQUARE_LOCATION_ID],
      query: {
        filter: {
          dateTimeFilter: {
            createdAtAt: {
              startAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
              endAt: new Date().toISOString()
            }
          }
        }
      }
    });
    
    if (!ordersResponse.orders || ordersResponse.orders.length === 0) {
      console.log('No recent orders found');
      return;
    }
    
    console.log(`Found ${ordersResponse.orders.length} recent orders:\n`);
    
    for (const order of ordersResponse.orders) {
      console.log(`📋 Order: ${order.id}`);
      console.log(`   State: ${order.state}`);
      console.log(`   Total: ${order.totalMoney?.amount || 0} ${order.totalMoney?.currency || 'AUD'}`);
      console.log(`   Created: ${order.createdAt}`);
      
      // Check for payment IDs in order
      if (order.paymentIds && order.paymentIds.length > 0) {
        console.log(`   ✅ Payment IDs: ${order.paymentIds.join(', ')}`);
      } else {
        console.log(`   ❌ No payment IDs found in order`);
      }
      
      // Check fulfillments
      if (order.fulfillments && order.fulfillments.length > 0) {
        console.log(`   📦 Fulfillments: ${order.fulfillments.map(f => `${f.state} (${f.uid})`).join(', ')}`);
      }
      
      console.log('');
    }
    
    // Get recent payments
    console.log('💳 Fetching recent payments...');
    const paymentsResponse = await client.payments.search({
      locationIds: [process.env.SQUARE_LOCATION_ID],
      query: {
        filter: {
          dateTimeFilter: {
            createdAt: {
              startAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
              endAt: new Date().toISOString()
            }
          }
        }
      }
    });
    
    if (!paymentsResponse.payments || paymentsResponse.payments.length === 0) {
      console.log('No recent payments found');
      return;
    }
    
    console.log(`Found ${paymentsResponse.payments.length} recent payments:\n`);
    
    for (const payment of paymentsResponse.payments) {
      console.log(`💳 Payment: ${payment.id}`);
      console.log(`   Status: ${payment.status}`);
      console.log(`   Amount: ${payment.totalMoney?.amount || 0} ${payment.totalMoney?.currency || 'AUD'}`);
      console.log(`   Order ID: ${payment.orderId || 'None'}`);
      console.log(`   Created: ${payment.createdAt}`);
      console.log('');
    }
    
    // Analysis
    console.log('🔍 ANALYSIS:\n');
    
    const ordersWithPayments = ordersResponse.orders.filter(order => 
      order.paymentIds && order.paymentIds.length > 0
    );
    
    const paymentsWithOrders = paymentsResponse.payments.filter(payment => 
      payment.orderId
    );
    
    console.log(`Orders with payment IDs: ${ordersWithPayments.length}/${ordersResponse.orders.length}`);
    console.log(`Payments with order IDs: ${paymentsWithOrders.length}/${paymentsResponse.payments.length}`);
    
    if (ordersWithPayments.length === 0) {
      console.log('\n❌ ISSUE: No orders show payment IDs');
      console.log('This is why payments don\'t appear linked in Square Dashboard');
      console.log('\n💡 SOLUTION: Set up webhooks for payment.updated events');
      console.log('Webhooks will automatically update order states when payments complete');
      console.log('\n📋 Next steps:');
      console.log('1. Go to Square Dashboard > Developers > Webhooks');
      console.log('2. Add webhook URL: http://localhost:3000/api/webhooks/square');
      console.log('3. Select events: payment.updated, order.updated');
      console.log('4. Save the webhook subscription');
      console.log('5. Make a test payment to trigger the webhook');
    } else {
      console.log('\n✅ Orders are properly linked to payments!');
    }
    
  } catch (error) {
    console.error('Error checking payment-order linking:', error.message);
    if (error.result && error.result.errors) {
      error.result.errors.forEach(err => {
        console.error('  -', err.code, err.detail);
      });
    }
  }
}

checkPaymentOrderLinking(); 
const { SquareClient, SquareEnvironment } = require('square');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: SquareEnvironment.Sandbox,
});

async function checkOrderStatus() {
  try {
    console.log('Checking order status...');
    
    const orderId = 'order-1753237257425'; // The order ID from the user
    
    // First, let's search for the order by reference ID
    console.log(`\n1. Searching for order with reference ID: ${orderId}`);
    
    const searchRequest = {
      locationIds: [process.env.SQUARE_LOCATION_ID],
      query: {
        filter: {
          referenceIdFilter: {
            referenceId: orderId
          }
        }
      }
    };

    const searchResponse = await client.orders.search(searchRequest);
    
    if (!searchResponse.orders || searchResponse.orders.length === 0) {
      console.log('❌ Order not found in search');
      
      // Let's try to get all recent orders to see what's there
      console.log('\n2. Checking recent orders...');
      const recentSearchRequest = {
        locationIds: [process.env.SQUARE_LOCATION_ID],
        query: {
          filter: {
            stateFilter: {
              states: ['OPEN', 'COMPLETED', 'CANCELED']
            }
          }
        }
      };
      
      const recentResponse = await client.orders.search(recentSearchRequest);
      
      if (recentResponse.orders && recentResponse.orders.length > 0) {
        console.log(`Found ${recentResponse.orders.length} recent orders:`);
        recentResponse.orders.forEach((order, index) => {
          console.log(`${index + 1}. Order ID: ${order.id}`);
          console.log(`   Reference ID: ${order.referenceId}`);
          console.log(`   State: ${order.state}`);
          console.log(`   Payment IDs: ${order.paymentIds ? order.paymentIds.length : 0}`);
          console.log(`   Created: ${order.createdAt}`);
          console.log('');
        });
      } else {
        console.log('❌ No recent orders found');
      }
      
      return;
    }

    const order = searchResponse.orders[0];
    console.log('✅ Order found!');
    console.log(`Order ID: ${order.id}`);
    console.log(`Reference ID: ${order.referenceId}`);
    console.log(`State: ${order.state}`);
    console.log(`Payment IDs: ${order.paymentIds ? order.paymentIds.length : 0}`);
    console.log(`Created: ${order.createdAt}`);
    console.log(`Updated: ${order.updatedAt}`);
    
    if (order.paymentIds && order.paymentIds.length > 0) {
      console.log('\n3. Checking payment details...');
      for (const paymentId of order.paymentIds) {
        try {
          const paymentResponse = await client.payments.getPayment(paymentId);
          if (paymentResponse.payment) {
            console.log(`Payment ID: ${paymentResponse.payment.id}`);
            console.log(`Status: ${paymentResponse.payment.status}`);
            console.log(`Amount: ${paymentResponse.payment.amountMoney.amount} ${paymentResponse.payment.amountMoney.currency}`);
            console.log(`Order ID: ${paymentResponse.payment.orderId}`);
          }
        } catch (error) {
          console.log(`❌ Error getting payment ${paymentId}: ${error.message}`);
        }
      }
    } else {
      console.log('\n❌ No payment IDs associated with this order');
      console.log('This means the payment was not successfully processed or linked to the order.');
    }
    
    // Check if there are any recent payments that might be for this order
    console.log('\n4. Checking recent payments...');
    const paymentsSearchRequest = {
      locationIds: [process.env.SQUARE_LOCATION_ID],
      query: {
        filter: {
          dateTimeFilter: {
            createdAt: {
              startAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
              endAt: new Date().toISOString()
            }
          }
        }
      }
    };
    
    const paymentsResponse = await client.payments.search(paymentsSearchRequest);
    
    if (paymentsResponse.payments && paymentsResponse.payments.length > 0) {
      console.log(`Found ${paymentsResponse.payments.length} recent payments:`);
      paymentsResponse.payments.forEach((payment, index) => {
        console.log(`${index + 1}. Payment ID: ${payment.id}`);
        console.log(`   Status: ${payment.status}`);
        console.log(`   Amount: ${payment.amountMoney.amount} ${payment.amountMoney.currency}`);
        console.log(`   Order ID: ${payment.orderId || 'None'}`);
        console.log(`   Created: ${payment.createdAt}`);
        console.log('');
      });
    } else {
      console.log('❌ No recent payments found');
    }

  } catch (error) {
    console.error('❌ Error checking order status:', error.message);
  }
}

checkOrderStatus(); 
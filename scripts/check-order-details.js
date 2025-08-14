require('dotenv').config({ path: '.env.local' });
const { SquareClient, SquareEnvironment } = require('square');

const client = new SquareClient({
  environment: SquareEnvironment.Sandbox,
  token: process.env.SQUARE_ACCESS_TOKEN,
});

async function checkOrderDetails() {
  try {
    console.log('Checking order details...\n');
    console.log('Location ID:', process.env.SQUARE_LOCATION_ID);
    console.log('Access Token:', process.env.SQUARE_ACCESS_TOKEN ? 'Present' : 'Missing');

    // First, let's see what methods are available
    console.log('Available orders methods:', Object.getOwnPropertyNames(client.orders));
    console.log('\n');

    const orderIds = [
      'zoTk6Lhzu3C0i8Gx7oaJyhkB1ceZY',
      'XY01GxnoHgz6wxYvA60J8A6uXCgZY'
    ];

    for (const orderId of orderIds) {
      console.log(`\n=== Order: ${orderId} ===`);
      
      try {
        // Try different methods to get order details
        console.log('Trying to get order details...');
        
        // Method 1: Try search with specific order ID
        const searchRequest = {
          locationIds: [process.env.SQUARE_LOCATION_ID],
          query: {
            filter: {
              orderId: {
                any: [orderId]
              }
            }
          }
        };
        
        const searchResponse = await client.orders.search(searchRequest);
        
        if (searchResponse.orders && searchResponse.orders.length > 0) {
          const order = searchResponse.orders[0];
          console.log('Order Status:', order.state);
          console.log('Order Number:', order.referenceId);
          console.log('Total Amount:', order.totalMoney ? `$${Number(order.totalMoney.amount) / 100} ${order.totalMoney.currency}` : 'N/A');
          console.log('Created At:', order.createdAt);
          console.log('Updated At:', order.updatedAt);
          console.log('Line Items:', order.lineItems?.length || 0);
          
          // Check if order has payments
          if (order.paymentIds && order.paymentIds.length > 0) {
            console.log('Payment IDs:', order.paymentIds);
            
            // Check payment status
            for (const paymentId of order.paymentIds) {
              try {
                const paymentResponse = await client.payments.getPayment({ paymentId });
                const payment = paymentResponse.payment;
                console.log(`Payment ${paymentId} Status:`, payment.status);
                console.log(`Payment ${paymentId} Amount:`, payment.amountMoney ? `$${Number(payment.amountMoney.amount) / 100} ${payment.amountMoney.currency}` : 'N/A');
              } catch (paymentError) {
                console.log(`Payment ${paymentId} Error:`, paymentError.message);
              }
            }
          } else {
            console.log('No payments associated with this order');
          }
          
          // Check metadata
          if (order.metadata) {
            console.log('Metadata:', order.metadata);
          }
        } else {
          console.log('Order not found in search results');
        }
      } catch (error) {
        console.log('Error retrieving order:', error.message);
      }
    }

  } catch (error) {
    console.error('Script failed:', error);
  }
}

checkOrderDetails(); 
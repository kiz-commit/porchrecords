require('dotenv').config({ path: '.env.local' });
const { SquareClient, SquareEnvironment } = require('square');

const client = new SquareClient({
  environment: SquareEnvironment.Sandbox,
  token: process.env.SQUARE_ACCESS_TOKEN,
});

async function checkPaymentDetails(paymentId) {
  try {
    console.log(`🔍 Checking payment details for ${paymentId}...`);
    
    // Search for the payment
    const paymentResponse = await client.payments.searchPayments({
      locationId: process.env.SQUARE_LOCATION_ID,
      beginTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date().toISOString()
    });
    
    const payments = paymentResponse.payments || [];
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) {
      console.log('❌ Payment not found');
      return;
    }
    
    console.log('💳 Payment Details:');
    console.log('  ID:', payment.id);
    console.log('  Status:', payment.status);
    console.log('  Created:', payment.createdAt);
    console.log('  Updated:', payment.updatedAt);
    console.log('  Amount:', payment.totalMoney ? `${Number(payment.totalMoney.amount) / 100} ${payment.totalMoney.currency}` : 'N/A');
    console.log('  Order ID:', payment.orderId || 'None');
    console.log('  Source Type:', payment.sourceType);
    console.log('  Reference ID:', payment.referenceId || 'None');
    console.log('  Location ID:', payment.locationId || 'None');
    
    if (payment.orderId) {
      console.log('\n📦 Checking associated order...');
      const orderResponse = await client.orders.search({
        locationIds: [process.env.SQUARE_LOCATION_ID],
        query: {
          filter: {
            orderIdFilter: {
              orderIds: [payment.orderId]
            }
          }
        }
      });
      
      const order = orderResponse.orders?.[0];
      if (order) {
        console.log('✅ Order found and linked:');
        console.log('  Order ID:', order.id);
        console.log('  State:', order.state);
        console.log('  Payment IDs:', order.paymentIds || 'None');
      } else {
        console.log('❌ Order not found');
      }
    } else {
      console.log('\n❌ Payment is not linked to any order');
    }
    
  } catch (error) {
    console.error('❌ Error checking payment details:', error.message);
  }
}

// Get payment ID from command line argument or use default
const paymentId = process.argv[2] || 'Vg9rn7ET2MMjIM115X4Ed46joiJZY';
checkPaymentDetails(paymentId); 
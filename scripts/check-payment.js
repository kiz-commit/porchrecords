require('dotenv').config({ path: '.env.local' });
const squareClient = require('square');

// Initialize Square client
const client = new squareClient.SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: squareClient.SquareEnvironment.Sandbox,
});

async function checkPayment(paymentId) {
  try {
    console.log('🔍 Checking payment in Square:', paymentId);
    
    // List payments and filter by ID
    const paymentsResponse = await client.payments.list({
      locationId: process.env.SQUARE_LOCATION_ID,
      limit: 100
    });
    
    if (paymentsResponse.payments) {
      const payment = paymentsResponse.payments.find(p => p.id === paymentId);
      
      if (payment) {
        console.log('✅ Payment found in Square!');
        console.log('Payment details:', {
          id: payment.id,
          status: payment.status,
          amount: payment.totalMoney?.amount,
          currency: payment.totalMoney?.currency,
          createdAt: payment.createdAt,
          orderId: payment.orderId,
          receiptUrl: payment.receiptUrl
        });
        
        if (payment.orderId) {
          console.log('✅ Payment is linked to order:', payment.orderId);
        } else {
          console.log('⚠️ Payment is NOT linked to an order');
        }
      } else {
        console.log('❌ Payment not found in Square');
      }
    } else {
      console.log('❌ No payments found');
    }
    
  } catch (error) {
    console.error('❌ Error checking payment:', error);
  }
}

// Check the specific payment from your test
checkPayment('PVhZE3pvf11Z8UjlFZP1G8KOmPIZY'); 
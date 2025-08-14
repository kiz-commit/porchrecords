require('dotenv').config({ path: '.env.local' });
const squareClient = require('square');

// Initialize Square client
const client = new squareClient.SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: squareClient.SquareEnvironment.Sandbox,
});

async function testPaymentCreation() {
  try {
    console.log('🧪 Testing Square Payment Creation...');
    
    // Test data
    const testAmount = 1000; // $10.00 in cents
    const testSourceId = 'cnon:card-nonce-ok'; // Square sandbox test card
    const testLocationId = process.env.SQUARE_LOCATION_ID;
    
    console.log('Test parameters:', {
      amount: testAmount,
      sourceId: testSourceId,
      locationId: testLocationId,
      environment: 'Sandbox'
    });
    
    // Create a test payment
    const paymentRequest = {
      idempotencyKey: `test-payment-${Date.now()}`,
      sourceId: testSourceId,
      amountMoney: {
        amount: BigInt(testAmount),
        currency: 'AUD'
      },
      locationId: testLocationId,
      note: 'Test payment from script',
      autocomplete: true
    };
    
    console.log('Creating test payment...');
    const paymentResponse = await client.payments.create(paymentRequest);
    
    if (paymentResponse.payment) {
      console.log('✅ Payment created successfully!');
      console.log('Payment details:', {
        id: paymentResponse.payment.id,
        status: paymentResponse.payment.status,
        amount: paymentResponse.payment.totalMoney?.amount,
        currency: paymentResponse.payment.totalMoney?.currency,
        createdAt: paymentResponse.payment.createdAt
      });
    } else {
      console.log('❌ Payment creation failed - no payment returned');
    }
    
  } catch (error) {
    console.error('❌ Payment creation test failed:', error);
    if (error.result && error.result.errors) {
      console.error('Square API errors:', error.result.errors);
    }
  }
}

// Run the test
testPaymentCreation(); 
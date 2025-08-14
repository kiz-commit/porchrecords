require('dotenv').config({ path: '.env.local' });
const squareClient = require('square');

// Initialize Square client
const client = new squareClient.SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: squareClient.SquareEnvironment.Sandbox,
});

async function testPaymentFlow() {
  try {
    console.log('🧪 Testing Complete Payment Flow...');
    
    // Step 1: Create Order (like your app does)
    console.log('\n1️⃣ Creating Order...');
    const orderData = {
      locationId: process.env.SQUARE_LOCATION_ID,
      referenceId: `test-order-${Date.now()}`,
      lineItems: [
        {
          name: 'Test Product',
          quantity: '1',
          basePriceMoney: {
            amount: BigInt(3999), // $39.99
            currency: 'AUD'
          }
        }
      ],
      state: 'OPEN',
      fulfillments: [
        {
          type: 'PICKUP',
          pickupDetails: {
            recipient: {
              displayName: 'Test Customer',
              emailAddress: 'test@example.com'
            },
            pickupAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Tomorrow
          }
        }
      ]
    };
    
    const orderResponse = await client.orders.create({
      idempotencyKey: `test-order-${Date.now()}`,
      order: orderData
    });
    
    if (!orderResponse.order) {
      throw new Error('Failed to create order');
    }
    
    console.log('✅ Order created:', {
      orderId: orderResponse.order.id,
      orderNumber: orderResponse.order.referenceId,
      totalAmount: orderResponse.order.totalMoney?.amount
    });
    
    // Step 2: Create Payment (like your app does)
    console.log('\n2️⃣ Creating Payment...');
    const paymentRequest = {
      idempotencyKey: `test-payment-${Date.now()}`,
      sourceId: 'cnon:card-nonce-ok', // Square sandbox test card
      amountMoney: {
        amount: orderResponse.order.totalMoney?.amount || BigInt(3999),
        currency: 'AUD'
      },
      orderId: orderResponse.order.id, // Link to order
      buyerEmailAddress: 'test@example.com',
      note: `Test order ${orderResponse.order.referenceId}`,
      locationId: process.env.SQUARE_LOCATION_ID,
      referenceId: `test-payment-${orderResponse.order.referenceId}`,
      autocomplete: true
    };
    
    console.log('Payment request:', {
      orderId: paymentRequest.orderId,
      amount: Number(paymentRequest.amountMoney.amount) / 100,
      sourceId: paymentRequest.sourceId.substring(0, 10) + '...'
    });
    
    const paymentResponse = await client.payments.create(paymentRequest);
    
    if (!paymentResponse.payment) {
      throw new Error('Failed to create payment');
    }
    
    console.log('✅ Payment created:', {
      paymentId: paymentResponse.payment.id,
      status: paymentResponse.payment.status,
      amount: paymentResponse.payment.totalMoney?.amount,
      orderId: paymentResponse.payment.orderId
    });
    
    // Step 3: Verify in Square
    console.log('\n3️⃣ Verifying in Square...');
    console.log('Order URL:', `https://app.squareupsandbox.com/dashboard/orders/overview/${orderResponse.order.id}`);
    console.log('Payment should be linked to order in Square dashboard');
    
  } catch (error) {
    console.error('❌ Payment flow test failed:', error);
    if (error.result && error.result.errors) {
      console.error('Square API errors:', error.result.errors);
    }
  }
}

// Run the test
testPaymentFlow(); 
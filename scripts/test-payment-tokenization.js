const { SquareClient, SquareEnvironment } = require('square');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    
    envVars.forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    });
  }
}

// Load environment variables
loadEnvFile();

async function testPaymentTokenization() {
  console.log('🔍 Testing Payment Tokenization...\n');

  const locationId = process.env.SQUARE_LOCATION_ID;
  const applicationId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
  
  if (!locationId || !applicationId) {
    console.log('❌ Missing required environment variables');
    return;
  }

  console.log('📋 Configuration:');
  console.log(`  Application ID: ${applicationId}`);
  console.log(`  Location ID: ${locationId}`);
  console.log(`  Environment: Sandbox`);

  try {
    const client = new SquareClient({
      token: process.env.SQUARE_ACCESS_TOKEN,
      environment: SquareEnvironment.Sandbox,
    });

    // Test creating a simple order
    console.log('\n📦 Testing Order Creation...');
    const testOrderData = {
      locationId: locationId,
      referenceId: `test-tokenization-${Date.now()}`,
      lineItems: [
        {
          name: 'Test Product',
          quantity: '1',
          basePriceMoney: {
            amount: BigInt(2500), // $25.00
            currency: 'AUD'
          }
        }
      ],
      fulfillments: [
        {
          type: 'PICKUP',
          pickupDetails: {
            recipient: {
              displayName: 'Test Customer',
              emailAddress: 'test@example.com'
            },
            pickupAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Pickup available tomorrow
          }
        }
      ]
    };

    const orderResponse = await client.orders.create({
      idempotencyKey: `test-order-${Date.now()}`,
      order: testOrderData
    });

    if (orderResponse.order) {
      console.log(`  ✅ Order created: ${orderResponse.order.id}`);
      console.log(`  Order state: ${orderResponse.order.state}`);
      
      // Test payment with a test token
      console.log('\n💳 Testing Payment Processing...');
      
      // Use a test source ID (this is what the frontend would send)
      const testSourceId = 'cnon:CA4SEtest123456789012345678901234567890';
      
      const paymentRequest = {
        idempotencyKey: `test-payment-${Date.now()}`,
        sourceId: testSourceId,
        amountMoney: {
          amount: BigInt(2500), // $25.00
          currency: 'AUD'
        },
        orderId: orderResponse.order.id,
        buyerEmailAddress: 'test@example.com',
        note: 'Test payment for tokenization verification'
      };

      try {
        const paymentResponse = await client.payments.create(paymentRequest);
        
        if (paymentResponse.payment) {
          console.log(`  ✅ Payment created: ${paymentResponse.payment.id}`);
          console.log(`  Payment status: ${paymentResponse.payment.status}`);
          console.log(`  Order ID: ${paymentResponse.payment.orderId}`);
          
          // Check if order state changed
          const updatedOrderResponse = await client.orders.search({
            locationIds: [locationId],
            query: {
              filter: {
                orderIdFilter: {
                  orderIds: [orderResponse.order.id]
                }
              }
            }
          });
          
          const updatedOrder = updatedOrderResponse.orders?.[0];
          if (updatedOrder) {
            console.log(`  Updated order state: ${updatedOrder.state}`);
          }
          
        } else {
          console.log(`  ❌ Payment creation failed: No payment response`);
        }
        
      } catch (paymentError) {
        console.log(`  ❌ Payment creation failed: ${paymentError.message}`);
        
        // Check if it's a tokenization issue
        if (paymentError.message.includes('source_id') || paymentError.message.includes('token')) {
          console.log(`  🔍 This appears to be a tokenization issue`);
          console.log(`  The test source ID may not be valid for processing`);
        }
      }
      
    } else {
      console.log(`  ❌ Order creation failed: No order response`);
    }

  } catch (error) {
    console.error('Error testing payment tokenization:', error);
  }

  console.log('\n🎯 Analysis:');
  console.log('  1. If order creation succeeds but payment fails with tokenization error:');
  console.log('     - The issue is with the Square Web Payments SDK tokenization');
  console.log('     - Check frontend tokenization process');
  console.log('  2. If payment succeeds but order remains OPEN:');
  console.log('     - The issue is with order state updates');
  console.log('     - Check webhook configuration');
  console.log('  3. If both succeed:');
  console.log('     - The issue may be with specific payment tokens from frontend');
}

testPaymentTokenization().catch(console.error); 
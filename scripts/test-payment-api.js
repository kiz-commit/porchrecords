const { SquareClient, SquareEnvironment } = require('square');

// Initialize Square client
const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: SquareEnvironment.Sandbox,
});

async function testPaymentAPI() {
  try {
    console.log('Testing payment API with fixed PCI compliance...');
    
    const locationId = process.env.SQUARE_LOCATION_ID;
    if (!locationId) {
      throw new Error('SQUARE_LOCATION_ID environment variable is required');
    }

    // Test data that should pass PCI compliance validation
    const testPaymentData = {
      sourceId: 'cnon', // Square test token (not sensitive data)
      cartItems: [
        {
          id: 'test-product-1',
          quantity: 1,
          product: {
            id: '3VGDQQU2ZN2YL3I3JOQGBUBP',
            title: 'Test Vinyl Record',
            price: 25.00,
            image: '/test-image.jpg'
          }
        }
      ],
      total: 25.00,
      subtotal: 25.00,
      shippingCost: 0,
      gstAmount: 2.27,
      customerInfo: {
        firstName: 'Test',
        lastName: 'Customer',
        email: 'test@example.com',
        phone: '+61412345678',
        address: '123 Test St',
        city: 'Adelaide',
        state: 'SA',
        postalCode: '5000',
        country: 'AU'
      },
      deliveryMethod: 'pickup',
      isPresale: false
    };

    console.log('✅ Test payment data prepared (should pass PCI validation)');
    console.log('Data structure:', {
      hasSourceId: !!testPaymentData.sourceId,
      cartItemsCount: testPaymentData.cartItems.length,
      total: testPaymentData.total,
      customerInfo: {
        firstName: testPaymentData.customerInfo.firstName,
        email: testPaymentData.customerInfo.email
      }
    });

    // Test the payment API endpoint
    console.log('\n🔄 Testing payment API endpoint...');
    
    const response = await fetch('http://localhost:3000/api/process-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPaymentData),
    });

    console.log('Response status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Payment API test successful!');
      console.log('Response:', {
        success: result.success,
        hasOrderId: !!result.orderId,
        hasPaymentId: !!result.paymentId,
        message: result.message
      });
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.log('❌ Payment API test failed');
      console.log('Error:', errorData.error || `HTTP ${response.status}`);
      console.log('Details:', errorData);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the development server is running on http://localhost:3000');
    }
  }
}

// Run the test
testPaymentAPI(); 
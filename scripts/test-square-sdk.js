// Test script to verify Square SDK functionality
console.log('Testing Square SDK functionality...');

// Check if we're in a browser environment
if (typeof window === 'undefined') {
  console.log('❌ This script must run in a browser environment');
  process.exit(1);
}

// Check if Square SDK is loaded
if (!window.Square) {
  console.log('❌ Square SDK not loaded');
  console.log('💡 Make sure the Square script is included in the page');
  process.exit(1);
}

console.log('✅ Square SDK loaded successfully');

// Test Square configuration
const applicationId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
const locationId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;

console.log('Square Configuration:');
console.log('- Application ID:', applicationId ? 'Set' : 'Not set');
console.log('- Location ID:', locationId || 'Not set');

if (!applicationId) {
  console.log('❌ Square Application ID not configured');
  process.exit(1);
}

// Test Square payments initialization
async function testSquarePayments() {
  try {
    console.log('🔄 Testing Square payments initialization...');
    
    const payments = await window.Square.payments(applicationId, locationId);
    console.log('✅ Square payments initialized successfully');
    
    // Test card form creation
    console.log('🔄 Testing card form creation...');
    const card = await payments.card({
      style: {
        '.input-container.is-focus': {
          borderColor: '#f97316'
        },
        '.input-container': {
          borderColor: '#d1d5db',
          borderRadius: '8px'
        }
      }
    });
    
    console.log('✅ Card form created successfully');
    console.log('✅ Square SDK is working properly!');
    
    return card;
  } catch (error) {
    console.error('❌ Square payments test failed:', error);
    throw error;
  }
}

// Run the test
testSquarePayments().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
}); 
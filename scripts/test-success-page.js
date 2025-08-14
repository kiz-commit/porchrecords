// Test script to generate a test order ID for success page testing
const testOrderId = 'TEST_ORDER_' + Date.now();
const testUrl = `http://localhost:3000/store/success?orderId=${testOrderId}`;

console.log('🧪 Test Order Success Page');
console.log('========================');
console.log(`Test Order ID: ${testOrderId}`);
console.log(`Test URL: ${testUrl}`);
console.log('');
console.log('📋 Steps to test:');
console.log('1. Copy the Test URL above');
console.log('2. Paste it in your browser');
console.log('3. The success page should load with fallback data');
console.log('4. Check that the page displays correctly');
console.log('');
console.log('🔍 What to look for:');
console.log('- Order confirmation displays');
console.log('- Payment information shows');
console.log('- Next steps section is visible');
console.log('- Action buttons work (Continue Shopping, View Order History)'); 
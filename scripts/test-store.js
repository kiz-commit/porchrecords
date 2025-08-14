const fetch = require('node-fetch');

async function testStore() {
  console.log('🧪 Testing Store System...\n');

  // Test 1: Check products cache API
  console.log('1. Testing products cache API...');
  try {
    const response = await fetch('http://localhost:3000/api/products/cache');
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Products API working');
      console.log(`   - Found ${data.products.length} products`);
      console.log(`   - From cache: ${data.fromCache}`);
      console.log(`   - Using fallback: ${data.fallback || false}`);
      
      data.products.forEach(product => {
        console.log(`   - ${product.title} (${product.productType}) - $${product.price}`);
      });
    } else {
      console.log('❌ Products API failed:', data.error);
    }
  } catch (error) {
    console.log('❌ Error testing products API:', error.message);
  }

  // Test 2: Check store page
  console.log('\n2. Testing store page...');
  try {
    const response = await fetch('http://localhost:3000/store');
    if (response.ok) {
      console.log('✅ Store page loading successfully');
    } else {
      console.log('❌ Store page failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Error testing store page:', error.message);
  }

  // Test 3: Check voucher page
  console.log('\n3. Testing voucher page...');
  try {
    const response = await fetch('http://localhost:3000/store/voucher-product/P523TCCIJN4PAV2MP3R2EGS2');
    if (response.ok) {
      console.log('✅ Voucher page loading successfully');
    } else {
      console.log('❌ Voucher page failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Error testing voucher page:', error.message);
  }

  // Test 4: Check admin discounts page (should redirect to login)
  console.log('\n4. Testing admin discounts page...');
  try {
    const response = await fetch('http://localhost:3000/admin/discounts');
    if (response.status === 307) {
      console.log('✅ Admin discounts page redirecting to login (expected)');
    } else {
      console.log(`⚠️  Admin discounts page returned: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Error testing admin page:', error.message);
  }

  console.log('\n🎉 Store system test completed!');
  console.log('\nReady to test manually:');
  console.log('1. Visit: http://localhost:3000/store');
  console.log('2. Visit: http://localhost:3000/store/voucher-product/P523TCCIJN4PAV2MP3R2EGS2');
  console.log('3. Test the voucher flow with custom amounts');
}

testStore().catch(console.error); 
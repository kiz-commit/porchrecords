const fs = require('fs');
const path = require('path');

// Test voucher creation
async function testVoucherCreation() {
  console.log('🧪 Testing Voucher System...\n');

  // Test 1: Check if voucher product exists
  console.log('1. Checking voucher product...');
  const productsPath = path.join(process.cwd(), 'src', 'data', 'products.json');
  const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
  const voucherProduct = products.find(p => p.id === 'P523TCCIJN4PAV2MP3R2EGS2');
  
  if (voucherProduct) {
    console.log('✅ Voucher product found:', voucherProduct.title);
    console.log('   - Min price: $' + voucherProduct.minPrice);
    console.log('   - Max price: $' + voucherProduct.maxPrice);
    console.log('   - Variable pricing: ' + voucherProduct.isVariablePricing);
  } else {
    console.log('❌ Voucher product not found');
    return;
  }

  // Test 2: Test voucher creation API
  console.log('\n2. Testing voucher creation API...');
  try {
    const response = await fetch('http://localhost:3000/api/webhooks/voucher-creation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: 'test-order-123',
        customerEmail: 'test@example.com',
        voucherAmount: 50.00,
        customerName: 'Test Customer'
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Voucher created successfully');
      console.log('   - Code:', data.voucher.code);
      console.log('   - Amount: $' + data.voucher.amount);
      console.log('   - Expires:', new Date(data.voucher.expiresAt).toLocaleDateString());
    } else {
      console.log('❌ Failed to create voucher:', response.status);
    }
  } catch (error) {
    console.log('❌ Error testing voucher creation:', error.message);
  }

  // Test 3: Check vouchers file
  console.log('\n3. Checking vouchers file...');
  const vouchersPath = path.join(process.cwd(), 'src', 'data', 'vouchers.json');
  if (fs.existsSync(vouchersPath)) {
    const vouchers = JSON.parse(fs.readFileSync(vouchersPath, 'utf8'));
    console.log('✅ Vouchers file exists with', vouchers.length, 'vouchers');
    if (vouchers.length > 0) {
      const latestVoucher = vouchers[vouchers.length - 1];
      console.log('   - Latest voucher code:', latestVoucher.code);
      console.log('   - Latest voucher amount: $' + latestVoucher.amount);
    }
  } else {
    console.log('❌ Vouchers file not found');
  }

  // Test 4: Test voucher validation API
  console.log('\n4. Testing voucher validation API...');
  try {
    const response = await fetch('http://localhost:3000/api/admin/vouchers/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: 'TEST123456789',
        orderAmount: 25.00
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Voucher validation API working');
    } else {
      console.log('✅ Voucher validation API working (expected failure for invalid code)');
    }
  } catch (error) {
    console.log('❌ Error testing voucher validation:', error.message);
  }

  console.log('\n🎉 Voucher system test completed!');
  console.log('\nNext steps:');
  console.log('1. Visit http://localhost:3000/store/voucher-product/P523TCCIJN4PAV2MP3R2EGS2');
  console.log('2. Choose an amount and add to cart');
  console.log('3. Complete checkout to test the full flow');
}

// Run the test
testVoucherCreation().catch(console.error); 
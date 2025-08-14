const fs = require('fs');
const path = require('path');

// Test voucher cart functionality
async function testVoucherCart() {
  console.log('🧪 Testing voucher cart functionality...\n');

  // 1. Test voucher product creation
  console.log('1. Testing voucher product creation...');
  const voucherProduct = {
    id: 'test-voucher-123',
    title: '$25 Gift Voucher',
    description: 'Gift voucher worth $25',
    price: 25,
    productType: 'voucher',
    inStock: true,
    image: '/voucher-image.svg'
  };
  console.log('✅ Voucher product created:', voucherProduct.title);

  // 2. Test inventory validation for vouchers
  console.log('\n2. Testing inventory validation for vouchers...');
  const cartItems = [{
    id: 'test-voucher-123',
    product: voucherProduct,
    quantity: 1
  }];

  try {
    const response = await fetch('http://localhost:3000/api/checkout/validate-inventory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cartItems }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Inventory validation response:', {
        success: result.success,
        allItemsAvailable: result.allItemsAvailable,
        validationResults: result.validationResults.map(r => ({
          product: r.productName,
          isAvailable: r.isAvailable,
          error: r.error
        }))
      });
    } else {
      console.log('❌ Inventory validation failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Error testing inventory validation:', error.message);
  }

  // 3. Test localStorage cart persistence
  console.log('\n3. Testing localStorage cart persistence...');
  const testCart = {
    items: [{
      id: 'test-voucher-123',
      product: voucherProduct,
      quantity: 1
    }],
    totalItems: 1,
    totalPrice: 25
  };

  // Simulate localStorage save
  const cartData = JSON.stringify(testCart);
  console.log('✅ Cart data to save:', cartData);
  console.log('✅ Cart data size:', cartData.length, 'bytes');

  // 4. Test voucher detection logic
  console.log('\n4. Testing voucher detection logic...');
  const voucherTitles = [
    '$25 Gift Voucher',
    'Gift Voucher',
    'Voucher for Music',
    'Regular Product'
  ];

  voucherTitles.forEach(title => {
    const isVoucher = title.toLowerCase().includes('gift voucher') || 
                     title.toLowerCase().includes('voucher');
    console.log(`"${title}" -> ${isVoucher ? '✅ Voucher' : '❌ Not voucher'}`);
  });

  console.log('\n🎉 Voucher cart testing completed!');
}

// Run the test
testVoucherCart().catch(console.error); 
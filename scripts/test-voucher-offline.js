const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Voucher System (Offline)...\n');

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
  console.log('   - Product type: ' + voucherProduct.productType);
} else {
  console.log('❌ Voucher product not found');
  process.exit(1);
}

// Test 2: Check vouchers file
console.log('\n2. Checking vouchers file...');
const vouchersPath = path.join(process.cwd(), 'src', 'data', 'vouchers.json');
if (fs.existsSync(vouchersPath)) {
  const vouchers = JSON.parse(fs.readFileSync(vouchersPath, 'utf8'));
  console.log('✅ Vouchers file exists with', vouchers.length, 'vouchers');
  if (vouchers.length > 0) {
    const latestVoucher = vouchers[vouchers.length - 1];
    console.log('   - Latest voucher code:', latestVoucher.code);
    console.log('   - Latest voucher amount: $' + latestVoucher.amount);
    console.log('   - Latest voucher status:', latestVoucher.status);
  }
} else {
  console.log('✅ Vouchers file will be created when first voucher is made');
}

// Test 3: Check if voucher pages exist
console.log('\n3. Checking voucher pages...');
const voucherPagePath = path.join(process.cwd(), 'src', 'app', 'store', 'voucher', '[id]', 'page.tsx');
const successPagePath = path.join(process.cwd(), 'src', 'app', 'store', 'voucher', 'success', 'page.tsx');

if (fs.existsSync(voucherPagePath)) {
  console.log('✅ Voucher product page exists');
} else {
  console.log('❌ Voucher product page missing');
}

if (fs.existsSync(successPagePath)) {
  console.log('✅ Voucher success page exists');
} else {
  console.log('❌ Voucher success page missing');
}

// Test 4: Check API endpoints
console.log('\n4. Checking API endpoints...');
const voucherCreationPath = path.join(process.cwd(), 'src', 'app', 'api', 'webhooks', 'voucher-creation', 'route.ts');
const voucherValidatePath = path.join(process.cwd(), 'src', 'app', 'api', 'admin', 'vouchers', 'validate', 'route.ts');

if (fs.existsSync(voucherCreationPath)) {
  console.log('✅ Voucher creation API exists');
} else {
  console.log('❌ Voucher creation API missing');
}

if (fs.existsSync(voucherValidatePath)) {
  console.log('✅ Voucher validation API exists');
} else {
  console.log('❌ Voucher validation API missing');
}

// Test 5: Check types
console.log('\n5. Checking type definitions...');
const typesPath = path.join(process.cwd(), 'src', 'lib', 'types.ts');
const typesContent = fs.readFileSync(typesPath, 'utf8');

if (typesContent.includes("'voucher'")) {
  console.log('✅ Voucher product type defined');
} else {
  console.log('❌ Voucher product type missing');
}

if (typesContent.includes('isVariablePricing')) {
  console.log('✅ Variable pricing fields defined');
} else {
  console.log('❌ Variable pricing fields missing');
}

console.log('\n🎉 Voucher system offline test completed!');
console.log('\nReady to test:');
console.log('1. Start your development server: npm run dev');
console.log('2. Visit: http://localhost:3000/store/voucher-product/P523TCCIJN4PAV2MP3R2EGS2');
console.log('3. Choose an amount and test the full flow'); 
require('dotenv').config({ path: '.env.local' });

async function testEditProduct() {
  console.log('\nTesting edit product functionality...\n');

  const productId = '3VGDQQU2ZN2YL3I3JOQGBUBP';

  // Test 1: Fetch current product
  console.log('1. Fetching current product...');
  try {
    const getResponse = await fetch(`http://localhost:3000/api/admin/products/${productId}`);
    const getData = await getResponse.json();
    
    if (getResponse.ok) {
      console.log('✅ Product fetched successfully');
      console.log(`   Title: ${getData.product.title}`);
      console.log(`   Description: ${getData.product.description}`);
      console.log(`   Visible: ${getData.product.isVisible}`);
      console.log(`   Preorder: ${getData.product.isPreorder}`);
    } else {
      console.log('❌ Failed to fetch product:', getData.error);
      return;
    }
  } catch (error) {
    console.log('❌ Error fetching product:', error.message);
    return;
  }

  // Test 2: Update product
  console.log('\n2. Updating product...');
  try {
    const updateData = {
      title: 'Updated via Test Script',
      description: 'This product was updated via the test script',
      isVisible: false,
      isPreorder: true
    };

    const patchResponse = await fetch(`http://localhost:3000/api/admin/products/${productId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    const patchData = await patchResponse.json();

    if (patchResponse.ok) {
      console.log('✅ Product updated successfully');
      console.log(`   New Title: ${patchData.product.title}`);
      console.log(`   New Description: ${patchData.product.description}`);
      console.log(`   New Visible: ${patchData.product.isVisible}`);
      console.log(`   New Preorder: ${patchData.product.isPreorder}`);
    } else {
      console.log('❌ Failed to update product:', patchData.error);
      return;
    }
  } catch (error) {
    console.log('❌ Error updating product:', error.message);
    return;
  }

  // Test 3: Verify update
  console.log('\n3. Verifying update...');
  try {
    const verifyResponse = await fetch(`http://localhost:3000/api/admin/products/${productId}`);
    const verifyData = await verifyResponse.json();
    
    if (verifyResponse.ok) {
      console.log('✅ Update verified successfully');
      console.log(`   Title: ${verifyData.product.title}`);
      console.log(`   Description: ${verifyData.product.description}`);
      console.log(`   Visible: ${verifyData.product.isVisible}`);
      console.log(`   Preorder: ${verifyData.product.isPreorder}`);
    } else {
      console.log('❌ Failed to verify update:', verifyData.error);
    }
  } catch (error) {
    console.log('❌ Error verifying update:', error.message);
  }

  // Test 4: Check if product is hidden from store
  console.log('\n4. Checking store visibility...');
  try {
    const storeResponse = await fetch('http://localhost:3000/api/admin/inventory');
    const storeData = await storeResponse.json();
    
    const hiddenProduct = storeData.products.find(p => p.id === productId);
    if (hiddenProduct) {
      console.log(`   Product found in store: ${hiddenProduct.isVisible ? 'Visible' : 'Hidden'}`);
    } else {
      console.log('   Product not found in store (should be hidden)');
    }
  } catch (error) {
    console.log('❌ Error checking store visibility:', error.message);
  }
}

testEditProduct(); 
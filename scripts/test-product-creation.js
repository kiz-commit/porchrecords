require('dotenv').config({ path: '.env.local' });

async function testProductCreation() {
  console.log('Testing product creation with visibility and preorder settings...\n');

  // Test 1: Create a visible product
  console.log('1. Creating a visible product...');
  try {
    const visibleProduct = await fetch('http://localhost:3000/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Visible Product',
        artist: 'Test Artist',
        price: 29.99,
        description: 'A test product that should be visible in the store',
        isVisible: true,
        isPreorder: false,
      }),
    });

    if (visibleProduct.ok) {
      console.log('✅ Visible product created successfully');
    } else {
      console.log('❌ Failed to create visible product');
    }
  } catch (error) {
    console.log('❌ Error creating visible product:', error.message);
  }

  // Test 2: Create a hidden product
  console.log('\n2. Creating a hidden product...');
  try {
    const hiddenProduct = await fetch('http://localhost:3000/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Hidden Product',
        artist: 'Test Artist',
        price: 19.99,
        description: 'A test product that should be hidden from the store',
        isVisible: false,
        isPreorder: false,
      }),
    });

    if (hiddenProduct.ok) {
      console.log('✅ Hidden product created successfully');
    } else {
      console.log('❌ Failed to create hidden product');
    }
  } catch (error) {
    console.log('❌ Error creating hidden product:', error.message);
  }

  // Test 3: Create a preorder product
  console.log('\n3. Creating a preorder product...');
  try {
    const preorderProduct = await fetch('http://localhost:3000/api/admin/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Preorder Product',
        artist: 'Test Artist',
        price: 39.99,
        description: 'A test product that should be available for preorder',
        isVisible: true,
        isPreorder: true,
      }),
    });

    if (preorderProduct.ok) {
      console.log('✅ Preorder product created successfully');
    } else {
      console.log('❌ Failed to create preorder product');
    }
  } catch (error) {
    console.log('❌ Error creating preorder product:', error.message);
  }

  // Test 4: Check inventory to see the products
  console.log('\n4. Checking inventory for created products...');
  try {
    const inventoryResponse = await fetch('http://localhost:3000/api/admin/inventory');
    const inventoryData = await inventoryResponse.json();
    
    console.log('📦 Current products in inventory:');
    inventoryData.products.forEach(product => {
      console.log(`  - ${product.title} (${product.artist})`);
      console.log(`    Price: $${product.price}`);
      console.log(`    Visible: ${product.isVisible ? 'Yes' : 'No'}`);
      console.log(`    Preorder: ${product.isPreorder ? 'Yes' : 'No'}`);
      console.log(`    Stock: ${product.stockQuantity} (${product.stockStatus})`);
      console.log('');
    });
  } catch (error) {
    console.log('❌ Error fetching inventory:', error.message);
  }
}

testProductCreation(); 
require('dotenv').config({ path: '.env.local' });

async function testPreorders() {
  console.log('\nTesting preorders functionality...\n');

  // Test 1: Check current preorder products in inventory
  console.log('1. Checking preorder products in inventory...');
  try {
    const inventoryResponse = await fetch('http://localhost:3000/api/admin/inventory');
    const inventoryData = await inventoryResponse.json();
    
    const preorderProducts = inventoryData.products.filter(p => p.isPreorder);
    console.log(`✅ Found ${preorderProducts.length} preorder products in inventory:`);
    preorderProducts.forEach(product => {
      console.log(`   - ${product.title} (${product.id})`);
    });
  } catch (error) {
    console.log('❌ Error checking inventory:', error.message);
    return;
  }

  // Test 2: Check current preorders data
  console.log('\n2. Checking current preorders data...');
  try {
    const preordersResponse = await fetch('http://localhost:3000/api/admin/preorders');
    const preordersData = await preordersResponse.json();
    
    console.log(`✅ Found ${preordersData.preorders.length} preorder entries:`);
    preordersData.preorders.forEach(preorder => {
      console.log(`   - ${preorder.productName} (${preorder.productId})`);
      console.log(`     Max Quantity: ${preorder.preorderMaxQuantity}`);
      console.log(`     Release Date: ${preorder.preorderReleaseDate}`);
    });
  } catch (error) {
    console.log('❌ Error checking preorders:', error.message);
    return;
  }

  // Test 3: Create a new preorder for the second preorder product
  console.log('\n3. Creating preorder for second product...');
  try {
    const inventoryResponse = await fetch('http://localhost:3000/api/admin/inventory');
    const inventoryData = await inventoryResponse.json();
    
    const preorderProducts = inventoryData.products.filter(p => p.isPreorder);
    if (preorderProducts.length > 1) {
      const secondProduct = preorderProducts[1];
      
      const createResponse = await fetch('http://localhost:3000/api/admin/preorders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: secondProduct.id,
          preorderReleaseDate: '2025-03-15',
          preorderMaxQuantity: 50,
        }),
      });

      if (createResponse.ok) {
        console.log(`✅ Created preorder for ${secondProduct.title}`);
      } else {
        console.log('❌ Failed to create preorder');
      }
    } else {
      console.log('⚠️  Only one preorder product found, skipping creation test');
    }
  } catch (error) {
    console.log('❌ Error creating preorder:', error.message);
  }

  // Test 4: Update preorder quantity
  console.log('\n4. Updating preorder quantity...');
  try {
    const updateResponse = await fetch('http://localhost:3000/api/admin/preorders/WLVTWLJDBY6Y45JKKXPA3FDL', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        preorderMaxQuantity: 125,
      }),
    });

    if (updateResponse.ok) {
      console.log('✅ Updated preorder quantity to 125');
    } else {
      console.log('❌ Failed to update preorder quantity');
    }
  } catch (error) {
    console.log('❌ Error updating preorder quantity:', error.message);
  }

  // Test 5: Verify final state
  console.log('\n5. Verifying final preorders state...');
  try {
    const finalResponse = await fetch('http://localhost:3000/api/admin/preorders');
    const finalData = await finalResponse.json();
    
    console.log('✅ Final preorders state:');
    finalData.preorders.forEach(preorder => {
      console.log(`   - ${preorder.productName} (${preorder.productId})`);
      console.log(`     Max Quantity: ${preorder.preorderMaxQuantity}`);
      console.log(`     Release Date: ${preorder.preorderReleaseDate}`);
    });
  } catch (error) {
    console.log('❌ Error checking final state:', error.message);
  }
}

testPreorders(); 
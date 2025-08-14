require('dotenv').config({ path: '.env.local' });
const { SquareClient, SquareEnvironment } = require('square');

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: SquareEnvironment.Sandbox
});

const locationId = process.env.SQUARE_LOCATION_ID;
const { getVoucherProductId } = require('../src/lib/voucher-config');
const voucherId = getVoucherProductId();

async function addVoucherInventory() {
  try {
    console.log('🎫 Adding inventory for voucher product...');
    console.log(`Location ID: ${locationId}`);
    console.log(`Voucher ID: ${voucherId}`);

    // First, let's check if the product exists in the catalog
    console.log('\n1. Checking if product exists in catalog...');
    const catalogResponse = await client.catalog.searchItems({});
    const voucherProduct = catalogResponse.items?.find(item => item.id === voucherId);
    
    if (!voucherProduct) {
      console.log('❌ Product not found in catalog');
      return;
    }
    
    console.log('✅ Product found in catalog:', voucherProduct.itemData?.name);
    
    // Get the variation ID
    const variationId = voucherProduct.itemData?.variations?.[0]?.id;
    if (!variationId) {
      console.log('❌ No variation found for product');
      return;
    }
    
    console.log('Variation ID:', variationId);

    // Check current inventory
    console.log('\n2. Checking current inventory...');
    const inventoryResponse = await client.inventory.batchGetCounts({
      locationIds: [locationId],
      catalogObjectIds: [variationId]
    });

    if (inventoryResponse.data && inventoryResponse.data.length > 0) {
      console.log('✅ Product already has inventory');
      console.log('Current inventory:', inventoryResponse.data[0]);
    } else {
      console.log('❌ No inventory found - adding inventory...');
      
      // Add inventory
      const updateResponse = await client.inventory.batchCreateChanges({
        changes: [{
          type: 'ADJUSTMENT',
          adjustment: {
            catalogObjectId: variationId,
            locationId: locationId,
            quantity: '999',
            fromState: 'NONE',
            toState: 'IN_STOCK',
            occurredAt: new Date().toISOString()
          }
        }],
        idempotencyKey: `voucher-inventory-${Date.now()}`
      });
      
      console.log('✅ Inventory added successfully');
      console.log('Update response:', JSON.stringify(updateResponse, null, 2));
    }

    // Verify the inventory
    console.log('\n3. Verifying inventory...');
    const verifyResponse = await client.inventory.batchGetCounts({
      locationIds: [locationId],
      catalogObjectIds: [variationId]
    });

    if (verifyResponse.data && verifyResponse.data.length > 0) {
      console.log('✅ Inventory verified');
      console.log('Final inventory:', verifyResponse.data[0]);
    } else {
      console.log('❌ Still no inventory found');
    }

  } catch (error) {
    console.error('❌ Error adding voucher inventory:', error);
    if (error.result && error.result.errors) {
      console.error('Square API errors:', error.result.errors);
    }
  }
}

addVoucherInventory();

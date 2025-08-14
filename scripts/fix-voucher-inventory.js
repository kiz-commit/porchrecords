require('dotenv').config({ path: '.env.local' });
const { SquareClient, SquareEnvironment } = require('square');

const squareClient = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: SquareEnvironment.Sandbox
});

const locationId = process.env.SQUARE_LOCATION_ID;
const voucherId = 'P523TCCIJN4PAV2MP3R2EGS2';

async function fixVoucherInventory() {
  try {
    console.log('🔧 Fixing voucher inventory...');
    console.log(`Location ID: ${locationId}`);
    console.log(`Voucher ID: ${voucherId}`);

    // 1. Check current inventory
    console.log('\n1. Checking current inventory...');
    const inventoryResponse = await squareClient.inventory.batchGetCounts({
      locationIds: [locationId],
      catalogObjectIds: [voucherId]
    });

    if (inventoryResponse.data && inventoryResponse.data.length > 0) {
      console.log('✅ Voucher already has inventory record');
      console.log('Current inventory:', inventoryResponse.data[0]);
    } else {
      console.log('❌ No inventory record found for voucher');
      
      // 2. Add inventory for the voucher
      console.log('\n2. Adding inventory for voucher...');
      const adjustResponse = await squareClient.inventory.batchCreateChanges({
        locationId: locationId,
        changes: [{
          type: 'ADJUSTMENT',
          adjustment: {
            catalogObjectId: voucherId,
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
      console.log('Adjustment response:', JSON.stringify(adjustResponse, null, 2));
    }

    // 3. Verify the fix
    console.log('\n3. Verifying inventory...');
    const verifyResponse = await squareClient.inventory.batchGetCounts({
      locationIds: [locationId],
      catalogObjectIds: [voucherId]
    });

    if (verifyResponse.data && verifyResponse.data.length > 0) {
      console.log('✅ Voucher inventory verified');
      console.log('Final inventory:', verifyResponse.data[0]);
    } else {
      console.log('❌ Still no inventory record');
    }

  } catch (error) {
    console.error('❌ Error fixing voucher inventory:', error);
    if (error.result && error.result.errors) {
      console.error('Square API errors:', error.result.errors);
    }
  }
}

fixVoucherInventory();

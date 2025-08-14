#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { SquareClient, SquareEnvironment } = require('square');

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: SquareEnvironment.Sandbox,
});

async function testSquareInventory() {
  try {
    console.log('Testing Square Inventory API...');
    console.log('Location ID:', process.env.SQUARE_LOCATION_ID);
    console.log('Access Token:', process.env.SQUARE_ACCESS_TOKEN ? 'Set' : 'Not set');

    // Test 1: Get location
    console.log('\n1. Testing location access...');
    try {
      const locationResponse = await client.locations.retrieveLocation({
        locationId: process.env.SQUARE_LOCATION_ID
      });
      console.log('✅ Location found:', locationResponse.location.name);
    } catch (error) {
      console.log('❌ Location error:', error.message);
    }

    // Test 2: Get catalog items
    console.log('\n2. Testing catalog access...');
    try {
      const catalogResponse = await client.catalog.searchItems({});
      console.log('✅ Catalog items found:', catalogResponse.items?.length || 0);
      
      if (catalogResponse.items && catalogResponse.items.length > 0) {
        const firstItem = catalogResponse.items[0];
        console.log('   First item:', firstItem.itemData?.name);
        
        if (firstItem.itemData?.variations && firstItem.itemData.variations.length > 0) {
          const variationId = firstItem.itemData.variations[0].id;
          console.log('   First variation ID:', variationId);
          
          // Test 3: Get inventory for this variation
          console.log('\n3. Testing inventory access...');
          try {
            const inventoryResponse = await client.inventory.batchGetCounts({
              locationIds: [process.env.SQUARE_LOCATION_ID],
              catalogObjectIds: [variationId],
            });
            console.log('✅ Inventory found:', inventoryResponse.data?.length || 0);
            
            if (inventoryResponse.data && inventoryResponse.data.length > 0) {
              console.log('   Current quantity:', inventoryResponse.data[0].quantity);
              
              // Test 4: Try to update inventory
              console.log('\n4. Testing inventory update...');
              try {
                const updateResponse = await client.inventory.batchCreateChanges({
                  changes: [
                    {
                      type: 'ADJUSTMENT',
                      adjustment: {
                        catalogObjectId: variationId,
                        locationId: process.env.SQUARE_LOCATION_ID,
                        quantity: '1',
                        fromState: 'NONE',
                        toState: 'IN_STOCK',
                        occurredAt: new Date().toISOString(),
                      },
                    },
                  ],
                  idempotencyKey: `test-inventory-update-${Date.now()}`,
                });
                console.log('✅ Inventory update successful');
              } catch (error) {
                console.log('❌ Inventory update error:', error.message);
                console.log('   Error details:', error.result?.errors || error);
              }
              
              // Test 5: Try with the specific product ID that was failing
              console.log('\n5. Testing with specific product ID: 3D6RSHP5UH33VBI5K5AFICR5');
              try {
                const updateResponse2 = await client.inventory.batchCreateChanges({
                  changes: [
                    {
                      type: 'ADJUSTMENT',
                      adjustment: {
                        catalogObjectId: '3D6RSHP5UH33VBI5K5AFICR5',
                        locationId: process.env.SQUARE_LOCATION_ID,
                        quantity: '1',
                        fromState: 'NONE',
                        toState: 'IN_STOCK',
                        occurredAt: new Date().toISOString(),
                      },
                    },
                  ],
                  idempotencyKey: `test-inventory-update-2-${Date.now()}`,
                });
                console.log('✅ Specific product inventory update successful');
              } catch (error) {
                console.log('❌ Specific product inventory update error:', error.message);
                console.log('   Error details:', error.result?.errors || error);
              }
            }
          } catch (error) {
            console.log('❌ Inventory error:', error.message);
            console.log('   This might indicate inventory tracking is not set up for this location');
          }
        }
      }
    } catch (error) {
      console.log('❌ Catalog error:', error.message);
    }

  } catch (error) {
    console.error('❌ General error:', error);
  }
}

testSquareInventory(); 
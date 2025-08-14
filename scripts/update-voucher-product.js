import { SquareClient, SquareEnvironment } from 'square';
import 'dotenv/config';

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: SquareEnvironment.Sandbox,
});

async function updateVoucherProduct() {
  try {
    console.log('🎫 Updating voucher product in Square...\n');

    const voucherId = 'ABW6CPAJEC5OQ7Y2IS25BTFN';
    
    // First, let's check if the voucher product exists
    console.log('🔍 Checking current voucher product...');
    
    try {
      const response = await client.catalog.object.get({ 
        objectId: voucherId 
      });
      
      if (response.object && response.object.type === 'ITEM') {
        const itemData = response.object.itemData;
        console.log('📦 Current Voucher Product Details:');
        console.log(`   Name: ${itemData.name}`);
        console.log(`   Description: ${itemData.description}`);
        console.log(`   Price: ${itemData.variations?.[0]?.itemVariationData?.priceMoney?.amount || 'Not set'}`);
        
        // Update the voucher product with better data
        const updatedObject = {
          ...response.object,
          itemData: {
            ...itemData,
            name: 'Gift Voucher',
            description: 'Perfect gift for music lovers! Choose your own amount. [HIDDEN FROM STORE]',
            variations: [
              {
                ...itemData.variations[0],
                itemVariationData: {
                  ...itemData.variations[0].itemVariationData,
                  name: 'Variable Amount Voucher',
                  pricingType: 'VARIABLE_PRICING',
                  // Remove fixed price for variable pricing
                  priceMoney: undefined,
                  // Add custom attributes for min/max amounts
                  customAttributeFilters: [
                    {
                      key: 'min_amount',
                      stringFilter: '10'
                    },
                    {
                      key: 'max_amount', 
                      stringFilter: '500'
                    }
                  ]
                }
              }
            ]
          }
        };

        console.log('\n🔄 Updating voucher product...');
        
        const upsertResponse = await client.catalog.object.upsert({
          idempotencyKey: `update-voucher-${Date.now()}`,
          object: updatedObject,
        });
        
        if (upsertResponse.object) {
          console.log('✅ Voucher product updated successfully!');
          console.log(`   New name: ${upsertResponse.object.itemData.name}`);
          console.log(`   New description: ${upsertResponse.object.itemData.description}`);
          console.log(`   Pricing type: ${upsertResponse.object.itemData.variations[0].itemVariationData.pricingType}`);
        } else {
          console.log('❌ Failed to update voucher product');
        }
      } else {
        console.log('❌ Voucher product not found or not an item');
      }
    } catch (error) {
      console.log('❌ Could not fetch voucher product:', error.message);
      console.log('   This might be due to API access issues.');
    }

  } catch (error) {
    console.error('❌ Error updating voucher product:', error);
  }
}

updateVoucherProduct(); 
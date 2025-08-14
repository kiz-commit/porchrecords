require('dotenv').config({ path: '.env.local' });
const { SquareClient, SquareEnvironment } = require('square');

const client = new SquareClient({
  environment: SquareEnvironment.Sandbox,
  token: process.env.SQUARE_ACCESS_TOKEN,
});

async function setupInventory() {
  try {
    console.log('Setting up inventory tracking in Square...');
    
    // First, let's check what items we have
    const response = await client.catalog.searchItems({});
    if (response.items && response.items.length > 0) {
      console.log(`Found ${response.items.length} items in Square catalog`);
      
      for (const item of response.items) {
        if (item.type === 'ITEM' && item.itemData?.variations) {
          console.log(`\nItem: ${item.itemData.name}`);
          
          for (const variation of item.itemData.variations) {
            if (variation.type === 'ITEM_VARIATION') {
              console.log(`  Variation: ${variation.itemVariationData?.name || 'Default'}`);
              console.log(`  ID: ${variation.id}`);
              console.log(`  Track Inventory: ${variation.itemVariationData?.trackInventory || false}`);
              console.log(`  Alert Threshold: ${variation.itemVariationData?.inventoryAlertThreshold || 'Not set'}`);
            }
          }
        }
      }
    } else {
      console.log('No items found in Square catalog');
    }
    
    console.log('\nTo enable inventory tracking:');
    console.log('1. Go to your Square Dashboard');
    console.log('2. Navigate to Items > Inventory');
    console.log('3. Enable inventory tracking for your items');
    console.log('4. Set up inventory counts for each item');
    console.log('5. Configure low stock alerts');
    console.log('\nAfter setting up inventory tracking in Square:');
    console.log('1. Run: npm run dev');
    console.log('2. Navigate to: http://localhost:3000/admin/inventory');
    console.log('3. Test inventory updates in the admin interface');
    console.log('4. Check store display at: http://localhost:3000/store');
    
  } catch (error) {
    console.error('Error setting up inventory:', error);
  }
}

setupInventory(); 
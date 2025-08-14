import { SquareClient, SquareEnvironment } from 'square';
import 'dotenv/config';

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: SquareEnvironment.Sandbox,
});

async function updateVoucherWithSquareImage() {
  try {
    console.log('🎫 Updating voucher product with Square image...\n');

    const voucherId = 'P523TCCIJN4PAV2MP3R2EGS2';
    
    // First, let's check if the voucher product exists and get its current state
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
        console.log(`   Current Image IDs: ${itemData.imageIds ? itemData.imageIds.join(', ') : 'None'}`);
        
        if (itemData.imageIds && itemData.imageIds.length > 0) {
          console.log('\n✅ Voucher already has images configured!');
          console.log('   The voucher should now display properly in the store.');
          return;
        }
      }
    } catch (error) {
      console.log('❌ Could not fetch voucher product:', error.message);
      console.log('   This might be due to API access issues.');
    }

    console.log('\n💡 To add an image to the voucher product in Square:');
    console.log('   1. Log into your Square Dashboard');
    console.log('   2. Go to Catalog > Items');
    console.log('   3. Find the "Voucher" product');
    console.log('   4. Click Edit');
    console.log('   5. Add an image (you can use the voucher-image.svg from public/)');
    console.log('   6. Save the changes');
    console.log('\n   Once you add an image in Square, it will automatically appear in the store!');

  } catch (error) {
    console.error('❌ Error updating voucher:', error);
  }
}

updateVoucherWithSquareImage(); 
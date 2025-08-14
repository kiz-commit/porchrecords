import { SquareClient, SquareEnvironment } from 'square';
import 'dotenv/config';

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: SquareEnvironment.Sandbox,
});

async function checkVoucherImages() {
  try {
    console.log('🔍 Checking voucher product images in Square...\n');

    // Get the voucher product
    const voucherId = 'P523TCCIJN4PAV2MP3R2EGS2';
    
    const response = await client.catalog.object.get({ 
      objectId: voucherId 
    });
    
    if (response.object && response.object.type === 'ITEM') {
      const itemData = response.object.itemData;
      console.log('📦 Voucher Product Details:');
      console.log(`   Name: ${itemData.name}`);
      console.log(`   Description: ${itemData.description}`);
      console.log(`   Image IDs: ${itemData.imageIds ? itemData.imageIds.join(', ') : 'None'}`);
      
      if (itemData.imageIds && itemData.imageIds.length > 0) {
        console.log('\n🖼️  Fetching image details...');
        
        for (const imageId of itemData.imageIds) {
          try {
            const imageResponse = await client.catalog.object.get({ 
              objectId: imageId 
            });
            
            if (imageResponse.object && imageResponse.object.type === 'IMAGE') {
              const imageData = imageResponse.object.imageData;
              console.log(`   Image ID: ${imageId}`);
              console.log(`   URL: ${imageData.url}`);
              console.log(`   Name: ${imageData.name || 'No name'}`);
            }
          } catch (imageError) {
            console.error(`   ❌ Error fetching image ${imageId}:`, imageError.message);
          }
        }
      } else {
        console.log('\n❌ No images configured for voucher product');
        console.log('💡 To add an image:');
        console.log('   1. Upload an image to Square catalog');
        console.log('   2. Update the voucher product with the image ID');
      }
    } else {
      console.log('❌ Voucher product not found or not an item');
    }

  } catch (error) {
    console.error('❌ Error checking voucher images:', error);
  }
}

checkVoucherImages(); 
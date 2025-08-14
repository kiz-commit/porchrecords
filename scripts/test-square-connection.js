import { SquareClient, SquareEnvironment } from 'square';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

async function testSquareConnection() {
  try {
    console.log('🧪 Testing Square API Connection\n');
    
    console.log('📋 Environment Check:');
    console.log(`   SQUARE_ACCESS_TOKEN: ${process.env.SQUARE_ACCESS_TOKEN ? '✅ Set' : '❌ Missing'}`);
    console.log(`   SQUARE_APPLICATION_ID: ${process.env.SQUARE_APPLICATION_ID || '❌ Missing'}`);
    console.log(`   SQUARE_LOCATION_ID: ${process.env.SQUARE_LOCATION_ID || '❌ Missing'}`);
    
    if (!process.env.SQUARE_ACCESS_TOKEN) {
      console.log('\n❌ SQUARE_ACCESS_TOKEN is missing from .env.local');
      return;
    }
    
    console.log(`\n🔑 Token: ${process.env.SQUARE_ACCESS_TOKEN.substring(0, 15)}...`);
    
    const client = new SquareClient({
      token: process.env.SQUARE_ACCESS_TOKEN,
      environment: SquareEnvironment.Sandbox,
    });
    
    console.log('\n🌐 Testing API connection...');
    
    try {
      const response = await client.catalog.searchItems({});
      console.log('✅ Square API connection successful!');
      console.log(`   Found ${response.items ? response.items.length : 0} items in catalog`);
      
      if (response.items && response.items.length > 0) {
        console.log('\n📦 Catalog Items:');
        response.items.forEach((item, index) => {
          if (item.type === 'ITEM') {
            const itemData = item.itemData;
            const imageCount = itemData.imageIds ? itemData.imageIds.length : 0;
            console.log(`   ${index + 1}. ${itemData.name}`);
            console.log(`      ID: ${item.id}`);
            console.log(`      Images: ${imageCount}`);
            if (imageCount > 0) {
              console.log(`      Image IDs: ${itemData.imageIds.join(', ')}`);
            }
          }
        });
        
        // Test fetching a specific image
        const firstItemWithImage = response.items.find(item => 
          item.type === 'ITEM' && item.itemData?.imageIds?.length > 0
        );
        
        if (firstItemWithImage) {
          console.log('\n🖼️  Testing image fetch...');
          const imageId = firstItemWithImage.itemData.imageIds[0];
          try {
            const imageResponse = await client.catalog.object.get({ objectId: imageId });
            if (imageResponse.object && imageResponse.object.type === 'IMAGE') {
              const imageData = imageResponse.object.imageData;
              console.log(`   ✅ Image URL: ${imageData.url}`);
              console.log(`   ✅ Image Name: ${imageData.name || 'No name'}`);
            }
          } catch (imageError) {
            console.log(`   ❌ Error fetching image: ${imageError.message}`);
          }
        }
      }
      
    } catch (error) {
      console.log('❌ Square API connection failed:');
      console.log(`   Error: ${error.message}`);
      
      if (error.statusCode === 401) {
        console.log('\n🔄 401 Authentication Error - Token needs to be regenerated');
        console.log('\n📝 Steps to fix:');
        console.log('   1. Go to https://developer.squareup.com/apps');
        console.log('   2. Sign in with your Square account');
        console.log('   3. Select your app: sandbox-sq0idb-ezUcxdUn3voWd4DOvsCgxA');
        console.log('   4. Click "Credentials" in the left sidebar');
        console.log('   5. Under "Sandbox Access Tokens", click "Generate"');
        console.log('   6. Copy the new token');
        console.log('   7. Update SQUARE_ACCESS_TOKEN in your .env.local file');
        console.log('   8. Restart your development server');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testSquareConnection(); 
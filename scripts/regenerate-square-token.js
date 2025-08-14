import { SquareClient, SquareEnvironment } from 'square';
import 'dotenv/config';

async function regenerateSquareToken() {
  try {
    console.log('🔧 Square API Token Regeneration Guide\n');
    
    console.log('📋 Current Configuration:');
    console.log(`   Application ID: ${process.env.SQUARE_APPLICATION_ID}`);
    console.log(`   Location ID: ${process.env.SQUARE_LOCATION_ID}`);
    console.log(`   Environment: Sandbox`);
    console.log(`   Current Token: ${process.env.SQUARE_ACCESS_TOKEN ? 'Present' : 'Missing'}`);
    
    if (process.env.SQUARE_ACCESS_TOKEN) {
      console.log(`   Token starts with: ${process.env.SQUARE_ACCESS_TOKEN.substring(0, 10)}...`);
    }
    
    console.log('\n🔑 To regenerate your Square access token:');
    console.log('   1. Go to https://developer.squareup.com/apps');
    console.log('   2. Sign in with your Square account');
    console.log('   3. Select your app (sandbox-sq0idb-ezUcxdUn3voWd4DOvsCgxA)');
    console.log('   4. Click on "Credentials" in the left sidebar');
    console.log('   5. Under "Sandbox Access Tokens", click "Generate"');
    console.log('   6. Copy the new token');
    console.log('   7. Update your .env.local file with the new token');
    
    console.log('\n🧪 Testing current token...');
    
    const client = new SquareClient({
      token: process.env.SQUARE_ACCESS_TOKEN,
      environment: SquareEnvironment.Sandbox,
    });
    
    try {
      const response = await client.catalog.searchItems({});
      console.log('✅ Current token is working!');
      console.log(`   Found ${response.items ? response.items.length : 0} items in catalog`);
      
      if (response.items && response.items.length > 0) {
        console.log('\n📦 Items with images:');
        let itemsWithImages = 0;
        response.items.forEach((item, index) => {
          if (item.type === 'ITEM' && item.itemData?.imageIds?.length > 0) {
            itemsWithImages++;
            console.log(`   ${index + 1}. ${item.itemData.name} - ${item.itemData.imageIds.length} image(s)`);
          }
        });
        console.log(`\n   Total items with images: ${itemsWithImages}`);
      }
      
    } catch (error) {
      console.log('❌ Current token is not working:');
      console.log(`   Error: ${error.message}`);
      
      if (error.statusCode === 401) {
        console.log('\n🔄 Token needs to be regenerated. Follow the steps above.');
      }
    }
    
    console.log('\n📝 After updating your token:');
    console.log('   1. Restart your development server');
    console.log('   2. Run: curl -X POST http://localhost:3000/api/products/cache');
    console.log('   3. Check the store to see Square images');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

regenerateSquareToken(); 
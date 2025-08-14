import { SquareClient, SquareEnvironment } from 'square';
import 'dotenv/config';

const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: SquareEnvironment.Sandbox,
});

async function diagnoseSquareAuth() {
  try {
    console.log('🔍 Diagnosing Square API authentication...\n');
    
    console.log('📋 Environment Variables:');
    console.log(`   SQUARE_ACCESS_TOKEN: ${process.env.SQUARE_ACCESS_TOKEN ? 'Set' : 'Not set'}`);
    console.log(`   SQUARE_APPLICATION_ID: ${process.env.SQUARE_APPLICATION_ID ? 'Set' : 'Not set'}`);
    console.log(`   SQUARE_LOCATION_ID: ${process.env.SQUARE_LOCATION_ID ? 'Set' : 'Not set'}`);
    
    if (process.env.SQUARE_ACCESS_TOKEN) {
      console.log(`   Token starts with: ${process.env.SQUARE_ACCESS_TOKEN.substring(0, 10)}...`);
      console.log(`   Token length: ${process.env.SQUARE_ACCESS_TOKEN.length} characters`);
    }
    
    console.log('\n🧪 Testing Square API connection...');
    
    try {
      // Try a simple API call
      const response = await client.catalog.searchItems({});
      console.log('✅ Square API connection successful!');
      console.log(`   Found ${response.items ? response.items.length : 0} items`);
      
      if (response.items && response.items.length > 0) {
        console.log('\n📦 Sample items:');
        response.items.slice(0, 3).forEach((item, index) => {
          if (item.type === 'ITEM') {
            const itemData = item.itemData;
            console.log(`   ${index + 1}. ${itemData.name} (ID: ${item.id})`);
            console.log(`      Images: ${itemData.imageIds ? itemData.imageIds.length : 0}`);
          }
        });
      }
      
    } catch (apiError) {
      console.log('❌ Square API connection failed:');
      console.log(`   Error: ${apiError.message}`);
      
      if (apiError.statusCode === 401) {
        console.log('\n🔧 401 Authentication Error - Possible solutions:');
        console.log('   1. Check if your Square access token is valid');
        console.log('   2. Verify you\'re using the correct environment (Sandbox vs Production)');
        console.log('   3. Regenerate your access token in Square Dashboard');
        console.log('   4. Ensure your Square app has the necessary permissions');
        
        console.log('\n📝 To regenerate your access token:');
        console.log('   1. Go to https://developer.squareup.com/apps');
        console.log('   2. Select your app');
        console.log('   3. Go to "Credentials" tab');
        console.log('   4. Generate a new access token');
        console.log('   5. Update your .env.local file');
      }
    }
    
  } catch (error) {
    console.error('❌ Error diagnosing Square auth:', error);
  }
}

diagnoseSquareAuth(); 
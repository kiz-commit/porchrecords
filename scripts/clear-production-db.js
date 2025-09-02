const fetch = require('node-fetch');

const BASE_URL = 'https://porch-records.fly.dev';

async function clearProductionDatabase() {
  console.log('🗑️  Clearing production database...');
  
  try {
    // First, let's check current product count
    const currentResponse = await fetch(`${BASE_URL}/api/store/products`);
    const currentData = await currentResponse.json();
    console.log(`📊 Current products in production: ${currentData.totalProducts}`);
    
    // Clear the database by running a sync that resets everything
    console.log('🔄 Running full sync to clear database...');
    
    const syncResponse = await fetch(`${BASE_URL}/api/admin/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        direction: 'pull',
        chunkSize: 1000, // Large chunk size to trigger reset
        startIndex: 0
      }),
    });

    if (!syncResponse.ok) {
      throw new Error(`HTTP ${syncResponse.status}: ${syncResponse.statusText}`);
    }

    const syncResult = await syncResponse.json();
    console.log('✅ Sync completed:', syncResult.message);
    
    // Check the new product count
    const newResponse = await fetch(`${BASE_URL}/api/store/products`);
    const newData = await newResponse.json();
    console.log(`📊 Products after sync: ${newData.totalProducts}`);
    
    console.log('🎉 Production database cleared successfully!');
    console.log('💡 You can now run a fresh test sync');
    
  } catch (error) {
    console.error('❌ Error clearing production database:', error.message);
    process.exit(1);
  }
}

clearProductionDatabase();

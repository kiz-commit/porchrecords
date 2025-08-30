const fetch = require('node-fetch');

const BASE_URL = 'https://porch-records.fly.dev';
const CHUNK_SIZE = 30; // Small chunks to complete quickly

async function runChunkedSync() {
  // Check for command line arguments
  const args = process.argv.slice(2);
  let startIndex = 0;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--startIndex' && args[i + 1]) {
      startIndex = parseInt(args[i + 1]);
      console.log(`🔄 Resuming sync from startIndex: ${startIndex}`);
      break;
    }
  }

  console.log('🚀 Starting chunked sync...');
  console.log(`📦 Chunk size: ${CHUNK_SIZE} products`);
  console.log(`📍 Starting from index: ${startIndex}`);
  console.log('');

  let totalSynced = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  let chunkNumber = Math.floor(startIndex / CHUNK_SIZE) + 1;

  try {
    while (true) {
      console.log(`🔄 Processing chunk ${chunkNumber} (startIndex: ${startIndex})...`);
      
      const response = await fetch(`${BASE_URL}/api/admin/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          direction: 'pull',
          chunkSize: CHUNK_SIZE,
          startIndex: startIndex
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Sync failed');
      }

      // Update totals
      totalSynced += result.syncedCount;
      totalSkipped += result.skippedCount;
      totalErrors += result.errorCount;

      console.log(`✅ Chunk ${chunkNumber} completed:`);
      console.log(`   📊 Synced: ${result.syncedCount}, Skipped: ${result.skippedCount}, Errors: ${result.errorCount}`);
      console.log(`   📈 Progress: ${result.totalProcessed}/${result.totalProducts} products processed`);
      console.log(`   🎯 Total so far: ${totalSynced} synced, ${totalSkipped} skipped, ${totalErrors} errors`);
      console.log('');

      // Check if sync is complete
      if (result.isComplete) {
        console.log('🎉 Full sync completed!');
        console.log(`📊 Final totals: ${totalSynced} synced, ${totalSkipped} skipped, ${totalErrors} errors`);
        break;
      }

      // Prepare for next chunk
      startIndex = result.nextChunk.startIndex;
      chunkNumber++;

      // Small delay between chunks to be nice to the API
      console.log('⏳ Waiting 2 seconds before next chunk...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('');
    }

  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    console.log('');
    console.log('📊 Partial results:');
    console.log(`   Synced: ${totalSynced}`);
    console.log(`   Skipped: ${totalSkipped}`);
    console.log(`   Errors: ${totalErrors}`);
    console.log(`   Last chunk: ${chunkNumber - 1}`);
    console.log(`   Next startIndex: ${startIndex}`);
    console.log('');
    console.log('💡 To continue from where it left off, run:');
    console.log(`   node scripts/chunked-sync.js --startIndex ${startIndex}`);
  }
}

runChunkedSync();

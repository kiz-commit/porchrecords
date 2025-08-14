// scripts/square-dump-items.js
const { SquareClient, SquareEnvironment } = require('square');
require('dotenv').config({ path: '.env.local' });

const client = new SquareClient({
  environment: SquareEnvironment.Sandbox,
  token: process.env.SQUARE_ACCESS_TOKEN,
});

async function main() {
  try {
    const response = await client.catalog.searchItems({});
    if (response.items && response.items.length > 0) {
      console.log('Found items:');
      for (const item of response.items) {
        console.log(`- ${item.id}: ${item.itemData?.name}`);
      }
    } else {
      console.log('No items found.');
    }
    // Print full JSON for manual inspection
    // function replacer(key, value) { return typeof value === 'bigint' ? value.toString() : value; }
    // console.log(JSON.stringify(response, replacer, 2));
  } catch (err) {
    console.error('Error fetching items:', err);
  }
}

main(); 
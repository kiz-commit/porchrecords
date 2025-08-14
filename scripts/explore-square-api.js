const { SquareClient, SquareEnvironment } = require('square');
require('dotenv').config();

const client = new SquareClient({
  environment: SquareEnvironment.Sandbox,
  token: process.env.SQUARE_ACCESS_TOKEN,
});

async function exploreSquareAPI() {
  try {
    console.log('Exploring Square API methods...\n');

    // Check all available properties on the client
    console.log('Available client properties:');
    const clientProps = Object.getOwnPropertyNames(client);
    clientProps.forEach(prop => {
      console.log(`- ${prop}`);
    });

    console.log('\nChecking specific API areas...');

    // Check if customers exists
    if (client.customers) {
      console.log('✓ customers API available');
      console.log('Customer methods:', Object.getOwnPropertyNames(client.customers));
    } else {
      console.log('✗ customers API not available');
    }

    // Check catalog API (we know this works)
    if (client.catalog) {
      console.log('✓ catalog API available');
      console.log('Catalog methods:', Object.getOwnPropertyNames(client.catalog));
    }

    // Check inventory API (we know this works)
    if (client.inventory) {
      console.log('✓ inventory API available');
      console.log('Inventory methods:', Object.getOwnPropertyNames(client.inventory));
    }

    // Check orders API
    if (client.orders) {
      console.log('✓ orders API available');
      console.log('Orders methods:', Object.getOwnPropertyNames(client.orders));
    }

    // Check payments API
    if (client.payments) {
      console.log('✓ payments API available');
      console.log('Payments methods:', Object.getOwnPropertyNames(client.payments));
    }

    // Check if there's a different way to access customers
    console.log('\nChecking for customer-related APIs...');
    const allProps = Object.getOwnPropertyNames(client);
    allProps.forEach(prop => {
      if (prop.toLowerCase().includes('customer')) {
        console.log(`Found customer-related property: ${prop}`);
        if (client[prop]) {
          console.log(`Methods:`, Object.getOwnPropertyNames(client[prop]));
        }
      }
    });

  } catch (error) {
    console.error('Exploration failed:', error);
  }
}

exploreSquareAPI(); 
const { SquareClient, SquareEnvironment } = require('square');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Initialize Square client
const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: SquareEnvironment.Sandbox
});

async function checkLocation() {
  try {
    const locationId = process.env.SQUARE_LOCATION_ID || 'LQQ99893BW2PD';
    console.log('Checking location:', locationId);
    
    const response = await client.locations.retrieveLocation(locationId);
    
    if (response.result.location) {
      const location = response.result.location;
      console.log('Location Details:');
      console.log('- Name:', location.name);
      console.log('- Country:', location.address?.country);
      console.log('- Address:', location.address);
      console.log('- Currency:', location.currency);
      console.log('- Language:', location.languageCode);
      console.log('- Timezone:', location.timezone);
    } else {
      console.log('Location not found');
    }
  } catch (error) {
    console.error('Error checking location:', error.message);
  }
}

checkLocation(); 
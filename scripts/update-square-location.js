const { SquareClient, SquareEnvironment } = require('square');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Initialize Square client
const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: SquareEnvironment.Sandbox
});

async function updateLocation() {
  try {
    const locationId = process.env.SQUARE_LOCATION_ID || 'LQQ99893BW2PD';
    console.log('Updating location:', locationId);
    
    // First, let's get the current location details
    console.log('Fetching current location details...');
    try {
      const currentLocation = await client.locations.retrieveLocation({ locationId });
      
      if (currentLocation.result.location) {
        console.log('Current location details:');
        console.log('- Name:', currentLocation.result.location.name);
        console.log('- Country:', currentLocation.result.location.address?.country);
        console.log('- Address:', currentLocation.result.location.address);
      }
    } catch (error) {
      console.log('Could not retrieve current location:', error.message);
    }
    
    // Update the location to Australia
    console.log('\nUpdating location to Australia...');
    const updateResponse = await client.locations.updateLocation({
      locationId,
      location: {
        address: {
          country: 'AU',
          administrativeDistrictLevel1: 'NSW', // New South Wales
          locality: 'Sydney',
          postalCode: '2000'
        }
      }
    });
    
    if (updateResponse.result.location) {
      const updatedLocation = updateResponse.result.location;
      console.log('\n✅ Location updated successfully!');
      console.log('Updated location details:');
      console.log('- Name:', updatedLocation.name);
      console.log('- Country:', updatedLocation.address?.country);
      console.log('- State:', updatedLocation.address?.administrativeDistrictLevel1);
      console.log('- City:', updatedLocation.address?.locality);
      console.log('- Postal Code:', updatedLocation.address?.postalCode);
      
      console.log('\n🎉 Your Square location is now configured for Australia!');
      console.log('The Web Payments SDK should now show "Postcode" instead of "ZIP".');
    } else {
      console.log('❌ Failed to update location');
    }
    
  } catch (error) {
    console.error('Error updating location:', error.message);
    if (error.result && error.result.errors) {
      console.error('Square API errors:', error.result.errors);
    }
  }
}

updateLocation(); 
require('dotenv').config({ path: '.env.local' });

const SQUARE_ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const LOCATION_ID = process.env.SQUARE_LOCATION_ID || 'LQQ99893BW2PD';

async function updateLocation() {
  try {
    console.log('Updating Square location to Australia...');
    console.log('Location ID:', LOCATION_ID);
    
    // First, get the current location
    console.log('\n1. Fetching current location...');
    const getResponse = await fetch(`https://connect.squareupsandbox.com/v2/locations/${LOCATION_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Square-Version': '2024-01-17'
      }
    });

    if (getResponse.ok) {
      const currentLocation = await getResponse.json();
      console.log('Current location details:');
      console.log('- Name:', currentLocation.location.name);
      console.log('- Country:', currentLocation.location.address?.country);
      console.log('- Address:', currentLocation.location.address);
    } else {
      console.log('Could not retrieve current location:', getResponse.status, getResponse.statusText);
    }

    // Update the location to Australia
    console.log('\n2. Updating location to Australia...');
    const updateResponse = await fetch(`https://connect.squareupsandbox.com/v2/locations/${LOCATION_ID}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${SQUARE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Square-Version': '2024-01-17'
      },
      body: JSON.stringify({
        location: {
          address: {
            address_line_1: '123 Test Street',
            locality: 'Sydney',
            administrative_district_level_1: 'NSW',
            postal_code: '2000',
            country: 'AU'
          }
        }
      })
    });

    if (updateResponse.ok) {
      const updatedLocation = await updateResponse.json();
      console.log('\n✅ Location updated successfully!');
      console.log('Updated location details:');
      console.log('- Name:', updatedLocation.location.name);
      console.log('- Country:', updatedLocation.location.address?.country);
      console.log('- State:', updatedLocation.location.address?.administrative_district_level_1);
      console.log('- City:', updatedLocation.location.address?.locality);
      console.log('- Postal Code:', updatedLocation.location.address?.postal_code);
      
      console.log('\n🎉 Your Square location is now configured for Australia!');
      console.log('The Web Payments SDK should now show "Postcode" instead of "ZIP".');
      console.log('\nPlease refresh your checkout page to see the changes.');
    } else {
      const errorData = await updateResponse.json().catch(() => ({}));
      console.error('❌ Failed to update location:', updateResponse.status, updateResponse.statusText);
      console.error('Error details:', errorData);
    }

  } catch (error) {
    console.error('Error updating location:', error.message);
  }
}

updateLocation(); 
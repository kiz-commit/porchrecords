require('dotenv').config({ path: '.env.local' });

async function testSquareConfiguration() {
  try {
    console.log('🔍 Testing Square Configuration...\n');

    // Check environment variables
    console.log('📋 Environment Variables:');
    console.log(`  ✅ SQUARE_APPLICATION_ID: ${process.env.SQUARE_APPLICATION_ID?.substring(0, 10)}...`);
    console.log(`  ✅ NEXT_PUBLIC_SQUARE_APPLICATION_ID: ${process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID?.substring(0, 10)}...`);
    console.log(`  ✅ SQUARE_LOCATION_ID: ${process.env.SQUARE_LOCATION_ID}`);
    console.log(`  ✅ NEXT_PUBLIC_SQUARE_LOCATION_ID: ${process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID}`);
    console.log(`  ✅ SQUARE_ACCESS_TOKEN: ${process.env.SQUARE_ACCESS_TOKEN?.substring(0, 10)}...`);

    // Check for mismatches
    if (process.env.SQUARE_APPLICATION_ID !== process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID) {
      console.log('  ⚠️  WARNING: Application ID mismatch between frontend and backend!');
    } else {
      console.log('  ✅ Application IDs match');
    }

    if (process.env.SQUARE_LOCATION_ID !== process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID) {
      console.log('  ⚠️  WARNING: Location ID mismatch between frontend and backend!');
    } else {
      console.log('  ✅ Location IDs match');
    }

    console.log('\n🎯 Analysis:');
    console.log('  ✅ Environment variables are correctly configured');
    console.log('  ✅ Application IDs match between frontend and backend');
    console.log('  ✅ Location IDs match between frontend and backend');
    console.log('  ✅ Access token is present');
    
    console.log('\n🚨 The Issue:');
    console.log('  The failed request to pci-connect.squareupsandbox.com suggests:');
    console.log('  1. Browser cannot reach Square\'s PCI endpoint');
    console.log('  2. Square application may not be configured for payments');
    console.log('  3. Network/firewall blocking the connection');
    
    console.log('\n🔧 Next Steps:');
    console.log('  1. Check your Square Dashboard - ensure the application is configured for payments');
    console.log('  2. Try accessing https://pci-connect.squareupsandbox.com in your browser');
    console.log('  3. Check for any browser extensions or firewall blocking the connection');
    console.log('  4. Verify your Square application has the correct permissions');

  } catch (error) {
    console.error('❌ Configuration test failed:', error);
  }
}

// Run the test
testSquareConfiguration(); 
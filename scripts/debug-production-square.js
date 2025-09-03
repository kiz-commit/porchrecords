#!/usr/bin/env node

// Debug script to test Square configuration in production environment
// This script helps diagnose why the card field isn't appearing

const https = require('https');
const { URL } = require('url');

// Production Square credentials from deploy script
const PRODUCTION_CONFIG = {
  SQUARE_APPLICATION_ID: 'sq0idp-DO4-C6DVEe-0KB8iLqvbCw',
  NEXT_PUBLIC_SQUARE_APPLICATION_ID: 'sq0idp-DO4-C6DVEe-0KB8iLqvbCw',
  SQUARE_LOCATION_ID: 'LZSZBJZR2Y504',
  NEXT_PUBLIC_SQUARE_LOCATION_ID: 'LZSZBJZR2Y504',
  SQUARE_ENVIRONMENT: 'production'
};

async function debugProductionSquare() {
  console.log('🔍 Debugging Production Square Configuration...\n');

  // 1. Check environment detection
  console.log('📋 Production Environment Check:');
  const appId = PRODUCTION_CONFIG.SQUARE_APPLICATION_ID;
  const environment = appId.startsWith('sandbox-') ? 'sandbox' : 'production';
  console.log(`  ✅ Application ID: ${appId.substring(0, 15)}...`);
  console.log(`  ✅ Detected Environment: ${environment}`);
  console.log(`  ✅ Location ID: ${PRODUCTION_CONFIG.SQUARE_LOCATION_ID}`);
  
  if (environment !== 'production') {
    console.log('  ⚠️  WARNING: Environment detection mismatch!');
  }

  // 2. Test Square SDK URLs
  console.log('\n🔗 Testing Square SDK URLs:');
  const sdkUrls = {
    sandbox: 'https://sandbox.web.squarecdn.com/v1/square.js',
    production: 'https://web.squarecdn.com/v1/square.js'
  };

  for (const [env, url] of Object.entries(sdkUrls)) {
    try {
      console.log(`  Testing ${env}: ${url}`);
      const response = await testUrl(url);
      console.log(`  ✅ ${env} SDK: ${response.statusCode} ${response.statusMessage}`);
      
      if (response.statusCode === 200) {
        console.log(`     Content-Type: ${response.headers['content-type']}`);
        console.log(`     Content-Length: ${response.headers['content-length']}`);
      }
    } catch (error) {
      console.log(`  ❌ ${env} SDK: ${error.message}`);
    }
  }

  // 3. Test production checkout page
  console.log('\n🌐 Testing Production Site:');
  try {
    const siteResponse = await testUrl('https://porch-records.fly.dev/checkout');
    console.log(`  ✅ Checkout page: ${siteResponse.statusCode} ${siteResponse.statusMessage}`);
  } catch (error) {
    console.log(`  ❌ Checkout page: ${error.message}`);
  }

  // 4. Common issues and solutions
  console.log('\n🔧 Common Issues and Solutions:');
  console.log('  1. Square SDK not loading:');
  console.log('     - Check network connectivity');
  console.log('     - Verify CDN availability');
  console.log('     - Check browser console for CORS errors');
  
  console.log('\n  2. Square object not available:');
  console.log('     - Ensure script loads completely before initialization');
  console.log('     - Check for JavaScript errors preventing SDK initialization');
  
  console.log('\n  3. Card form not attaching:');
  console.log('     - Verify card-container element exists in DOM');
  console.log('     - Check for CSS conflicts hiding the form');
  console.log('     - Ensure application ID and location ID are correct');

  console.log('\n  4. Production-specific issues:');
  console.log('     - Verify Square application is approved for production');
  console.log('     - Check domain whitelist in Square Dashboard');
  console.log('     - Ensure HTTPS is properly configured');

  // 5. Debugging steps for user
  console.log('\n📝 Next Steps for Debugging:');
  console.log('  1. Open browser developer tools on https://porch-records.fly.dev/checkout');
  console.log('  2. Check Console tab for Square-related errors');
  console.log('  3. Look for network requests to Square CDN');
  console.log('  4. Verify card-container element exists in DOM');
  console.log('  5. Check if Square object is available in console: window.Square');
  
  console.log('\n🎯 Updated component now includes:');
  console.log('  ✅ Comprehensive console logging');
  console.log('  ✅ Visual loading indicators');
  console.log('  ✅ Error messages with retry functionality');
  console.log('  ✅ Better error handling and user feedback');
}

function testUrl(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: 'HEAD',
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      resolve({
        statusCode: res.statusCode,
        statusMessage: res.statusMessage,
        headers: res.headers
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Run the debug
debugProductionSquare().catch(console.error);

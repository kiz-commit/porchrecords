const { SquareClient, SquareEnvironment } = require('square');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Initialize Square client
const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
});

async function checkMerchantSettings() {
  try {
    console.log('🔍 Checking Square Merchant Settings for Checkout API...\n');
    
    const locationId = process.env.SQUARE_LOCATION_ID || 'LQQ99893BW2PD';
    const squareAccessToken = process.env.SQUARE_ACCESS_TOKEN;
    
    if (!squareAccessToken) {
      throw new Error('SQUARE_ACCESS_TOKEN environment variable is required');
    }

    console.log('📍 Location ID:', locationId);
    console.log('🌍 Environment:', process.env.SQUARE_ENVIRONMENT || 'sandbox');
    console.log('');

    // Set up API URLs based on environment
    const baseApiUrl = process.env.SQUARE_ENVIRONMENT === 'production' 
      ? 'https://connect.squareup.com'
      : 'https://connect.squareupsandbox.com';

    // Check 1: Retrieve Merchant Settings
    console.log('1️⃣ Checking Merchant Settings...');
    try {
      const merchantSettingsResponse = await fetch(`${baseApiUrl}/v2/online-checkout/merchant-settings`, {
        method: 'GET',
        headers: {
          'Square-Version': '2023-12-13',
          'Authorization': `Bearer ${squareAccessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (merchantSettingsResponse.ok) {
        const settings = await merchantSettingsResponse.json();
        if (settings.merchant_settings) {
          console.log('✅ Merchant Settings Retrieved Successfully');
          console.log('   Merchant ID:', settings.merchant_settings.merchant_id);
          console.log('   Updated At:', settings.merchant_settings.updated_at);
          
          if (settings.merchant_settings.payment_methods) {
            const methods = settings.merchant_settings.payment_methods;
            console.log('   Payment Methods:');
            console.log('     - Apple Pay:', methods.apple_pay?.enabled ? '✅ Enabled' : '❌ Disabled');
            console.log('     - Google Pay:', methods.google_pay?.enabled ? '✅ Enabled' : '❌ Disabled');
            console.log('     - Cash App Pay:', methods.cash_app_pay?.enabled ? '✅ Enabled' : '❌ Disabled');
            console.log('     - Afterpay/Clearpay:', methods.afterpay_clearpay?.enabled ? '✅ Enabled' : '❌ Disabled');
            
            if (methods.afterpay_clearpay?.enabled) {
              const afterpay = methods.afterpay_clearpay;
              console.log('     - Afterpay Order Range:', afterpay.order_eligibility_range ? 
                `$${(afterpay.order_eligibility_range.min?.amount || 0) / 100} - $${(afterpay.order_eligibility_range.max?.amount || 0) / 100}` : 'Not set');
            }
          }
        } else {
          console.log('❌ No merchant settings found');
        }
      } else {
        const errorData = await merchantSettingsResponse.json();
        console.log('❌ Error retrieving merchant settings:', merchantSettingsResponse.status);
        console.log('   Error:', errorData);
      }
    } catch (error) {
      console.log('❌ Error retrieving merchant settings:', error.message);
    }

    console.log('');

    // Check 2: Retrieve Location Settings
    console.log('2️⃣ Checking Location Settings...');
    try {
      const locationSettingsResponse = await fetch(`${baseApiUrl}/v2/online-checkout/location-settings/${locationId}`, {
        method: 'GET',
        headers: {
          'Square-Version': '2023-12-13',
          'Authorization': `Bearer ${squareAccessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (locationSettingsResponse.ok) {
        const settings = await locationSettingsResponse.json();
        if (settings.location_settings) {
          console.log('✅ Location Settings Retrieved Successfully');
          console.log('   Location ID:', settings.location_settings.location_id);
          console.log('   Updated At:', settings.location_settings.updated_at);
          console.log('   Customer Notes:', settings.location_settings.customer_notes_enabled ? '✅ Enabled' : '❌ Disabled');
          
          if (settings.location_settings.policies && settings.location_settings.policies.length > 0) {
            console.log('   Policies:', settings.location_settings.policies.length, 'configured');
            settings.location_settings.policies.forEach(policy => {
              console.log(`     - ${policy.title}: ${policy.description}`);
            });
          } else {
            console.log('   Policies: None configured');
          }
          
          if (settings.location_settings.branding) {
            console.log('   Branding:');
            console.log('     - Header Type:', settings.location_settings.branding.header_type);
            console.log('     - Button Color:', settings.location_settings.branding.button_color);
            console.log('     - Button Shape:', settings.location_settings.branding.button_shape);
          } else {
            console.log('   Branding: Default settings');
          }
          
          if (settings.location_settings.tipping) {
            console.log('   Tipping:');
            console.log('     - Smart Tipping:', settings.location_settings.tipping.smart_tipping_enabled ? '✅ Enabled' : '❌ Disabled');
            console.log('     - Default Percent:', settings.location_settings.tipping.default_percent + '%');
            console.log('     - Percentages:', settings.location_settings.tipping.percentages?.join(', ') || 'Not set');
            if (settings.location_settings.tipping.whole_amounts && settings.location_settings.tipping.whole_amounts.length > 0) {
              console.log('     - Whole Amounts:', settings.location_settings.tipping.whole_amounts.map(amount => 
                `$${(amount.amount || 0) / 100}`).join(', '));
            }
          } else {
            console.log('   Tipping: Default settings');
          }
        } else {
          console.log('❌ No location settings found');
        }
      } else {
        const errorData = await locationSettingsResponse.json();
        console.log('❌ Error retrieving location settings:', locationSettingsResponse.status);
        console.log('   Error:', errorData);
      }
    } catch (error) {
      console.log('❌ Error retrieving location settings:', error.message);
    }

    console.log('');

    // Check 3: Verify Location Details
    console.log('3️⃣ Verifying Location Details...');
    try {
      const locationResponse = await client.locations.retrieveLocation(locationId);
      
      if (locationResponse.result.location) {
        const location = locationResponse.result.location;
        console.log('✅ Location Verified');
        console.log('   Name:', location.name);
        console.log('   Country:', location.address?.country);
        console.log('   Currency:', location.currency);
        console.log('   Language:', location.languageCode);
        console.log('   Status:', location.status);
      } else {
        console.log('❌ Location not found');
      }
    } catch (error) {
      console.log('❌ Error retrieving location:', error.message);
    }

    console.log('');

    // Check 4: Test Payment Link Creation
    console.log('4️⃣ Testing Payment Link Creation...');
    try {
      const paymentLinkData = {
        idempotency_key: `test-settings-${Date.now()}`,
        quick_pay: {
          name: 'Test Settings Check',
          price_money: {
            amount: 1000, // $10.00
            currency: 'AUD'
          },
          location_id: locationId,
          checkout_options: {
            allow_tipping: false,
            collect_shipping_address: false,
            redirect_url: 'https://example.com/success',
            ask_for_shipping_address: false,
            enable_coupon: false,
            enable_loyalty: false
          }
        }
      };

      const paymentLinkResponse = await fetch(`${baseApiUrl}/v2/online-checkout/payment-links`, {
        method: 'POST',
        headers: {
          'Square-Version': '2023-12-13',
          'Authorization': `Bearer ${squareAccessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentLinkData)
      });

      if (paymentLinkResponse.ok) {
        const result = await paymentLinkResponse.json();
        if (result.payment_link) {
          console.log('✅ Payment Link Creation Test Successful');
          console.log('   Payment Link ID:', result.payment_link.id);
          console.log('   URL:', result.payment_link.url);
          console.log('   Order ID:', result.payment_link.order_id);
          
          // Clean up - delete the test payment link
          try {
            const deleteResponse = await fetch(`${baseApiUrl}/v2/online-checkout/payment-links/${result.payment_link.id}`, {
              method: 'DELETE',
              headers: {
                'Square-Version': '2023-12-13',
                'Authorization': `Bearer ${squareAccessToken}`
              }
            });
            
            if (deleteResponse.ok) {
              console.log('   ✅ Test payment link cleaned up');
            } else {
              console.log('   ⚠️ Could not clean up test payment link');
            }
          } catch (cleanupError) {
            console.log('   ⚠️ Could not clean up test payment link:', cleanupError.message);
          }
        } else {
          console.log('❌ Payment link creation failed');
        }
      } else {
        const errorData = await paymentLinkResponse.json();
        console.log('❌ Error creating test payment link:', paymentLinkResponse.status);
        console.log('   Error:', errorData);
      }
    } catch (error) {
      console.log('❌ Error creating test payment link:', error.message);
    }

    console.log('');
    console.log('🎯 Settings Check Complete!');
    console.log('');
    console.log('📋 Recommendations:');
    console.log('1. Ensure all required payment methods are enabled for your business');
    console.log('2. Configure branding settings to match your brand');
    console.log('3. Set up appropriate tipping options if needed');
    console.log('4. Configure return/shipping policies');
    console.log('5. Test the complete checkout flow in your environment');

  } catch (error) {
    console.error('❌ Settings check failed:', error.message);
    process.exit(1);
  }
}

// Run the check
checkMerchantSettings(); 
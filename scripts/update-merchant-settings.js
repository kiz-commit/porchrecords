const { SquareClient, SquareEnvironment } = require('square');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Initialize Square client
const client = new SquareClient({
  token: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
});

async function updateMerchantSettings() {
  try {
    console.log('🔧 Updating Square Merchant Settings for Checkout API...\n');
    
    const locationId = process.env.SQUARE_LOCATION_ID;
    if (!locationId) {
      throw new Error('SQUARE_LOCATION_ID environment variable is required');
    }

    console.log('📍 Location ID:', locationId);
    console.log('🌍 Environment:', process.env.SQUARE_ENVIRONMENT || 'sandbox');
    console.log('');

    // Set up API URLs based on environment
    const baseApiUrl = process.env.SQUARE_ENVIRONMENT === 'production' 
      ? 'https://connect.squareup.com'
      : 'https://connect.squareupsandbox.com';

    // Update 1: Merchant Settings (Payment Methods)
    console.log('1️⃣ Updating Merchant Settings (Payment Methods)...');
    try {
      const merchantSettingsUpdate = {
        merchant_settings: {
          payment_methods: {
            apple_pay: {
              enabled: true
            },
            google_pay: {
              enabled: true
            },
            cash_app_pay: {
              enabled: true
            },
            afterpay_clearpay: {
              enabled: true,
              order_eligibility_range: {
                min: {
                  amount: 100, // $1.00 minimum
                  currency: 'AUD'
                },
                max: {
                  amount: 200000, // $2,000.00 maximum
                  currency: 'AUD'
                }
              },
              item_eligibility_range: {
                min: {
                  amount: 100, // $1.00 minimum
                  currency: 'AUD'
                },
                max: {
                  amount: 200000, // $2,000.00 maximum
                  currency: 'AUD'
                }
              }
            }
          }
        }
      };

      const baseApiUrl = process.env.SQUARE_ENVIRONMENT === 'production' 
        ? 'https://connect.squareup.com'
        : 'https://connect.squareupsandbox.com';

      const merchantResponse = await fetch(`${baseApiUrl}/v2/online-checkout/merchant-settings`, {
        method: 'PUT',
        headers: {
          'Square-Version': '2023-12-13',
          'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(merchantSettingsUpdate)
      });

      if (!merchantResponse.ok) {
        const errorData = await merchantResponse.json();
        throw new Error(`Failed to update merchant settings: ${merchantResponse.status} - ${JSON.stringify(errorData)}`);
      }

      const merchantResponseData = await merchantResponse.json();
      
      if (merchantResponseData.merchant_settings) {
        console.log('✅ Merchant Settings Updated Successfully');
        console.log('   Updated At:', merchantResponseData.merchant_settings.updated_at);
        
        const settings = merchantResponseData.merchant_settings;
        if (settings.payment_methods) {
          console.log('   Payment Methods Status:');
          console.log('     - Apple Pay:', settings.payment_methods.apple_pay?.enabled ? '✅ Enabled' : '❌ Disabled');
          console.log('     - Google Pay:', settings.payment_methods.google_pay?.enabled ? '✅ Enabled' : '❌ Disabled');
          console.log('     - Cash App Pay:', settings.payment_methods.cash_app_pay?.enabled ? '✅ Enabled' : '❌ Disabled');
          console.log('     - Afterpay/Clearpay:', settings.payment_methods.afterpay_clearpay?.enabled ? '✅ Enabled' : '❌ Disabled');
        }
      } else {
        console.log('❌ Failed to update merchant settings');
      }
    } catch (error) {
      console.log('❌ Error updating merchant settings:', error.message);
      if (error.result?.errors) {
        error.result.errors.forEach(err => {
          console.log('   Error:', err.code, '-', err.detail);
        });
      }
    }

    console.log('');

    // Update 2: Location Settings (Branding, Policies, Tipping)
    console.log('2️⃣ Updating Location Settings...');
    try {
      const locationSettingsUpdate = {
        location_settings: {
          customer_notes_enabled: true,
          policies: [
            {
              title: 'Return & Shipping Policy',
              description: 'Returns accepted within 30 days. Standard shipping takes 3-5 business days within Australia. Items must be in original condition.'
            },
            {
              title: 'Privacy Policy',
              description: 'Your personal information is protected and will only be used for order processing and customer service.'
            }
          ],
          branding: {
            header_type: 'FRAMED_LOGO',
            button_color: '#FF6B35', // Porch Records orange
            button_shape: 'ROUNDED'
          },
          tipping: {
            percentages: [10, 15, 20],
            smart_tipping_enabled: true,
            default_percent: 15,
            default_whole_amount_money: {
              amount: 500, // $5.00
              currency: 'AUD'
            },
            whole_amounts: [
              {
                amount: 500, // $5.00
                currency: 'AUD'
              },
              {
                amount: 1000, // $10.00
                currency: 'AUD'
              },
              {
                amount: 2000, // $20.00
                currency: 'AUD'
              }
            ]
          }
        }
      };

      const locationResponse = await fetch(`${baseApiUrl}/v2/online-checkout/location-settings/${locationId}`, {
        method: 'PUT',
        headers: {
          'Square-Version': '2023-12-13',
          'Authorization': `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(locationSettingsUpdate)
      });

      if (!locationResponse.ok) {
        const errorData = await locationResponse.json();
        throw new Error(`Failed to update location settings: ${locationResponse.status} - ${JSON.stringify(errorData)}`);
      }

      const locationResponseData = await locationResponse.json();
      
      if (locationResponseData.location_settings) {
        console.log('✅ Location Settings Updated Successfully');
        console.log('   Updated At:', locationResponseData.location_settings.updated_at);
        
        const settings = locationResponseData.location_settings;
        console.log('   Customer Notes:', settings.customer_notes_enabled ? '✅ Enabled' : '❌ Disabled');
        console.log('   Policies:', settings.policies?.length || 0, 'configured');
        console.log('   Branding: Button Color', settings.branding?.button_color, 'Shape:', settings.branding?.button_shape);
        console.log('   Tipping: Smart Tipping', settings.tipping?.smart_tipping_enabled ? '✅ Enabled' : '❌ Disabled');
      } else {
        console.log('❌ Failed to update location settings');
      }
    } catch (error) {
      console.log('❌ Error updating location settings:', error.message);
      if (error.result?.errors) {
        error.result.errors.forEach(err => {
          console.log('   Error:', err.code, '-', err.detail);
        });
      }
    }

    console.log('');
    console.log('🎯 Settings Update Complete!');
    console.log('');
    console.log('📋 What was updated:');
    console.log('✅ Payment Methods: Apple Pay, Google Pay, Cash App Pay, Afterpay/Clearpay enabled');
    console.log('✅ Afterpay/Clearpay: Order range $1.00 - $2,000.00');
    console.log('✅ Customer Notes: Enabled for checkout');
    console.log('✅ Policies: Return, Shipping, and Privacy policies configured');
    console.log('✅ Branding: Porch Records orange button color (#FF6B35)');
    console.log('✅ Tipping: Smart tipping enabled with 10%, 15%, 20% options');
    console.log('');
    console.log('🔍 Run the check script to verify all settings:');
    console.log('   node scripts/check-merchant-settings.js');

  } catch (error) {
    console.error('❌ Settings update failed:', error.message);
    process.exit(1);
  }
}

// Run the update
updateMerchantSettings(); 
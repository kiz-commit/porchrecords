const { SquareClient, SquareEnvironment } = require('square');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    
    envVars.forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    });
  }
}

// Load environment variables
loadEnvFile();

async function checkWebhooks() {
  console.log('🔍 Checking Square Webhooks...\n');

  const locationId = process.env.SQUARE_LOCATION_ID;
  if (!locationId) {
    console.log('❌ SQUARE_LOCATION_ID not set');
    return;
  }

  try {
    const client = new SquareClient({
      token: process.env.SQUARE_ACCESS_TOKEN,
      environment: SquareEnvironment.Sandbox,
    });

    console.log('📋 Webhook Configuration:');
    console.log(`  Location ID: ${locationId}`);
    console.log(`  Environment: Sandbox`);
    console.log(`  Webhook URL: https://your-domain.com/api/webhooks/square`);

    // Check if webhooks are configured
    console.log('\n🔗 Checking Webhook Subscriptions...');
    
    try {
      // Note: Square doesn't have a direct API to list webhooks
      // We'll check if our webhook endpoint is working
      console.log('  ℹ️  Square doesn\'t provide a direct API to list webhooks');
      console.log('  ℹ️  You need to check the Square Dashboard for webhook configuration');
      
      console.log('\n📋 Required Webhook Events:');
      console.log('  ✅ order.updated - When order status changes');
      console.log('  ✅ payment.updated - When payment status changes');
      console.log('  ✅ inventory.count.updated - When inventory changes');
      console.log('  ✅ customer.updated - When customer information changes');
      
      console.log('\n🔧 Webhook Setup Instructions:');
      console.log('  1. Go to Square Dashboard > Settings > Webhooks');
      console.log('  2. Add webhook URL: https://your-domain.com/api/webhooks/square');
      console.log('  3. Select the required events listed above');
      console.log('  4. Save the webhook configuration');
      
    } catch (error) {
      console.log(`  ❌ Error checking webhooks: ${error.message}`);
    }

    // Test webhook endpoint
    console.log('\n🧪 Testing Webhook Endpoint...');
    console.log('  ℹ️  This would test if your webhook endpoint is accessible');
    console.log('  ℹ️  You can test this manually by sending a webhook to your endpoint');

    // Check recent orders for payment association
    console.log('\n📦 Checking Recent Orders for Payment Association...');
    
    const searchRequest = {
      locationIds: [locationId],
      query: {
        filter: {
          stateFilter: {
            states: ['OPEN', 'COMPLETED']
          }
        },
        sort: {
          sortField: 'CREATED_AT',
          sortOrder: 'DESC'
        }
      },
      limit: 5
    };

    const ordersResponse = await client.orders.search(searchRequest);
    const orders = ordersResponse.orders || [];
    
    console.log(`Found ${orders.length} recent orders:`);
    
    orders.forEach((order, index) => {
      console.log(`\n${index + 1}. Order ${order.referenceId || order.id}:`);
      console.log(`   State: ${order.state}`);
      console.log(`   Created: ${order.createdAt}`);
      
      // Check for payment tenders
      if (order.tenders && order.tenders.length > 0) {
        console.log(`   Payments: ${order.tenders.length}`);
        order.tenders.forEach((tender, tenderIndex) => {
          console.log(`     Payment ${tenderIndex + 1}: ${tender.status || 'UNKNOWN'}`);
          if (tender.status === 'COMPLETED' && order.state === 'OPEN') {
            console.log(`     ⚠️  WARNING: Payment completed but order still OPEN!`);
          }
        });
      } else {
        console.log(`   Payments: None found`);
      }
    });

    // Check for orders with completed payments but OPEN state
    const openOrdersWithPayments = orders.filter(order => 
      order.state === 'OPEN' && 
      order.tenders && 
      order.tenders.some(tender => tender.status === 'COMPLETED')
    );

    if (openOrdersWithPayments.length > 0) {
      console.log(`\n⚠️  Found ${openOrdersWithPayments.length} orders with completed payments but OPEN state:`);
      openOrdersWithPayments.forEach(order => {
        console.log(`   - ${order.referenceId || order.id} (${order.id})`);
      });
      console.log('\n🔍 This indicates a webhook issue or order state update problem');
    }

  } catch (error) {
    console.error('Error checking webhooks:', error);
  }

  console.log('\n🎯 Recommendations:');
  console.log('  1. Verify webhooks are configured in Square Dashboard');
  console.log('  2. Check webhook endpoint is accessible and responding');
  console.log('  3. Ensure webhook signature verification is working');
  console.log('  4. Check webhook logs for any errors');
  console.log('  5. Verify SQUARE_WEBHOOK_SIGNATURE_KEY is set correctly');
}

checkWebhooks().catch(console.error); 
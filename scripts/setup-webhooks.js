require('dotenv').config({ path: '.env.local' });
const { SquareClient, SquareEnvironment } = require('square');

const client = new SquareClient({
  environment: SquareEnvironment.Sandbox,
  token: process.env.SQUARE_ACCESS_TOKEN,
});

async function checkAndSetupWebhooks() {
  try {
    console.log('🔍 Checking current webhook subscriptions...');
    
    // List current webhook subscriptions
    const webhookResponse = await client.webhookSubscriptions.listWebhookSubscriptions();
    
    console.log('Current webhook subscriptions:');
    if (webhookResponse.webhookSubscriptions && webhookResponse.webhookSubscriptions.length > 0) {
      webhookResponse.webhookSubscriptions.forEach((webhook, index) => {
        console.log(`  ${index + 1}. ${webhook.name || 'Unnamed'}`);
        console.log(`     URL: ${webhook.notificationUrl}`);
        console.log(`     Events: ${webhook.eventTypes?.join(', ') || 'None'}`);
        console.log(`     Status: ${webhook.status}`);
        console.log('');
      });
    } else {
      console.log('  No webhook subscriptions found');
    }
    
    // Check if we have the right webhook configured
    const webhookUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/webhooks/square`;
    const requiredEvents = ['payment.updated', 'order.updated', 'inventory.count.updated'];
    
    console.log('\n🎯 Required webhook configuration:');
    console.log(`  URL: ${webhookUrl}`);
    console.log(`  Events: ${requiredEvents.join(', ')}`);
    
    // Check if we have a matching webhook
    const matchingWebhook = webhookResponse.webhookSubscriptions?.find(webhook => 
      webhook.notificationUrl === webhookUrl
    );
    
    if (matchingWebhook) {
      console.log('\n✅ Found matching webhook subscription!');
      console.log(`  ID: ${matchingWebhook.id}`);
      console.log(`  Status: ${matchingWebhook.status}`);
      
      // Check if it has the required events
      const missingEvents = requiredEvents.filter(event => 
        !matchingWebhook.eventTypes?.includes(event)
      );
      
      if (missingEvents.length > 0) {
        console.log(`  ⚠️  Missing events: ${missingEvents.join(', ')}`);
        console.log('  You may need to update the webhook subscription in Square Dashboard');
      } else {
        console.log('  ✅ All required events are configured');
      }
    } else {
      console.log('\n❌ No matching webhook subscription found');
      console.log('You need to create a webhook subscription in Square Dashboard:');
      console.log('1. Go to Square Dashboard > Developers > Webhooks');
      console.log(`2. Add webhook URL: ${webhookUrl}`);
      console.log(`3. Select events: ${requiredEvents.join(', ')}`);
      console.log('4. Save the webhook subscription');
    }
    
    // Test webhook endpoint
    console.log('\n🧪 Testing webhook endpoint...');
    try {
      const response = await fetch(webhookUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Webhook endpoint is accessible');
        console.log('  Status:', data.status);
        console.log('  Supported events:', data.supportedEvents);
      } else {
        console.log('❌ Webhook endpoint is not accessible');
        console.log('  Status:', response.status);
      }
    } catch (error) {
      console.log('❌ Cannot reach webhook endpoint:', error.message);
      console.log('  Make sure your development server is running');
    }
    
  } catch (error) {
    console.error('Error checking webhooks:', error.message);
    
    // Check if it's an API method issue
    if (error.message.includes('Cannot read properties of undefined')) {
      console.log('\n🔧 This might be a Square API version issue.');
      console.log('Let\'s try a different approach...');
      
      // Try to list webhooks using a different method
      try {
        console.log('\n📋 Available Square API methods:');
        console.log(Object.keys(client).join(', '));
        
        if (client.webhookSubscriptions) {
          console.log('\n📋 Available webhook methods:');
          console.log(Object.keys(client.webhookSubscriptions).join(', '));
        }
      } catch (methodError) {
        console.log('Could not list available methods');
      }
    }
    
    if (error.result && error.result.errors) {
      error.result.errors.forEach(err => {
        console.error('  -', err.code, err.detail);
      });
    }
  }
}

checkAndSetupWebhooks(); 
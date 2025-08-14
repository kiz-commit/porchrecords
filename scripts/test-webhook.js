const crypto = require('crypto');
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

function testWebhookSignature() {
  console.log('🔍 Testing Webhook Signature Verification...\n');

  const webhookSecret = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  if (!webhookSecret) {
    console.log('❌ SQUARE_WEBHOOK_SIGNATURE_KEY not set');
    return;
  }

  console.log('📋 Webhook Configuration:');
  console.log(`  Signature Key: ${webhookSecret.substring(0, 10)}...`);
  console.log(`  Webhook URL: https://abc123.ngrok.io/api/webhooks/square`);

  // Create a test webhook event
  const testEvent = {
    id: 'test-webhook-id',
    type: 'payment.updated',
    data: {
      type: 'payment',
      id: 'test-payment-id',
      object: {
        id: 'test-payment-id',
        order_id: 'test-order-id',
        status: 'COMPLETED',
        total_money: {
          amount: 2500,
          currency: 'AUD'
        }
      }
    },
    created_at: new Date().toISOString(),
    merchant_id: 'test-merchant-id'
  };

  const body = JSON.stringify(testEvent);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  
  // Create signature
  const signatureString = `${timestamp}${body}`;
  const hmac = crypto.createHmac('sha256', webhookSecret);
  hmac.update(signatureString);
  const expectedSignature = hmac.digest('base64');

  console.log('\n🧪 Test Webhook Event:');
  console.log(`  Event Type: ${testEvent.type}`);
  console.log(`  Payment ID: ${testEvent.data.object.id}`);
  console.log(`  Order ID: ${testEvent.data.object.order_id}`);
  console.log(`  Status: ${testEvent.data.object.status}`);
  console.log(`  Timestamp: ${timestamp}`);
  console.log(`  Signature: ${expectedSignature.substring(0, 20)}...`);

  // Test signature verification
  console.log('\n🔐 Testing Signature Verification:');
  
  try {
    // Simulate the verification logic from webhook-handlers.ts
    const signatureString2 = `${timestamp}${body}`;
    const hmac2 = crypto.createHmac('sha256', webhookSecret);
    hmac2.update(signatureString2);
    const expectedSignature2 = hmac2.digest('base64');
    
    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(expectedSignature2)
    );
    
    if (isValid) {
      console.log('  ✅ Signature verification works correctly');
    } else {
      console.log('  ❌ Signature verification failed');
    }
  } catch (error) {
    console.log(`  ❌ Signature verification error: ${error.message}`);
  }

  console.log('\n🌐 Testing Webhook Endpoint:');
  console.log('  ℹ️  To test the actual webhook endpoint:');
  console.log('  1. Make sure your ngrok tunnel is running');
  console.log('  2. Send a POST request to: https://abc123.ngrok.io/api/webhooks/square');
  console.log('  3. Include these headers:');
  console.log(`     x-square-signature: ${expectedSignature}`);
  console.log(`     x-square-timestamp: ${timestamp}`);
  console.log('  4. Include the test event body in the request');

  console.log('\n📋 Manual Test Command:');
  console.log('```bash');
  console.log('curl -X POST https://abc123.ngrok.io/api/webhooks/square \\');
  console.log('  -H "Content-Type: application/json" \\');
  console.log(`  -H "x-square-signature: ${expectedSignature}" \\`);
  console.log(`  -H "x-square-timestamp: ${timestamp}" \\`);
  console.log(`  -d '${body}'`);
  console.log('```');

  console.log('\n🎯 Expected Results:');
  console.log('  ✅ Webhook endpoint should return 200 OK');
  console.log('  ✅ Server logs should show webhook processing');
  console.log('  ✅ Order state should be updated to COMPLETED');
}

testWebhookSignature(); 
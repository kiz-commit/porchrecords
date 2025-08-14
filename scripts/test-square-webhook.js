const crypto = require('crypto');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Load .env.local for the signature key
const envPath = path.resolve(__dirname, '../.env.local');
const env = fs.readFileSync(envPath, 'utf-8');
const webhookSecret = env.match(/^SQUARE_WEBHOOK_SIGNATURE_KEY=(.*)$/m)?.[1]?.trim();

if (!webhookSecret) {
  console.error('SQUARE_WEBHOOK_SIGNATURE_KEY not found in .env.local');
  process.exit(1);
}

const timestamp = Math.floor(Date.now() / 1000).toString();
const body = JSON.stringify({
  id: 'test-event-123',
  type: 'payment.updated',
  created_at: new Date().toISOString(),
  merchant_id: 'test-merchant-id',
  data: {
    type: 'payment',
    id: 'test-payment-id',
    object: {
      id: 'test-payment-id',
      order_id: 'test-order-id',
      status: 'COMPLETED',
      total_money: { amount: 2500, currency: 'AUD' }
    }
  }
});

const signatureString = `${timestamp}${body}`;
const hmac = crypto.createHmac('sha256', webhookSecret);
hmac.update(signatureString);
const signature = hmac.digest('base64');

fetch('https://90ab7c083d17.ngrok-free.app/api/webhooks/square', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-square-signature': signature,
    'x-square-timestamp': timestamp
  },
  body
})
  .then(res => res.json())
  .then(console.log)
  .catch(console.error); 
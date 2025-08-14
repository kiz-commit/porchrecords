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

async function checkPayments() {
  console.log('🔍 Checking Square Payments...\n');

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

    console.log('📋 Recent Payments:');
    
    // Get recent payments
    const paymentsResponse = await client.payments.listPayments({
      locationId: locationId,
      limit: 20
    });

    const payments = paymentsResponse.payments || [];
    console.log(`Found ${payments.length} payments:\n`);

    payments.forEach((payment, index) => {
      const amount = payment.totalMoney && payment.totalMoney.amount 
        ? (typeof payment.totalMoney.amount === 'bigint' 
            ? Number(payment.totalMoney.amount) / 100 
            : payment.totalMoney.amount / 100)
        : 0;

      console.log(`${index + 1}. Payment ${payment.id}:`);
      console.log(`   Status: ${payment.status}`);
      console.log(`   Amount: ${amount} ${payment.totalMoney?.currency || 'AUD'}`);
      console.log(`   Order ID: ${payment.orderId || 'No order associated'}`);
      console.log(`   Created: ${payment.createdAt}`);
      console.log(`   Source Type: ${payment.sourceType || 'Unknown'}`);
      
      if (payment.status === 'COMPLETED' && !payment.orderId) {
        console.log(`   ⚠️  WARNING: Completed payment without order association!`);
      }
      
      console.log('');
    });

    // Check for orphaned payments (completed payments without orders)
    const orphanedPayments = payments.filter(p => p.status === 'COMPLETED' && !p.orderId);
    if (orphanedPayments.length > 0) {
      console.log(`⚠️  Found ${orphanedPayments.length} completed payments without order association:`);
      orphanedPayments.forEach(payment => {
        console.log(`   - ${payment.id} (${payment.totalMoney?.amount ? Number(payment.totalMoney.amount) / 100 : 0} AUD)`);
      });
    }

    // Check for failed payments
    const failedPayments = payments.filter(p => p.status === 'FAILED');
    if (failedPayments.length > 0) {
      console.log(`\n❌ Found ${failedPayments.length} failed payments:`);
      failedPayments.forEach(payment => {
        console.log(`   - ${payment.id}: ${payment.failureReason || 'Unknown reason'}`);
      });
    }

  } catch (error) {
    console.error('Error checking payments:', error);
  }
}

checkPayments().catch(console.error); 
// Lazy load dependencies
let speakeasy = null;
let qrcode = null;

function getSpeakeasy() {
  if (!speakeasy) {
    speakeasy = require('speakeasy');
  }
  return speakeasy;
}

function getQrcode() {
  if (!qrcode) {
    qrcode = require('qrcode');
  }
  return qrcode;
}

function generateTOTPSecret() {
  const speakeasyLib = getSpeakeasy();
  const secret = speakeasyLib.generateSecret({
    name: 'Porch Records Admin',
    issuer: 'Porch Records'
  });

  console.log('\n=== TOTP Secret Generation ===\n');
  console.log('Secret (Base32):', secret.base32);
  console.log('\nQR Code URL:', secret.otpauth_url);
  console.log('\n=== Setup Instructions ===');
  console.log('1. Add this to your .env.local file:');
  console.log(`   TOTP_SECRET=${secret.base32}`);
  console.log('\n2. Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.)');
  console.log('3. Or manually enter the secret in your authenticator app');
  console.log('\n=== QR Code ===\n');

  // Generate QR code in terminal
  const qrcodeLib = getQrcode();
  qrcodeLib.toString(secret.otpauth_url, { type: 'terminal' }, (err, string) => {
    if (err) {
      console.error('Error generating QR code:', err);
    } else {
      console.log(string);
    }
  });
}

generateTOTPSecret(); 
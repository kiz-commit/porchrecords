#!/bin/bash

# Deploy to Production Script
# This script helps switch from sandbox to production environment

echo "🚀 Deploying to Production..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Backup current .env.local
echo "📦 Backing up current .env.local..."
cp .env.local .env.local.backup

# Update .env.local for production
echo "🔄 Updating .env.local for production..."

# Create production .env.local
cat > .env.local << 'EOF'
SQUARE_APPLICATION_ID=sq0idp-DO4-C6DVEe-0KB8iLqvbCw
NEXT_PUBLIC_SQUARE_APPLICATION_ID=sq0idp-DO4-C6DVEe-0KB8iLqvbCw
SQUARE_ACCESS_TOKEN=EAAAl3q77McHbwwHTCkhyb3Rvvr2qMaeIr_qDPnnUxZnOlhW2jFg4suBEIPb6ZjS
SQUARE_LOCATION_ID=LZSZBJZR2Y504
NEXT_PUBLIC_SQUARE_LOCATION_ID=LZSZBJZR2Y504

# Webhook signature key from Square Dashboard
SQUARE_WEBHOOK_SIGNATURE_KEY=DJL168S4MCLdqkIxnTnj4g

SQUARE_ENVIRONMENT=production

# Voucher Product IDs (different for sandbox vs production)
VOUCHER_PRODUCT_ID=Y5DOR2EGDQEXOOB572HO74UT

# Admin Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
EOF

echo "✅ .env.local updated for production"

# Update voucher product ID in products.json
echo "🔄 Updating voucher product ID for production..."
node scripts/update-voucher-product-id.js

# Update database
echo "🔄 Updating database for production voucher ID..."
sqlite3 data/porchrecords.db "UPDATE products SET square_id = 'Y5DOR2EGDQEXOOB572HO74UT' WHERE square_id = 'P523TCCIJN4PAV2MP3R2EGS2';"

# Refresh product cache
echo "🔄 Refreshing product cache..."
curl -X POST "http://localhost:3000/api/products/cache" > /dev/null 2>&1

echo "✅ Production deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Update SQUARE_WEBHOOK_SIGNATURE_KEY with production webhook key"
echo "2. Update JWT_SECRET with a secure production key"
echo "3. Update ADMIN_PASSWORD with a secure production password"
echo "4. Test the voucher functionality in production"
echo "5. Deploy to your production server"
echo ""
echo "🔄 To revert to sandbox, run: ./scripts/revert-to-sandbox.sh"

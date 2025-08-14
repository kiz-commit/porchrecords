#!/bin/bash

# Revert to Sandbox Script
# This script helps switch back from production to sandbox environment

echo "🔄 Reverting to Sandbox..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if backup exists
if [ ! -f ".env.local.backup" ]; then
    echo "❌ Error: No .env.local.backup found. Cannot revert."
    exit 1
fi

# Restore .env.local from backup
echo "📦 Restoring .env.local from backup..."
cp .env.local.backup .env.local

echo "✅ .env.local restored from backup"

# Update voucher product ID in products.json
echo "🔄 Updating voucher product ID for sandbox..."
node scripts/update-voucher-product-id.js

# Update database
echo "🔄 Updating database for sandbox voucher ID..."
sqlite3 data/porchrecords.db "UPDATE products SET square_id = 'P523TCCIJN4PAV2MP3R2EGS2' WHERE square_id = 'Y5DOR2EGDQEXOOB572HO74UT';"

# Refresh product cache
echo "🔄 Refreshing product cache..."
curl -X POST "http://localhost:3000/api/products/cache" > /dev/null 2>&1

echo "✅ Sandbox reversion complete!"
echo ""
echo "📋 Current environment: Sandbox"
echo "🔄 Voucher ID: P523TCCIJN4PAV2MP3R2EGS2"

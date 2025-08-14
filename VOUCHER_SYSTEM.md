# Voucher System Documentation

## Overview

The voucher system supports different product IDs for sandbox and production environments. This allows for seamless testing in sandbox and deployment to production.

## Environment Configuration

### Sandbox Environment
- **Voucher Product ID**: `P523TCCIJN4PAV2MP3R2EGS2`
- **Environment**: `sandbox`
- **Location ID**: `LQQ99893BW2PD`

### Production Environment
- **Voucher Product ID**: `Y5DOR2EGDQEXOOB572HO74UT`
- **Environment**: `production`
- **Location ID**: `LZSZBJZR2Y504`

## Environment Variables

The system uses these environment variables to determine the correct voucher ID:

```bash
# Current environment (sandbox/production)
SQUARE_ENVIRONMENT=sandbox

# Override voucher ID (optional)
VOUCHER_PRODUCT_ID=P523TCCIJN4PAV2MP3R2EGS2
```

## Deployment Scripts

### Deploy to Production
```bash
./scripts/deploy-to-production.sh
```

This script will:
1. Backup your current `.env.local`
2. Update environment variables for production
3. Update voucher product ID in `products.json`
4. Update database with production voucher ID
5. Refresh product cache

### Revert to Sandbox
```bash
./scripts/revert-to-sandbox.sh
```

This script will:
1. Restore `.env.local` from backup
2. Update voucher product ID back to sandbox
3. Update database with sandbox voucher ID
4. Refresh product cache

## Manual Updates

### Update Voucher Product ID
```bash
node scripts/update-voucher-product-id.js
```

### Update Database
```bash
# For production
sqlite3 data/porchrecords.db "UPDATE products SET square_id = 'Y5DOR2EGDQEXOOB572HO74UT' WHERE square_id = 'P523TCCIJN4PAV2MP3R2EGS2';"

# For sandbox
sqlite3 data/porchrecords.db "UPDATE products SET square_id = 'P523TCCIJN4PAV2MP3R2EGS2' WHERE square_id = 'Y5DOR2EGDQEXOOB572HO74UT';"
```

## Voucher Features

### Store Display
- Shows "You choose" instead of "$0.00" for voucher products
- Custom amount selection ($5-$500)
- Quick select buttons for common amounts

### Cart Integration
- Vouchers work seamlessly with physical products
- Email delivery option for voucher-only orders
- Mixed orders show delivery options for physical items

### Checkout
- Email-only delivery option for voucher-only orders
- Automatic switching from email to pickup when physical items added
- Voucher codes emailed regardless of delivery method

## URL Structure

### Voucher Product Page
```
/store/voucher-product/{VOUCHER_ID}
```

Examples:
- Sandbox: `/store/voucher-product/P523TCCIJN4PAV2MP3R2EGS2`
- Production: `/store/voucher-product/Y5DOR2EGDQEXOOB572HO74UT`

## Troubleshooting

### Voucher Not Showing
1. Check if voucher has inventory at the configured location
2. Run: `node scripts/add-voucher-inventory.js`
3. Refresh product cache: `curl -X POST "http://localhost:3000/api/products/cache"`

### Wrong Voucher ID
1. Check environment variables
2. Run: `node scripts/update-voucher-product-id.js`
3. Update database manually if needed

### Cart Issues
1. Ensure voucher product has all required fields
2. Check browser console for errors
3. Verify cart context is working properly

## Production Checklist

Before deploying to production:

1. ✅ Create voucher product in Square production dashboard
2. ✅ Note the production voucher product ID
3. ✅ Update webhook signature key for production
4. ✅ Update JWT secret for production
5. ✅ Update admin password for production
6. ✅ Test voucher functionality in production
7. ✅ Verify email delivery works correctly

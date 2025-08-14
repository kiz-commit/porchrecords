# Square Merchant Settings Configuration

## ✅ **CONFIGURATION COMPLETE**

**Date:** July 25, 2025  
**Environment:** Sandbox  
**Location ID:** LQQ99893BW2PD

## Overview

This document outlines the current Square merchant settings configuration for the Checkout API integration. All settings have been optimized for Porch Records' online store.

## Current Settings Status

### 🔧 Merchant Settings (Payment Methods)

| Payment Method | Status | Notes |
|----------------|--------|-------|
| **Apple Pay** | ✅ Enabled | Available for iOS users |
| **Google Pay** | ✅ Enabled | Available for Android users |
| **Cash App Pay** | ❌ Disabled | Not enabled in sandbox |
| **Afterpay/Clearpay** | ❌ Disabled | Requires merchant approval |

**Note:** Cash App Pay and Afterpay/Clearpay are disabled in the sandbox environment. These will need to be enabled in production through the Square Dashboard.

### 🏪 Location Settings

#### Customer Experience
- **Customer Notes:** ✅ Enabled
- **Header Type:** FRAMED_LOGO
- **Button Color:** #FF6B35 (Porch Records Orange)
- **Button Shape:** ROUNDED

#### Policies (2/2 configured)
1. **Return & Shipping Policy**
   - Returns accepted within 30 days
   - Standard shipping takes 3-5 business days within Australia
   - Items must be in original condition

2. **Privacy Policy**
   - Personal information protected
   - Used only for order processing and customer service

#### Tipping Configuration
- **Smart Tipping:** ✅ Enabled
- **Default Percent:** 15%
- **Available Percentages:** 10%, 15%, 20%
- **Whole Amounts:** $5.00, $10.00, $20.00

## API Configuration

### Environment Variables
```env
SQUARE_ACCESS_TOKEN=your_square_access_token
SQUARE_APPLICATION_ID=your_square_app_id
SQUARE_LOCATION_ID=LQQ99893BW2PD
SQUARE_ENVIRONMENT=sandbox
```

### API Version
- **Checkout API Version:** 2023-12-13
- **Base URL (Sandbox):** https://connect.squareupsandbox.com
- **Base URL (Production):** https://connect.squareup.com

## Testing Results

### ✅ Payment Link Creation
- **Status:** Working correctly
- **Test Order:** $10.00 test payment link created and cleaned up
- **URL Generation:** Proper Square hosted checkout URLs

### ✅ Settings Retrieval
- **Merchant Settings:** Successfully retrieved
- **Location Settings:** Successfully retrieved
- **Payment Methods:** Correctly configured

## Recommendations for Production

### 1. Enable Additional Payment Methods
When moving to production, consider enabling:
- **Cash App Pay:** For US customers
- **Afterpay/Clearpay:** For installment payments (requires merchant approval)

### 2. Update Afterpay/Clearpay Settings
If enabling Afterpay/Clearpay, configure:
- **Order Range:** $1.00 - $2,000.00 (already configured)
- **Item Range:** $1.00 - $2,000.00 (already configured)

### 3. Branding Optimization
Current branding is optimized for Porch Records:
- **Button Color:** #FF6B35 (matches brand)
- **Header Type:** FRAMED_LOGO (professional appearance)
- **Button Shape:** ROUNDED (modern design)

### 4. Policy Review
Current policies are comprehensive but consider:
- Adding specific vinyl record handling instructions
- Clarifying international shipping policies
- Adding pre-order specific terms

## Scripts Available

### Check Current Settings
```bash
node scripts/check-merchant-settings.js
```

### Update Settings
```bash
node scripts/update-merchant-settings.js
```

## Integration Status

### ✅ Completed
- [x] Square Checkout API integration
- [x] Payment link creation
- [x] Merchant settings configuration
- [x] Location settings configuration
- [x] Branding customization
- [x] Policy setup
- [x] Tipping configuration

### 🔄 Next Steps
- [ ] Test in production environment
- [ ] Enable additional payment methods
- [ ] Monitor checkout conversion rates
- [ ] Gather customer feedback on checkout experience

## Troubleshooting

### Common Issues

1. **Payment Methods Not Showing**
   - Check if enabled in merchant settings
   - Verify merchant approval for Afterpay/Clearpay
   - Ensure proper API version (2023-12-13)

2. **Settings Not Updating**
   - Verify API permissions
   - Check environment variables
   - Ensure correct location ID

3. **Payment Link Creation Fails**
   - Verify location ID is correct
   - Check API token permissions
   - Ensure proper request format

### Support Resources
- [Square Checkout API Documentation](https://developer.squareup.com/docs/checkout-api)
- [Square Checkout Settings Guide](https://developer.squareup.com/docs/checkout-api/checkout-settings)
- [Square Developer Dashboard](https://developer.squareup.com)

## Security Notes

- All payment data is handled by Square (maximum PCI compliance)
- No sensitive payment information touches our servers
- API tokens should be kept secure and rotated regularly
- Webhook signatures should be verified for all incoming requests

---

**Last Updated:** July 25, 2025  
**Configuration Status:** ✅ Complete and Tested 
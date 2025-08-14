# Square Payment Integration Testing Guide

## Overview
This document contains all the test cards and scenarios for testing the Square Web Payments integration in the sandbox environment.

## Test Cards

### ✅ Successful Transaction Cards

#### Visa (US)
- **Card Number:** `4111 1111 1111 1111`
- **CVV:** `123`
- **Expiry:** Any future date (e.g., `12/25`)
- **Postal Code:** `12345`
- **Expected Result:** Payment completes successfully

#### Mastercard (US)
- **Card Number:** `5555 5555 5555 4444`
- **CVV:** `123`
- **Expiry:** Any future date (e.g., `12/25`)
- **Postal Code:** `12345`
- **Expected Result:** Payment completes successfully

#### American Express (US)
- **Card Number:** `3782 822463 10005`
- **CVV:** `1234`
- **Expiry:** Any future date (e.g., `12/25`)
- **Postal Code:** `12345`
- **Expected Result:** Payment completes successfully

### ❌ Failure Test Cards

#### Card Declined - Verification Required
- **Card Number:** `4310 0000 0020 1019`
- **CVV:** `111`
- **Expiry:** Any future date (e.g., `12/25`)
- **Postal Code:** `2000` (Australian format)
- **Expected Result:** `CARD_DECLINED_VERIFICATION_REQUIRED` error
- **Purpose:** Tests error handling for cards requiring additional verification

#### Card Declined - Insufficient Funds
- **Card Number:** `4000 0000 0000 0002`
- **CVV:** `123`
- **Expiry:** Any future date (e.g., `12/25`)
- **Postal Code:** `12345`
- **Expected Result:** `CARD_DECLINED_INSUFFICIENT_FUNDS` error
- **Purpose:** Tests error handling for insufficient funds

#### Card Declined - Generic
- **Card Number:** `4000 0000 0000 0069`
- **CVV:** `123`
- **Expiry:** Any future date (e.g., `12/25`)
- **Postal Code:** `12345`
- **Expected Result:** `CARD_DECLINED` error
- **Purpose:** Tests generic card decline handling

#### Invalid Card Number
- **Card Number:** `4000 0000 0000 0119`
- **CVV:** `123`
- **Expiry:** Any future date (e.g., `12/25`)
- **Postal Code:** `12345`
- **Expected Result:** `INVALID_CARD` error
- **Purpose:** Tests invalid card number handling

## Testing Scenarios

### 1. Successful Payment Flow
1. Add items to cart
2. Proceed to checkout
3. Fill in customer information
4. Use successful test card (e.g., `4111 1111 1111 1111`)
5. Submit payment
6. **Expected:** Redirect to success page with order confirmation

### 2. Error Handling Flow
1. Add items to cart
2. Proceed to checkout
3. Fill in customer information
4. Use failure test card (e.g., `4310 0000 0020 1019`)
5. Submit payment
6. **Expected:** Error message displayed, payment form remains active

### 3. Form Validation
1. Try to submit with empty required fields
2. Try to submit with invalid card number
3. Try to submit with invalid expiry date
4. Try to submit with invalid CVV
5. **Expected:** Appropriate validation errors displayed

### 4. Mobile Testing
1. Test on mobile device
2. Verify Apple Pay/Google Pay buttons appear (if available)
3. Test card form on mobile
4. **Expected:** Responsive design, mobile-optimized form

## Environment Configuration

### Sandbox Environment
- **Application ID:** `sandbox-sq0idb-ezUcxdUn3voWd4DOvsCgxA`
- **Location ID:** `LQQ99893BW2PD`
- **Environment:** `sandbox`

### Production Environment
- **Application ID:** `[PRODUCTION_APP_ID]`
- **Location ID:** `[PRODUCTION_LOCATION_ID]`
- **Environment:** `production`

## Error Codes Reference

| Error Code | Description | Test Card |
|------------|-------------|-----------|
| `CARD_DECLINED_VERIFICATION_REQUIRED` | Card requires additional verification | `4310 0000 0020 1019` |
| `CARD_DECLINED_INSUFFICIENT_FUNDS` | Insufficient funds | `4000 0000 0000 0002` |
| `CARD_DECLINED` | Generic card decline | `4000 0000 0000 0069` |
| `INVALID_CARD` | Invalid card number | `4000 0000 0000 0119` |
| `INVALID_EXPIRATION` | Invalid expiry date | Any card with past date |
| `INVALID_CVV` | Invalid CVV | Any card with wrong CVV |

## Testing Checklist

### Pre-Launch Testing
- [ ] Successful payment with Visa test card
- [ ] Successful payment with Mastercard test card
- [ ] Successful payment with American Express test card
- [ ] Error handling for declined cards
- [ ] Form validation for invalid inputs
- [ ] Mobile responsiveness
- [ ] Apple Pay/Google Pay (if applicable)
- [ ] Order confirmation page
- [ ] Email notifications (if configured)

### Production Readiness
- [ ] Switch to production Square credentials
- [ ] Remove all debug code and console logs
- [ ] Test with real cards (small amounts)
- [ ] Verify webhook handling
- [ ] Test order fulfillment flow
- [ ] Verify customer support integration

## Troubleshooting

### Common Issues

#### "Loading secure payment form..." persists
- Check Square Application ID and Location ID
- Verify network connectivity
- Check browser console for errors

#### Payment tokenization fails
- Ensure card form is properly initialized
- Check for JavaScript errors
- Verify Square SDK is loaded

#### Order creation fails
- Check Square API credentials
- Verify order data format
- Check for missing required fields

#### Payment processing fails
- Verify payment token is valid
- Check Square account status
- Verify location is active

## Support Resources

- [Square Web Payments SDK Documentation](https://developer.squareup.com/docs/web-payments)
- [Square Test Cards](https://developer.squareup.com/docs/testing/test-values)
- [Square API Reference](https://developer.squareup.com/reference)
- [Square Support](https://developer.squareup.com/support)

---

**Last Updated:** July 22, 2025
**Version:** 1.0
**Environment:** Sandbox 
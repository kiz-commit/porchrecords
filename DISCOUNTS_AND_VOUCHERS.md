# Discounts and Vouchers System

## Overview

Porch Records now supports two types of promotional systems:

1. **Discounts** - Store-wide promotions, bundle offers, and time-based discounts
2. **Vouchers** - Gift cards and promotional codes with custom tracking

## 🎫 Discounts System

### Features
- **Percentage discounts** (e.g., 10% off all products)
- **Fixed amount discounts** (e.g., $5 off orders over $50)
- **Time-based discounts** with start/end dates
- **Usage limits** (max number of times discount can be used)
- **Square API integration** for automatic application
- **Product targeting** (apply to specific products or all products)

### How It Works

1. **Admin creates discount** in `/admin/discounts`
2. **Discount is created in Square Catalog** as a `CatalogDiscount` object
3. **Pricing rules** are applied to automatically apply discounts
4. **During checkout**, Square automatically applies eligible discounts
5. **Usage tracking** is maintained locally

### Square API Integration

The system uses Square's [Catalog API](https://developer.squareup.com/docs/orders-api/apply-taxes-and-discounts/auto-apply-discounts) to:

- Create `CatalogDiscount` objects
- Set up `CatalogPricingRule` for automatic application
- Apply discounts during order creation with `auto_apply_discounts: true`

### Example Discount Types

```javascript
// Percentage discount
{
  name: "Summer Sale",
  type: "PERCENTAGE",
  percentage: "15",
  startDate: "2024-12-01",
  endDate: "2024-12-31",
  maxUsage: 100
}

// Fixed amount discount
{
  name: "New Customer Discount",
  type: "FIXED_AMOUNT",
  amount: 10,
  maxUsage: 50
}
```

## 💳 Vouchers System

### Features
- **Gift vouchers** ($10, $20, $30, $50, $100, $200)
- **Custom voucher codes** (12-character alphanumeric)
- **Balance tracking** (partial usage support)
- **Expiry dates** (optional)
- **Usage history** (track all transactions)
- **Customer association** (optional email/name linking)

### How It Works

1. **Voucher products** exist in Square catalog (hidden from store)
2. **Customer purchases voucher** through normal checkout
3. **System generates voucher record** with unique code
4. **Customer receives voucher code** via email/confirmation
5. **During future checkout**, customer enters voucher code
6. **System validates and applies discount** from voucher balance
7. **Balance is updated** and usage is tracked

### Voucher Flow

```
Customer Purchase → Square Order → Voucher Record Created → Code Generated
                                                                    ↓
Customer Checkout ← Voucher Validation ← Code Entry ← Customer Receives Code
```

### API Endpoints

#### Create Voucher
```http
POST /api/admin/vouchers
{
  "amount": 50,
  "customerEmail": "customer@example.com",
  "customerName": "John Doe",
  "expiresAt": "2025-12-31"
}
```

#### Validate Voucher
```http
POST /api/admin/vouchers/validate
{
  "code": "ABC123DEF456",
  "orderId": "order-123",
  "orderAmount": 75.50
}
```

#### Response
```json
{
  "success": true,
  "voucher": {
    "id": "voucher-123",
    "code": "ABC123DEF456",
    "originalAmount": 50,
    "remainingBalance": 0,
    "discountAmount": 50
  }
}
```

## 🔧 Implementation Details

### File Structure
```
src/
├── app/
│   ├── admin/
│   │   ├── discounts/
│   │   │   └── page.tsx          # Discounts admin UI
│   │   └── vouchers/
│   │       └── page.tsx          # Vouchers admin UI
│   └── api/
│       └── admin/
│           ├── discounts/
│           │   └── route.ts      # Discounts API
│           └── vouchers/
│               ├── route.ts      # Vouchers API
│               └── validate/
│                   └── route.ts  # Voucher validation API
├── data/
│   ├── discounts.json           # Local discount storage
│   └── vouchers.json            # Local voucher storage
└── scripts/
    └── setup-voucher-products.js # Square voucher setup
```

### Data Storage

Both systems use local JSON files for storage:
- `src/data/discounts.json` - Discount records
- `src/data/vouchers.json` - Voucher records

This allows for:
- Fast local queries
- Custom business logic
- Easy backup and migration
- Offline functionality

### Security Considerations

1. **Voucher codes** are 12-character alphanumeric (36^12 combinations)
2. **Validation** happens server-side only
3. **Balance tracking** prevents double-spending
4. **Expiry dates** automatically invalidate vouchers
5. **Usage history** provides audit trail

## 🚀 Setup Instructions

### 1. Create Voucher Products in Square

```bash
node scripts/setup-voucher-products.js
```

This creates voucher products ($10-$200) in your Square catalog.

### 2. Access Admin Interface

- **Discounts**: Navigate to `/admin/discounts`
- **Vouchers**: Navigate to `/admin/vouchers`

### 3. Create Your First Discount

1. Go to `/admin/discounts`
2. Click "Create Discount"
3. Choose percentage or fixed amount
4. Set dates and usage limits
5. Save

### 4. Create Your First Voucher

1. Go to `/admin/vouchers`
2. Click "Create Voucher"
3. Select amount ($10-$200)
4. Add customer details (optional)
5. Set expiry date (optional)
6. Save

## 📊 Analytics and Reporting

### Discount Analytics
- Total active discounts
- Usage count per discount
- Revenue saved
- Performance tracking

### Voucher Analytics
- Total voucher value
- Remaining balance
- Usage patterns
- Customer engagement

## 🔄 Integration with Checkout

### Discount Application
Discounts are automatically applied during Square checkout using:
```javascript
const orderData = {
  // ... order details
  pricingOptions: {
    autoApplyDiscounts: true
  }
};
```

### Voucher Application
Vouchers are validated and applied before checkout:
```javascript
// 1. Validate voucher
const voucherResponse = await fetch('/api/admin/vouchers/validate', {
  method: 'POST',
  body: JSON.stringify({ code: 'ABC12345', orderAmount: 75.50 })
});

// 2. Apply discount to order
if (voucherResponse.success) {
  // Apply voucher.discountAmount to order total
}
```

## 🛠️ Customization

### Adding New Discount Types
1. Extend the discount form in `/admin/discounts/page.tsx`
2. Update the API in `/api/admin/discounts/route.ts`
3. Add Square catalog integration

### Adding New Voucher Features
1. Extend voucher schema in `/api/admin/vouchers/route.ts`
2. Update validation logic in `/api/admin/vouchers/validate/route.ts`
3. Modify admin UI as needed

## 🐛 Troubleshooting

### Common Issues

1. **Discount not applying**: Check Square catalog integration
2. **Voucher validation failing**: Verify voucher status and balance
3. **API errors**: Check file permissions for JSON storage

### Debug Commands

```bash
# Check voucher products in Square
node scripts/square-dump-items.js

# Validate voucher manually
curl -X POST /api/admin/vouchers/validate \
  -H "Content-Type: application/json" \
  -d '{"code":"ABC12345","orderAmount":50}'
```

## 📈 Future Enhancements

### Planned Features
- **Bulk voucher creation** for promotions
- **Customer loyalty program** integration
- **Advanced discount rules** (minimum spend, product categories)
- **Email notifications** for voucher usage
- **Analytics dashboard** with charts and insights
- **API rate limiting** for voucher validation
- **Database migration** from JSON to SQLite/PostgreSQL

### Integration Opportunities
- **Email marketing** (Mailchimp integration)
- **Customer segmentation** for targeted discounts
- **Inventory management** (discounts for low stock items)
- **Seasonal promotions** (automatic discount scheduling) 
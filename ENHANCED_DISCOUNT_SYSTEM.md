# Enhanced Discount System

## Overview

The enhanced discount system supports both manual discount codes and automatic discounts with advanced targeting options.

## Features

### 1. Manual Discount Codes
- **Customer-entered codes** (e.g., "SAVE10")
- **Unique 8-character codes** generated automatically
- **Usage tracking** and limits
- **Expiry dates** support

### 2. Automatic Discounts
- **Apply automatically** without customer input
- **Date-based activation** (start/end dates with optional time precision)
- **Targeting options** (all products, categories, specific products)
- **Real-time calculation** during checkout

### 3. Targeting Options
- **All Products**: Applies to entire cart
- **Categories**: Target specific product categories using dynamic categories:
  - **Product Types**: Automatically pulled from existing products (record, merch, accessory, etc.)
  - **Merch Categories**: Automatically pulled from merch categories data (T-Shirts, Hoodies, Hats, etc.)
- **Specific Products**: Target individual products by ID

### 4. Announcement Bar
- **Moving text banner** that scrolls right-to-left across the top of the site
- **Customizable text**, colors, and animation speed
- **Enable/disable** functionality
- **Perfect for promoting** active discounts, sales, or important announcements

### 5. Gift Voucher System
- **Variable pricing** - customers choose their own voucher amount ($5-$500)
- **Custom voucher product page** with amount selection and quick-select buttons
- **Automatic voucher generation** after successful payment
- **12-character secure codes** with 1-year expiry
- **Balance tracking** - vouchers can be used partially
- **Admin management** - view, edit, and manage all vouchers

## Discount Types

### Percentage Discounts
```json
{
  "type": "PERCENTAGE",
  "percentage": "10"
}
```

### Fixed Amount Discounts
```json
{
  "type": "FIXED_AMOUNT",
  "amount": 5.00
}
```

## Admin Interface

### Creating Discounts

1. **Go to** `/admin/discounts`
2. **Click** "Create New Discount"
3. **Fill in**:
   - **Name**: Display name for the discount
   - **Type**: Percentage or Fixed Amount
   - **Value**: Percentage or dollar amount
   - **Discount Type**: Manual Code or Automatic
   - **Target Products**: All Products, Categories, or Specific Products
   - **Categories** (if applicable): Dynamically populated from existing product types and merch categories
   - **Date Range**: Start and end dates with optional time precision (optional)
   - **Usage Limits**: Maximum number of uses (optional)

### Discount Management

- **View all discounts** with status indicators
- **Edit existing discounts**
- **Deactivate/activate** discounts
- **Monitor usage** statistics
- **Delete discounts**

### Announcement Bar Management

- **Create and edit** moving announcement text
- **Customize colors** (background and text)
- **Adjust animation speed** (10-100ms range)
- **Enable/disable** the announcement bar
- **Perfect for promoting** active discounts and sales

## API Endpoints

### 1. Admin Discounts API
```
GET    /api/admin/discounts     - List all discounts
POST   /api/admin/discounts     - Create new discount
PUT    /api/admin/discounts     - Update discount
DELETE /api/admin/discounts     - Delete discount
GET    /api/admin/discounts/categories - Get available categories
```

### 2. Announcement Bar API
```
GET    /api/admin/announcement-bar - Get announcement bar settings
POST   /api/admin/announcement-bar - Update announcement bar settings
GET    /api/announcement-bar       - Public endpoint for frontend
```

### 3. Checkout Discount APIs
```
POST   /api/checkout/apply-discount        - Apply manual discount code
POST   /api/checkout/get-automatic-discounts - Get automatic discounts for cart
```

## Checkout Integration

### Manual Discount Codes
1. **Customer enters code** in checkout
2. **System validates** code and applies discount
3. **Order total updates** immediately
4. **Usage count increments** automatically

### Automatic Discounts
1. **System checks** cart contents on page load
2. **Applies eligible discounts** automatically
3. **Shows discount breakdown** in order summary
4. **No customer action required**

## Example Discounts

### Manual Code Example
```json
{
  "id": "discount-123",
  "name": "10% Off Store",
  "code": "SAVE10",
  "type": "PERCENTAGE",
  "percentage": "10",
  "discountType": "MANUAL_CODE",
  "targetType": "ALL_PRODUCTS",
  "status": "ACTIVE"
}
```

### Automatic Discount Example
```json
{
  "id": "discount-124",
  "name": "20% Off Records",
  "code": "RECORD20",
  "type": "PERCENTAGE",
  "percentage": "20",
  "discountType": "AUTOMATIC",
  "targetType": "CATEGORIES",
  "targetCategories": ["record"],
  "status": "ACTIVE"
}
```

## Checkout Flow

### Order Summary Display
```
Subtotal: $50.00
10% Off Store: -$5.00
20% Off Records: -$8.00
Shipping: $12.00
Total: $49.00
```

### Discount Application Logic
1. **Calculate subtotal** from cart items
2. **Apply automatic discounts** based on targeting rules
3. **Allow manual discount codes** (if no automatic discounts)
4. **Calculate final total** with shipping

## Dynamic Categories

### How Categories Work
- **Product Types**: Automatically extracted from `products.json` file
  - System scans all products and collects unique `productType` values
  - Examples: record, merch, accessory
- **Merch Categories**: Automatically extracted from `merchCategories.json` file
  - System scans all merch items and collects unique `merchCategory` values
  - Examples: T-Shirts, Hoodies, Hats, Vinyl Accessories
- **Real-time Updates**: Categories update automatically when products or merch categories are added/modified
- **No Hardcoding**: All category options are dynamic and admin-managed

### Category Sources
- **Product Types**: From `src/data/products.json` → `productType` field
- **Merch Categories**: From `src/data/merchCategories.json` → `merchCategory` field
- **API Endpoint**: `/api/admin/discounts/categories` provides current available categories

## Security & Validation

### Code Generation
- **8-character alphanumeric** codes
- **Unique validation** prevents duplicates
- **Case-insensitive** matching

### Usage Limits
- **Per-discount limits** (maxUsage)
- **Automatic expiration** (endDate)
- **Status tracking** (ACTIVE/INACTIVE/EXPIRED)

### Validation Rules
- **Date range checking** (startDate/endDate)
- **Usage limit enforcement** (usageCount vs maxUsage)
- **Targeting validation** (categories, products)
- **Amount validation** (discount ≤ order total)

## Future Enhancements

### Planned Features
- **Bulk discount creation** for seasonal sales
- **Customer-specific discounts** (first-time buyers, VIP)
- **Stacking rules** (multiple discounts)
- **Analytics dashboard** (discount performance)
- **Email integration** (send codes to customers)
- **A/B testing** for discount effectiveness

### Integration Opportunities
- **Square Catalog API** for product targeting
- **Customer segmentation** for targeted discounts
- **Inventory-based discounts** (clearance items)
- **Time-based pricing** (happy hour discounts)
- **Dynamic category management** (categories update automatically when products change)

## File Structure

```
src/
├── app/
│   ├── admin/discounts/page.tsx           # Admin interface
│   ├── api/admin/discounts/route.ts       # Admin API
│   ├── api/admin/discounts/categories/route.ts # Dynamic categories API
│   ├── api/checkout/apply-discount/route.ts      # Manual discount API
│   ├── api/checkout/get-automatic-discounts/route.ts # Automatic discount API
│   └── checkout/page.tsx                  # Checkout with discount UI
├── components/
│   └── CheckoutButton.tsx                 # Updated checkout button
└── data/
    ├── discounts.json                     # Discount storage
    ├── products.json                      # Product data (for product types)
    └── merchCategories.json               # Merch categories data
```

## Testing

### Manual Testing
1. **Create discount** in admin panel
2. **Add products** to cart
3. **Go to checkout** and verify automatic discounts
4. **Enter manual code** and verify application
5. **Check order summary** for correct totals

### Test Scenarios
- **Automatic discount** on Vinyl category
- **Manual code** "SAVE10" for 10% off
- **Expired discount** validation
- **Usage limit** enforcement
- **Multiple discounts** in same cart

## Troubleshooting

### Common Issues
1. **Discount not applying**: Check status, dates, and targeting
2. **Code not working**: Verify code exists and is active
3. **Wrong amount**: Check percentage vs fixed amount logic
4. **Targeting issues**: Verify product categories match

### Debug Steps
1. **Check discount status** in admin panel
2. **Verify date ranges** are current
3. **Confirm targeting** matches cart items
4. **Review usage limits** and counts
5. **Check browser console** for API errors 
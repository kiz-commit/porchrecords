# Porch Records - Deployment Strategy

## Overview
This document captures the production deployment approach, environments, hosting, secrets, and operational runbook for Porch Records.

## Hosting options (AU cost-conscious)

- Fly.io (Sydney `syd`): persistent volume for SQLite, scales to 0. ~$0–$5/mo when idle, < $10/mo light traffic.
- Railway: simple CI deploy, shared compute; persistent volume beta. Typically $5–$10/mo.
- Hetzner CPX11 VPS (~€5.19/mo) + Docker + Caddy: cheapest steady-state, more ops.
- Vercel/Netlify: great DX but ephemeral FS — not ideal for SQLite writes without external DB.

Recommendation: Fly.io in `syd` with a 1GB volume and scale-to-zero for budget.

## Fly.io

- Files: `Dockerfile`, `fly.toml`. Volume mount `/data` with `DB_PATH=/data/porchrecords.db`.
- Secrets to set:
  - `SQUARE_APPLICATION_ID`, `NEXT_PUBLIC_SQUARE_APPLICATION_ID`, `SQUARE_ACCESS_TOKEN`, `SQUARE_LOCATION_ID`, `NEXT_PUBLIC_SQUARE_LOCATION_ID`, `SQUARE_WEBHOOK_SIGNATURE_KEY`, `NEXT_PUBLIC_BASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `JWT_SECRET`, `TOTP_SECRET` (optional), `VOUCHER_PRODUCT_ID`.
- Create app and volume:
  - `fly apps create porch-records`
  - `fly volumes create porch_records_data --region syd --size 1`
  - `fly secrets set ...` (all secrets above)
- Deploy: `fly deploy --remote-only` or via GitHub Actions (`deploy-fly.yml`).

## GitHub Actions

- `ci.yml`: build and tests on PR/push.
- `deploy-fly.yml`: deploy on push to `main`. Requires `FLY_API_TOKEN` secret.

## Webhooks

- Square webhook URL: `<BASE_URL>/api/webhooks/square`.
- Ensure `SQUARE_WEBHOOK_SIGNATURE_KEY` matches Dashboard.

## Security headers

- Enforced globally via `next.config.ts` `headers()` with CSP, HSTS, XFO, XCTO, Referrer-Policy.

## Database

- SQLite file persisted at `/data/porchrecords.db`. Backups: snapshot Fly volume or copy file off box.

## Post-deploy checks

- Health: GET `/api/test-env`.
- Admin login and 2FA.
- Verify webhook events received in logs.

## Current State Analysis

### ✅ Completed Features
- Basic Square payment form integration
- Product management with Square Catalog API
- Inventory management with Square Inventory API
- Admin panel for product management
- Basic checkout flow (mock payment processing)

### 🔄 Partially Implemented
- Payment processing (currently mocked)
- Order management (not implemented)
- Customer accounts (not implemented)

### ❌ Missing Features
- Real Square Orders API integration
- Customer authentication and accounts
- Shopping cart functionality
- Order management in admin
- Square webhooks for real-time updates

## Implementation Strategy

### Phase 1: Square Customer Authentication (Tasks 24-26)

#### 1.1 Square Customer API Integration
**Files to create/modify:**
- `src/lib/square-customer.ts` - Customer API utilities
- `src/app/api/auth/register/route.ts` - Customer registration
- `src/app/api/auth/login/route.ts` - Customer login
- `src/app/api/auth/logout/route.ts` - Customer logout
- `src/contexts/CustomerContext.tsx` - Customer state management

**Implementation Steps:**
1. Set up Square Customer API client
2. Create customer registration endpoint using `squareClient.customers.createCustomer()`
3. Implement customer login with email/password
4. Create customer session management with JWT tokens
5. Build customer context provider for React state

#### 1.2 Customer Account Pages
**Files to create:**
- `src/app/account/page.tsx` - Customer dashboard
- `src/app/account/orders/page.tsx` - Order history
- `src/app/account/profile/page.tsx` - Profile management
- `src/app/account/login/page.tsx` - Login page
- `src/app/account/register/page.tsx` - Registration page

**Features:**
- Customer dashboard with order summary
- Order history with status tracking
- Profile management (address, payment methods)
- Password reset functionality

### Phase 2: Enhanced Checkout & Order Processing (Tasks 27-29)

#### 2.1 Complete Square Checkout Integration
**Files to modify:**
- `src/app/api/process-payment/route.ts` - Replace mock with real Square Orders API
- `src/components/SquarePaymentForm.tsx` - Enhance with order creation
- `src/app/api/checkout/route.ts` - Implement Square Checkout API

**Implementation Steps:**
1. Replace mock payment processing with `squareClient.orders.createOrder()`
2. Implement Square Checkout API for hosted checkout experience
3. Add proper order line items and customer association
4. Handle payment processing with Square Payments API
5. Create order confirmation flow

#### 2.2 Shopping Cart Functionality
**Files to create:**
- `src/components/ShoppingCart.tsx` - Cart component
- `src/hooks/useCart.ts` - Cart state management
- `src/app/cart/page.tsx` - Cart page
- `src/lib/cart-storage.ts` - Local storage utilities

**Features:**
- Add to cart functionality
- Cart persistence in localStorage
- Quantity management
- Cart summary and checkout flow
- Remove items from cart

#### 2.3 Order Confirmation & Receipts
**Files to create:**
- `src/app/order/[id]/page.tsx` - Order confirmation page
- `src/app/api/orders/[id]/route.ts` - Order details API
- `src/components/OrderReceipt.tsx` - Receipt component

**Features:**
- Order confirmation with Square order details
- Email receipts using Square's receipt functionality
- Order tracking and status updates
- Downloadable receipts

### Phase 3: Admin Order Management (Tasks 30-32)

#### 3.1 Orders Admin Interface
**Files to create:**
- `src/app/admin/orders/page.tsx` - Orders management page
- `src/app/api/admin/orders/route.ts` - Orders API
- `src/app/api/admin/orders/[id]/route.ts` - Single order API
- `src/components/admin/OrdersTable.tsx` - Orders table component

**Features:**
- Display all orders with filtering and search
- Order details with customer information
- Payment status tracking
- Order export functionality

#### 3.2 Order Status Management
**Files to create:**
- `src/app/admin/orders/[id]/page.tsx` - Order detail page
- `src/components/admin/OrderStatusForm.tsx` - Status update form
- `src/app/api/admin/orders/[id]/status/route.ts` - Status update API

**Features:**
- Order status updates (pending, processing, shipped, delivered)
- Order fulfillment tracking
- Order notes and communication system
- Email notifications for status changes

#### 3.3 Order Analytics & Reporting
**Files to create:**
- `src/app/admin/analytics/page.tsx` - Analytics dashboard
- `src/app/api/admin/analytics/route.ts` - Analytics API
- `src/components/admin/SalesChart.tsx` - Sales visualization

**Features:**
- Sales metrics and trends
- Order analytics dashboard
- Export functionality for accounting
- Revenue reporting

### Phase 4: Square Integration Enhancements (Tasks 33-35)

#### 4.1 Square Webhooks Implementation
**Files to create:**
- `src/app/api/webhooks/square/route.ts` - Webhook handler
- `src/lib/webhook-handlers.ts` - Webhook processing logic
- `src/app/api/admin/webhooks/route.ts` - Webhook management

**Implementation Steps:**
1. Set up Square webhook endpoints
2. Implement webhook signature verification
3. Handle order update notifications
4. Process payment status changes
5. Update inventory in real-time

#### 4.2 Square Customer Management
**Files to create:**
- `src/app/admin/customers/page.tsx` - Customer management
- `src/app/api/admin/customers/route.ts` - Customers API
- `src/components/admin/CustomersTable.tsx` - Customers table

**Features:**
- Customer search and management
- Customer communication tools
- Customer analytics and insights

#### 4.3 Square Location & Tax Management
**Files to create:**
- `src/lib/square-locations.ts` - Location management
- `src/lib/square-tax.ts` - Tax calculation
- `src/app/api/shipping/route.ts` - Shipping calculation

**Features:**
- Multiple location support
- Tax calculation using Square's tax API
- Shipping calculation and zone management

## Environment Variables Required

```env
# Square API Configuration
SQUARE_ACCESS_TOKEN=your_square_access_token
SQUARE_APPLICATION_ID=your_square_app_id
SQUARE_LOCATION_ID=your_square_location_id
SQUARE_ENVIRONMENT=sandbox

# Customer Authentication
JWT_SECRET=your_jwt_secret_key
NEXTAUTH_SECRET=your_nextauth_secret

# Email Configuration (for receipts)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password

# Webhook Configuration
WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_BASE_URL=your_site_url
```

## Square API Endpoints to Implement

### Customer Management
- `POST /api/auth/register` - Customer registration
- `POST /api/auth/login` - Customer login
- `POST /api/auth/logout` - Customer logout
- `GET /api/customer/profile` - Get customer profile
- `PUT /api/customer/profile` - Update customer profile

### Order Management
- `POST /api/orders` - Create order
- `GET /api/orders` - Get customer orders
- `GET /api/orders/[id]` - Get order details
- `PUT /api/orders/[id]/status` - Update order status

### Admin Order Management
- `GET /api/admin/orders` - Get all orders
- `GET /api/admin/orders/[id]` - Get order details
- `PUT /api/admin/orders/[id]` - Update order
- `GET /api/admin/analytics` - Get sales analytics

### Webhooks
- `POST /api/webhooks/square` - Square webhook handler

## Testing Strategy

### Sandbox Testing
1. **Customer Authentication Testing**
   - Test customer registration and login
   - Verify session management
   - Test password reset functionality

2. **Order Processing Testing**
   - Test order creation with Square Orders API
   - Verify payment processing
   - Test order confirmation flow

3. **Admin Order Management Testing**
   - Test order listing and filtering
   - Verify order status updates
   - Test order analytics

### Production Migration
1. **Environment Setup**
   - Configure production Square environment
   - Set up production webhooks
   - Configure email services

2. **Data Migration**
   - Migrate customer data if needed
   - Set up order history
   - Configure analytics tracking

## Security Considerations

### PCI Compliance
- Use Square's hosted checkout for PCI compliance
- Implement proper data encryption
- Secure API key management

### Customer Data Protection
- Implement proper session management
- Secure customer data storage
- GDPR compliance measures

### Webhook Security
- Verify webhook signatures
- Implement rate limiting
- Secure webhook endpoints

## Performance Optimization

### Caching Strategy
- Cache customer data in session
- Cache order data for admin interface
- Implement ISR for static pages

### Database Optimization
- Optimize order queries
- Implement pagination for large datasets
- Use proper indexing

## Monitoring & Analytics

### Error Tracking
- Implement error logging
- Set up error monitoring
- Track API failures

### Performance Monitoring
- Monitor page load times
- Track API response times
- Monitor Square API usage

## Success Criteria

### Functional Requirements
- [ ] Customer can register and login
- [ ] Customer can place orders and receive confirmations
- [ ] Admin can manage orders and update status
- [ ] Real-time inventory updates via webhooks
- [ ] Order analytics and reporting

### Performance Requirements
- [ ] Page load times < 2 seconds
- [ ] API response times < 500ms
- [ ] 99.9% uptime for critical functions

### Security Requirements
- [ ] PCI compliance maintained
- [ ] Customer data properly secured
- [ ] Webhook security implemented

## Timeline Estimate

### Phase 1: Customer Authentication (1-2 weeks)
- Square Customer API integration
- Customer account pages
- Session management

### Phase 2: Enhanced Checkout (2-3 weeks)
- Complete Square Orders API integration
- Shopping cart functionality
- Order confirmation system

### Phase 3: Admin Order Management (2-3 weeks)
- Orders admin interface
- Order status management
- Analytics and reporting

### Phase 4: Integration Enhancements (1-2 weeks)
- Webhook implementation
- Customer management
- Location and tax management

### Testing & Production (1-2 weeks)
- Sandbox testing
- Production migration
- Security audit

**Total Estimated Time: 7-12 weeks**

## Risk Mitigation

### Technical Risks
- **Square API Changes**: Monitor Square API documentation for updates
- **Performance Issues**: Implement caching and optimization strategies
- **Security Vulnerabilities**: Regular security audits and updates

### Business Risks
- **Data Loss**: Implement backup and recovery procedures
- **Service Downtime**: Set up monitoring and alerting
- **Compliance Issues**: Regular compliance audits

## Next Steps

1. **Immediate Actions**
   - Set up Square sandbox environment
   - Configure required environment variables
   - Begin Phase 1 implementation

2. **Weekly Reviews**
   - Review progress against timeline
   - Address any blockers or issues
   - Update implementation plan as needed

3. **Testing Milestones**
   - Complete sandbox testing before production
   - Perform security audit before launch
   - Conduct user acceptance testing 
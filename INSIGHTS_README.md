# Insights Dashboard

The Insights dashboard provides analytics and smart suggestions to help boost sales and engagement for Porch Records.

## Features

### 1. Top Viewed Products
- Shows the most popular products in the past 7 or 30 days
- Displays view count and purchase count for each product
- Toggle between weekly and monthly views

### 2. Viewed But Not Purchased
- Identifies products with 3+ views and 0 purchases in 14 days
- Helps identify products that need attention or promotion
- Shows last viewed date for each product

### 3. Smart Bundle Suggestions
- Suggests product combinations based on customer behavior
- Shows confidence level and reasoning for each suggestion
- Displays potential revenue for each bundle

### 4. Re-engagement Actions
- Quick action buttons for products that need attention:
  - **Add Discount**: Creates a 10% off Square promo link
  - **Feature on Homepage**: Adds product to featured section
  - **Create Email Prompt**: Triggers email campaign draft (Mailchimp integration)

## Analytics Tracking

### Client-Side Tracking
- Uses `localStorage` and `sessionStorage` for anonymous view tracking
- Tracks product views when users visit product detail pages
- Prevents duplicate views within the same session
- Automatically syncs data to server every 5 minutes

### Server-Side Storage
- Analytics data stored in `src/data/analytics.json`
- API routes handle data aggregation and filtering
- Supports both weekly and monthly time ranges

## API Endpoints

### GET `/api/admin/insights/top-viewed`
Returns top viewed products with view and purchase counts.

### GET `/api/admin/insights/viewed-not-purchased`
Returns products viewed but not purchased.

### GET `/api/admin/insights/bundle-suggestions`
Returns smart bundle suggestions based on customer behavior.

### GET `/api/admin/insights/reengagement`
Returns products that need re-engagement actions.

### POST `/api/admin/insights/create-discount`
Creates Square discount promotions for products.

### POST `/api/admin/insights/feature-product`
Adds products to homepage featured section.

### POST `/api/admin/insights/create-email-campaign`
Creates email campaign drafts for re-engagement.

### POST `/api/analytics/sync`
Syncs client-side analytics data to server.

## Usage

1. Navigate to `/admin/insights` in the admin dashboard
2. Toggle between weekly and monthly views using the buttons
3. Review the four main analytics modules
4. Use the re-engagement action buttons to boost sales
5. Monitor the summary stats at the bottom

## Future Enhancements

- Real Square API integration for discount creation
- Mailchimp API integration for email campaigns
- Advanced analytics with charts and graphs
- Customer segmentation and targeting
- A/B testing for product promotions
- Revenue attribution tracking
- Email campaign performance metrics

## Technical Notes

- Analytics tracking is privacy-friendly and GDPR compliant
- Uses session-based tracking to prevent duplicate counts
- Mock data is provided for development and testing
- All API endpoints include proper error handling
- TypeScript interfaces ensure type safety
- Responsive design works on all device sizes 
/**
 * Square Webhook Setup Utilities
 * 
 * This module provides utilities for setting up and managing Square webhooks
 * configuration and provides setup instructions.
 */

export interface WebhookConfig {
  url: string;
  eventTypes: string[];
  signatureKey: string;
  status: 'active' | 'inactive';
}

export interface WebhookSetupInfo {
  webhookUrl: string;
  supportedEvents: string[];
  setupInstructions: string;
  environmentVariables: string[];
}

/**
 * Get webhook configuration for Porch Records
 */
export function getWebhookConfig(baseUrl: string): WebhookConfig {
  return {
    url: `${baseUrl}/api/webhooks/square`,
    eventTypes: [
      'order.updated',
      'payment.updated',
      'inventory.count.updated',
      'customer.updated'
    ],
    signatureKey: process.env.SQUARE_WEBHOOK_SIGNATURE_KEY || '',
    status: process.env.SQUARE_WEBHOOK_SIGNATURE_KEY ? 'active' : 'inactive'
  };
}

/**
 * Get webhook setup instructions for manual configuration
 */
export function getWebhookSetupInstructions(baseUrl: string): string {
  return `
# Square Webhook Setup Instructions

## Webhook URL
${baseUrl}/api/webhooks/square

## Required Event Types
- order.updated
- payment.updated
- inventory.count.updated
- customer.updated

## Setup Steps
1. Go to Square Developer Dashboard (https://developer.squareup.com/apps)
2. Select your Porch Records application
3. Navigate to "Webhooks" section
4. Click "Create Webhook"
5. Enter the webhook URL: ${baseUrl}/api/webhooks/square
6. Select the required event types:
   - order.updated
   - payment.updated
   - inventory.count.updated
   - customer.updated
7. Save the webhook
8. Copy the webhook signature key to your environment variables

## Environment Variables Required
Add this to your .env.local file:
\`\`\`
SQUARE_WEBHOOK_SIGNATURE_KEY=your_webhook_signature_key_here
\`\`\`

## Testing
You can test the webhook endpoint by visiting:
${baseUrl}/api/webhooks/square

This should return the webhook status and supported event types.

## Webhook Events Handled
- **order.updated**: When order status changes (pending, completed, cancelled)
- **payment.updated**: When payment status changes (pending, completed, failed)
- **inventory.count.updated**: When product inventory levels change
- **customer.updated**: When customer information is updated

## Security Features
- HMAC SHA256 signature verification
- Request origin validation
- Comprehensive audit logging
- Secure headers implementation
- Data sanitization for logging

## Troubleshooting
1. Ensure SQUARE_WEBHOOK_SIGNATURE_KEY is set correctly
2. Verify webhook URL is accessible from Square's servers
3. Check webhook endpoint logs for any errors
4. Test webhook with Square's test feature
  `.trim();
}

/**
 * Validate webhook configuration
 */
export function validateWebhookConfig(): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (!process.env.SQUARE_WEBHOOK_SIGNATURE_KEY) {
    issues.push('SQUARE_WEBHOOK_SIGNATURE_KEY environment variable is not set');
  }
  
  if (!process.env.SQUARE_ACCESS_TOKEN) {
    issues.push('SQUARE_ACCESS_TOKEN environment variable is not set');
  }
  
  if (!process.env.SQUARE_LOCATION_ID) {
    issues.push('SQUARE_LOCATION_ID environment variable is not set');
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Get webhook status information
 */
export function getWebhookStatus(baseUrl: string): WebhookSetupInfo {
  const config = getWebhookConfig(baseUrl);
  const validation = validateWebhookConfig();
  
  return {
    webhookUrl: config.url,
    supportedEvents: config.eventTypes,
    setupInstructions: getWebhookSetupInstructions(baseUrl),
    environmentVariables: [
      'SQUARE_WEBHOOK_SIGNATURE_KEY',
      'SQUARE_ACCESS_TOKEN',
      'SQUARE_LOCATION_ID',
      'SQUARE_APPLICATION_ID'
    ]
  };
}

/**
 * Generate webhook test data for development
 */
export function generateTestWebhookEvent(eventType: string): any {
  const baseEvent = {
    id: `test-event-${Date.now()}`,
    type: eventType,
    created_at: new Date().toISOString(),
    merchant_id: 'test-merchant-id'
  };

  switch (eventType) {
    case 'order.updated':
      return {
        ...baseEvent,
        data: {
          type: 'order',
          id: 'test-order-id',
          object: {
            id: 'test-order-id',
            reference_id: 'TEST-ORDER-123',
            state: 'COMPLETED',
            fulfillments: [{ type: 'PICKUP', state: 'PROPOSED' }]
          }
        }
      };
    
    case 'payment.updated':
      return {
        ...baseEvent,
        data: {
          type: 'payment',
          id: 'test-payment-id',
          object: {
            id: 'test-payment-id',
            order_id: 'test-order-id',
            status: 'COMPLETED',
            total_money: { amount: 2500, currency: 'AUD' }
          }
        }
      };
    
    case 'inventory.count.updated':
      return {
        ...baseEvent,
        data: {
          type: 'inventory_count',
          id: 'test-inventory-id',
          object: {
            catalog_object_id: 'test-product-id',
            location_id: 'test-location-id',
            quantity: '10',
            state: 'IN_STOCK'
          }
        }
      };
    
    case 'customer.updated':
      return {
        ...baseEvent,
        data: {
          type: 'customer',
          id: 'test-customer-id',
          object: {
            id: 'test-customer-id',
            email_address: 'test@example.com',
            given_name: 'Test',
            family_name: 'Customer'
          }
        }
      };
    
    default:
      return baseEvent;
  }
} 
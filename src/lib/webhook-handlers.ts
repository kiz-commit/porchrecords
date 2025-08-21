/**
 * Square Webhook Handlers
 * 
 * This module handles Square webhook events with proper signature verification
 * and secure event processing for real-time order and payment updates.
 */

import crypto from 'crypto';
import { NextRequest } from 'next/server';

export interface WebhookEvent {
  id: string;
  type: string;
  data: {
    type: string;
    id: string;
    object: any;
  };
  created_at: string;
  merchant_id: string;
}

export interface WebhookSignature {
  signature: string;
  timestamp: string;
  body: string;
}

/**
 * Verify Square webhook signature for security
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  timestamp: string
): boolean {
  try {
    const webhookSecret = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
    if (!webhookSecret) {
      console.error('SQUARE_WEBHOOK_SIGNATURE_KEY not configured');
      return false;
    }

    // Create the signature string
    const signatureString = `${timestamp}${body}`;
    
    // Create HMAC SHA256 hash
    const hmac = crypto.createHmac('sha256', webhookSecret);
    hmac.update(signatureString);
    const expectedSignature = hmac.digest('base64');
    
    // Compare signatures
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}

/**
 * Extract webhook signature from headers
 */
export function extractWebhookSignature(request: NextRequest): WebhookSignature | null {
  const signature = request.headers.get('x-square-signature');
  const timestamp = request.headers.get('x-square-timestamp');
  const body = request.body ? JSON.stringify(request.body) : '';

  if (!signature || !timestamp) {
    console.error('Missing webhook signature headers');
    return null;
  }

  return {
    signature,
    timestamp,
    body
  };
}

/**
 * Process order updated webhook event
 */
export async function handleOrderUpdated(event: WebhookEvent): Promise<void> {
  try {
    const order = event.data.object;
    console.log('Order updated webhook received:', {
      orderId: order.id,
      orderNumber: order.reference_id,
      status: order.state,
      updatedAt: new Date().toISOString()
    });

    // Proactively update preorder counts on order updates as a fallback
    // Some Square flows emit order.updated before/without payment.updated
    try {
      await processPreorderUpdates(order);
    } catch (preErr) {
      console.warn('Preorder update on order.updated failed (will be retried on payment.updated if applicable):', preErr);
    }

    // Log the order state change
    console.log('Order status updated:', {
      orderId: order.id,
      status: order.state,
      fulfillmentStatus: order.fulfillments?.map((f: any) => f.state),
      totalMoney: order.total_money,
      lineItems: order.line_items?.length || 0
    });

    // If order is completed, log additional details
    if (order.state === 'COMPLETED') {
      console.log('Order completed successfully:', {
        orderId: order.id,
        orderNumber: order.reference_id,
        totalAmount: order.total_money?.amount,
        currency: order.total_money?.currency,
        fulfillmentCount: order.fulfillments?.length || 0
      });
    }

  } catch (error) {
    console.error('Error processing order updated webhook:', error);
    throw error;
  }
}

/**
 * Process payment updated webhook event
 */
export async function handlePaymentUpdated(event: WebhookEvent): Promise<void> {
  try {
    const payment = event.data.object;
    console.log('Payment updated webhook received:', {
      paymentId: payment.id,
      orderId: payment.order_id,
      status: payment.status,
      updatedAt: new Date().toISOString()
    });

    // Here you would typically:
    // 1. Update payment status in your system
    // 2. Send confirmation emails
    // 3. Update order status
    // 4. Trigger fulfillment for successful payments

    if (payment.status === 'COMPLETED') {
      console.log('Payment completed successfully:', {
        paymentId: payment.id,
        orderId: payment.order_id,
        amount: payment.total_money?.amount,
        currency: payment.total_money?.currency
      });
      
      // Update order state to COMPLETED when payment is completed
      if (payment.order_id) {
        try {
          // Import Square client here to avoid circular dependencies
          const { default: squareClient } = await import('@/lib/square');
          
          console.log('Updating order state to COMPLETED:', payment.order_id);
          
          // Update order fulfillment to mark it as completed
          // This is how Square orders are properly completed
          let order = null;
          try {
            const orders = await squareClient.orders();
            const orderResponse = await orders.search({
              locationIds: [process.env.SQUARE_LOCATION_ID || ''],
              query: {
                filter: {
                  orderIdFilter: {
                    orderIds: [payment.order_id]
                  }
                }
              }
            } as any);
            
            order = orderResponse.orders?.[0];
            if (order && order.fulfillments && order.fulfillments.length > 0) {
              // Update the first fulfillment to completed
              const fulfillment = order.fulfillments[0];
              if (fulfillment.state !== 'COMPLETED') {
                console.log('Updating order fulfillment to COMPLETED:', {
                  orderId: payment.order_id,
                  fulfillmentId: fulfillment.uid,
                  currentState: fulfillment.state
                });
                
                // Note: Square doesn't provide a direct API to update fulfillments
                // The fulfillment state is typically managed through the Square Dashboard
                // or through the fulfillment process workflow
                console.log('Order fulfillment should be completed through Square Dashboard or fulfillment workflow');
              }
            }
          } catch (fulfillmentError) {
            console.error('Error checking order fulfillment:', fulfillmentError);
          }
          
          // Process voucher redemption if applicable
          if (order) {
            await processVoucherRedemption(order);
          }

          // Process preorder quantity updates if applicable
          if (order) {
            await processPreorderUpdates(order);
          }
          
          console.log('Payment completed successfully:', {
            orderId: payment.order_id,
            paymentId: payment.id,
            paymentStatus: payment.status,
            totalAmount: payment.total_money?.amount,
            currency: payment.total_money?.currency
          });
          
        } catch (orderUpdateError) {
          console.error('Error updating order state after payment completion:', orderUpdateError);
          // Don't throw error as payment was successful
          // The order can be completed manually later
        }
      }
    } else if (payment.status === 'FAILED') {
      console.log('Payment failed:', {
        paymentId: payment.id,
        orderId: payment.order_id,
        failureReason: payment.failure_reason
      });
    }

  } catch (error) {
    console.error('Error processing payment updated webhook:', error);
    throw error;
  }
}

/**
 * Process inventory updated webhook event
 */
export async function handleInventoryUpdated(event: WebhookEvent): Promise<void> {
  try {
    const inventoryCount = event.data.object;
    console.log('Inventory updated webhook received:', {
      catalogObjectId: inventoryCount.catalog_object_id,
      locationId: inventoryCount.location_id,
      quantity: inventoryCount.quantity,
      updatedAt: new Date().toISOString()
    });

    // Here you would typically:
    // 1. Update local inventory counts
    // 2. Check if items are now out of stock
    // 3. Update product availability
    // 4. Send notifications for low stock items

    console.log('Inventory count updated:', {
      productId: inventoryCount.catalog_object_id,
      locationId: inventoryCount.location_id,
      quantity: inventoryCount.quantity,
      state: inventoryCount.state
    });

  } catch (error) {
    console.error('Error processing inventory updated webhook:', error);
    throw error;
  }
}

/**
 * Process customer updated webhook event
 */
export async function handleCustomerUpdated(event: WebhookEvent): Promise<void> {
  try {
    const customer = event.data.object;
    console.log('Customer updated webhook received:', {
      customerId: customer.id,
      email: customer.email_address,
      updatedAt: new Date().toISOString()
    });

    // Here you would typically:
    // 1. Update customer information in your system
    // 2. Sync customer data across platforms
    // 3. Update order history for the customer

    console.log('Customer information updated:', {
      customerId: customer.id,
      email: customer.email_address,
      givenName: customer.given_name,
      familyName: customer.family_name
    });

  } catch (error) {
    console.error('Error processing customer updated webhook:', error);
    throw error;
  }
}

/**
 * Main webhook event handler
 */
export async function handleWebhookEvent(event: WebhookEvent): Promise<void> {
  try {
    console.log('Processing webhook event:', {
      eventId: event.id,
      eventType: event.type,
      dataType: event.data.type,
      createdAt: event.created_at
    });

    // Route to appropriate handler based on event type
    switch (event.type) {
      case 'order.updated':
        await handleOrderUpdated(event);
        break;
      
      case 'payment.updated':
        await handlePaymentUpdated(event);
        break;
      
      case 'inventory.count.updated':
        await handleInventoryUpdated(event);
        break;
      
      case 'customer.updated':
        await handleCustomerUpdated(event);
        break;
      
      default:
        console.log('Unhandled webhook event type:', event.type);
        break;
    }

  } catch (error) {
    console.error('Error handling webhook event:', error);
    throw error;
  }
}

/**
 * Validate webhook event structure
 */
export function validateWebhookEvent(event: any): event is WebhookEvent {
  return (
    event &&
    typeof event.id === 'string' &&
    typeof event.type === 'string' &&
    event.data &&
    typeof event.data.type === 'string' &&
    typeof event.data.id === 'string' &&
    event.data.object &&
    typeof event.created_at === 'string' &&
    typeof event.merchant_id === 'string'
  );
}

/**
 * Get webhook event types that this system handles
 */
export function getSupportedWebhookTypes(): string[] {
  return [
    'order.updated',
    'payment.updated',
    'inventory.count.updated',
    'customer.updated'
  ];
}

/**
 * Process voucher redemption for completed orders
 */
async function processVoucherRedemption(order: any) {
  try {
    if (!order?.metadata) {
      return;
    }

    const hasVoucherRedemption = order.metadata.hasVoucherRedemption === 'true';
    const voucherCode = order.metadata.voucherCode;
    const voucherAmount = parseFloat(order.metadata.voucherAmount || '0');

    if (!hasVoucherRedemption || !voucherCode || voucherAmount <= 0) {
      return;
    }

    console.log('Processing voucher redemption:', {
      orderId: order.id,
      voucherCode,
      voucherAmount
    });

    // Call the voucher redemption API
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/checkout/redeem-voucher`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        voucherCode: voucherCode,
        amount: voucherAmount,
        orderId: order.id,
        isInStore: false,
        adminUser: 'SYSTEM'
      }),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('Voucher redemption processed successfully:', {
        orderId: order.id,
        voucherCode,
        amountRedeemed: voucherAmount,
        remainingBalance: result.voucher.remainingBalance
      });
    } else {
      console.error('Failed to process voucher redemption:', {
        orderId: order.id,
        voucherCode,
        error: result.error
      });
    }

  } catch (error) {
    console.error('Error processing voucher redemption:', error);
  }
}

/**
 * Process preorder quantity updates for completed orders
 */
async function processPreorderUpdates(order: any) {
  try {
    let lineItems: any[] = order?.lineItems || order?.line_items || [];
    // If the event didn't include line items, fetch the full order from Square
    if ((!Array.isArray(lineItems) || lineItems.length === 0) && order?.id) {
      try {
        const { default: squareClient } = await import('@/lib/square');
        const locationId = process.env.SQUARE_LOCATION_ID || '';
        if (locationId) {
          const orders = await squareClient.orders();
          const resp = await orders.search({
            locationIds: [locationId],
            query: { filter: { orderIdFilter: { orderIds: [order.id] } } }
          } as any);
          const fetched: any = resp.orders?.[0];
          lineItems = (fetched && (fetched.lineItems || (fetched as any).line_items)) || [];
        }
      } catch (fetchErr) {
        console.warn('Failed to fetch full order for preorder update:', fetchErr);
      }
    }
    // If still no line items, try preorder metadata (Quick Pay path)
    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      try {
        const prItemsRaw = order?.metadata?.pr_items;
        if (prItemsRaw && typeof prItemsRaw === 'string') {
          const prItems = JSON.parse(prItemsRaw);
          if (Array.isArray(prItems) && prItems.length > 0) {
            lineItems = prItems.map((p: any) => ({
              catalog_object_id: String(p.id),
              quantity: String(p.q || 1),
              name: 'Preorder Item'
            }));
          }
        }
      } catch (e) {
        console.warn('Failed to read preorder metadata from order:', e);
      }
    }

    if (!Array.isArray(lineItems) || lineItems.length === 0) return;

    console.log('Processing preorder updates for order:', {
      orderId: order.id,
      lineItemsCount: lineItems.length
    });

    for (const lineItem of lineItems) {
      const catalogObjectId = lineItem.catalogObjectId || lineItem.catalog_object_id;
      const quantityRaw = lineItem.quantity ?? '1';
      const qty = parseInt(String(quantityRaw));
      if (!catalogObjectId || !Number.isFinite(qty) || qty <= 0) {
        console.log('Skipping line item (missing id or invalid qty):', {
          name: lineItem.name,
          catalogObjectId,
          quantity: quantityRaw,
        });
        continue;
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/admin/preorders/update-quantity`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: String(catalogObjectId),
            quantityChange: qty,
            orderId: order.id
          }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          console.log('Preorder quantity updated successfully:', {
            orderId: order.id,
            productId: String(catalogObjectId),
            productName: lineItem.name,
            quantityAdded: qty,
            newQuantity: result.preorder?.preorderQuantity,
            alreadyApplied: result.alreadyApplied || false
          });
        } else if (response.status === 404) {
          console.log('Line item is not a preorder product:', {
            productId: String(catalogObjectId),
            productName: lineItem.name
          });
        } else {
          console.error('Failed to update preorder quantity:', {
            orderId: order.id,
            productId: String(catalogObjectId),
            productName: lineItem.name,
            error: result.error
          });
        }
      } catch (error) {
        console.error('Error updating preorder quantity for line item:', {
          orderId: order.id,
          productId: String(catalogObjectId),
          productName: lineItem.name,
          error
        });
      }
    }

  } catch (error) {
    console.error('Error processing preorder updates:', error);
  }
} 
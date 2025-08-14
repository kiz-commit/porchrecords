import { PreorderData, getPreordersReleasingSoon } from './preorder-utils';

export interface NotificationTemplate {
  subject: string;
  body: string;
  type: 'release_reminder' | 'release_notification' | 'status_update';
}

export interface PreorderNotification {
  id: string;
  productId: string;
  recipientEmail: string;
  template: NotificationTemplate;
  scheduledFor: string;
  status: 'pending' | 'sent' | 'failed';
  createdAt: string;
  sentAt?: string;
  error?: string;
}

/**
 * Generate notification templates for preorder communications
 */
export function generateNotificationTemplates(preorder: PreorderData, productName: string): {
  releaseReminder: NotificationTemplate;
  releaseNotification: NotificationTemplate;
  statusUpdate: NotificationTemplate;
} {
  const releaseDate = new Date(preorder.preorderReleaseDate).toLocaleDateString();
  
  return {
    releaseReminder: {
      type: 'release_reminder',
      subject: `Reminder: ${productName} releases in 3 days`,
      body: `Hi there!

Just a friendly reminder that your preordered item "${productName}" will be released on ${releaseDate}.

We'll send you another notification when it's officially available for shipping.

Thanks for your preorder!

Best regards,
Porch Records Team`,
    },
    
    releaseNotification: {
      type: 'release_notification',
      subject: `🎉 ${productName} is now available!`,
      body: `Great news!

Your preordered item "${productName}" is now officially released and will be shipping soon.

Release Date: ${releaseDate}

We'll process your order and get it shipped out to you as quickly as possible. You'll receive a tracking notification once your order is on its way.

Thank you for your patience and support!

Best regards,
Porch Records Team`,
    },
    
    statusUpdate: {
      type: 'status_update',
      subject: `Update on your preorder: ${productName}`,
      body: `Hi there!

We wanted to update you on the status of your preordered item "${productName}".

Expected Release Date: ${releaseDate}

We'll continue to keep you informed of any changes to the release schedule.

Thanks for your preorder!

Best regards,
Porch Records Team`,
    },
  };
}

/**
 * Generate notifications for preorders releasing soon
 */
export async function generateUpcomingReleaseNotifications(daysAhead: number = 3): Promise<PreorderNotification[]> {
  const upcomingPreorders = await getPreordersReleasingSoon(daysAhead);
  const notifications: PreorderNotification[] = [];
  
  // Note: In a real implementation, you would fetch customer emails from your orders/customers database
  // For now, this is a template for the notification structure
  
  for (const preorder of upcomingPreorders) {
    const templates = generateNotificationTemplates(preorder, preorder.productId);
    
    // Example notification structure - you'd need to fetch actual customer emails
    const notification: PreorderNotification = {
      id: `notify_${preorder.productId}_${Date.now()}`,
      productId: preorder.productId,
      recipientEmail: 'customer@example.com', // Would be fetched from orders/customers
      template: templates.releaseReminder,
      scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Schedule for tomorrow
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    
    notifications.push(notification);
  }
  
  return notifications;
}

/**
 * Generate release notifications for products that just became available
 */
export async function generateReleaseNotifications(releasedProductIds: string[]): Promise<PreorderNotification[]> {
  const notifications: PreorderNotification[] = [];
  
  // Note: In a real implementation, you would fetch customer emails from your orders/customers database
  
  for (const productId of releasedProductIds) {
    // Example notification structure
    const notification: PreorderNotification = {
      id: `release_${productId}_${Date.now()}`,
      productId,
      recipientEmail: 'customer@example.com', // Would be fetched from orders/customers
      template: {
        type: 'release_notification',
        subject: `🎉 Your preorder is now available!`,
        body: `Your preordered item is now officially released and will be shipping soon!`,
      },
      scheduledFor: new Date().toISOString(), // Send immediately
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    
    notifications.push(notification);
  }
  
  return notifications;
}

/**
 * Mock email sending function
 * In a real implementation, this would integrate with your email service (SendGrid, Mailgun, etc.)
 */
export async function sendNotificationEmail(notification: PreorderNotification): Promise<boolean> {
  try {
    console.log('📧 Sending preorder notification email:', {
      to: notification.recipientEmail,
      subject: notification.template.subject,
      productId: notification.productId,
      type: notification.template.type,
    });
    
    // Mock email sending delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // In a real implementation, you would:
    // 1. Use your email service API
    // 2. Handle authentication
    // 3. Format the email with proper HTML templates
    // 4. Handle bounces and failures
    // 5. Track delivery status
    
    console.log('✅ Email sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to send notification email:', error);
    return false;
  }
}

/**
 * Process pending notifications
 */
export async function processPendingNotifications(notifications: PreorderNotification[]): Promise<{
  sent: number;
  failed: number;
  results: PreorderNotification[];
}> {
  const results: PreorderNotification[] = [];
  let sent = 0;
  let failed = 0;
  
  for (const notification of notifications) {
    if (notification.status !== 'pending') {
      results.push(notification);
      continue;
    }
    
    // Check if it's time to send
    const scheduledTime = new Date(notification.scheduledFor);
    const now = new Date();
    
    if (scheduledTime > now) {
      results.push(notification);
      continue;
    }
    
    // Attempt to send
    const success = await sendNotificationEmail(notification);
    
    const updatedNotification: PreorderNotification = {
      ...notification,
      status: success ? 'sent' : 'failed',
      sentAt: success ? new Date().toISOString() : undefined,
      error: success ? undefined : 'Failed to send email',
    };
    
    if (success) {
      sent++;
    } else {
      failed++;
    }
    
    results.push(updatedNotification);
  }
  
  return { sent, failed, results };
}

/**
 * Get notification statistics
 */
export function getNotificationStats(notifications: PreorderNotification[]): {
  total: number;
  pending: number;
  sent: number;
  failed: number;
  byType: Record<string, number>;
} {
  const stats = {
    total: notifications.length,
    pending: 0,
    sent: 0,
    failed: 0,
    byType: {} as Record<string, number>,
  };
  
  for (const notification of notifications) {
    stats[notification.status]++;
    
    const type = notification.template.type;
    stats.byType[type] = (stats.byType[type] || 0) + 1;
  }
  
  return stats;
}
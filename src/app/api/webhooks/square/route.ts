import { NextRequest, NextResponse } from 'next/server';
import { 
  verifyWebhookSignature, 
  extractWebhookSignature, 
  handleWebhookEvent, 
  validateWebhookEvent,
  getSupportedWebhookTypes,
  WebhookEvent
} from '@/lib/webhook-handlers';
import { 
  logSecurityAuditEvent, 
  getSecurityHeaders,
  sanitizeForLogging 
} from '@/lib/pci-compliance';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const webhookId = `webhook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    console.log('Webhook received:', {
      webhookId,
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers.entries())
    });

    // Extract webhook signature from headers
    const signatureData = extractWebhookSignature(request);
    if (!signatureData) {
      logSecurityAuditEvent(
        'webhook_signature_missing',
        { webhookId },
        false,
        'Missing webhook signature headers',
        request
      );
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Get the raw body for signature verification
    const body = await request.text();
    
    // Verify webhook signature
    const signatureValid = verifyWebhookSignature(
      body,
      signatureData.signature,
      signatureData.timestamp
    );

    if (!signatureValid) {
      logSecurityAuditEvent(
        'webhook_signature_invalid',
        { 
          webhookId,
          signature: signatureData.signature.substring(0, 10) + '...',
          timestamp: signatureData.timestamp
        },
        false,
        'Invalid webhook signature',
        request
      );
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401, headers: getSecurityHeaders() }
      );
    }

    // Parse webhook event
    let event: WebhookEvent;
    try {
      event = JSON.parse(body);
    } catch (error) {
      logSecurityAuditEvent(
        'webhook_invalid_json',
        { webhookId, body: body.substring(0, 100) + '...' },
        false,
        'Invalid JSON in webhook body',
        request
      );
      return NextResponse.json(
        { error: 'Invalid JSON in webhook body' },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Validate webhook event structure
    if (!validateWebhookEvent(event)) {
      logSecurityAuditEvent(
        'webhook_invalid_structure',
        { webhookId, eventType: (event as any)?.type },
        false,
        'Invalid webhook event structure',
        request
      );
      return NextResponse.json(
        { error: 'Invalid webhook event structure' },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Check if we support this event type
    const supportedTypes = getSupportedWebhookTypes();
    if (!supportedTypes.includes(event.type)) {
      console.log('Unsupported webhook event type:', event.type);
      // Return 200 for unsupported events to acknowledge receipt
      return NextResponse.json(
        { message: 'Event type not supported' },
        { status: 200, headers: getSecurityHeaders() }
      );
    }

    // Log webhook event (sanitized)
    console.log('Processing webhook event:', sanitizeForLogging({
      webhookId,
      eventId: event.id,
      eventType: event.type,
      dataType: event.data.type,
      merchantId: event.merchant_id,
      createdAt: event.created_at
    }));

    // Process the webhook event
    await handleWebhookEvent(event);

    // Log successful processing
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    logSecurityAuditEvent(
      'webhook_processed_successfully',
      { 
        webhookId,
        eventId: event.id,
        eventType: event.type,
        duration: `${duration}ms`
      },
      true,
      'Webhook processed successfully',
      request
    );

    console.log('Webhook processed successfully:', {
      webhookId,
      eventId: event.id,
      eventType: event.type,
      duration: `${duration}ms`
    });

    // Return success response
    return NextResponse.json(
      { 
        success: true, 
        message: 'Webhook processed successfully',
        eventId: event.id,
        eventType: event.type
      },
      { status: 200, headers: getSecurityHeaders() }
    );

  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    logSecurityAuditEvent(
      'webhook_processing_error',
      { 
        webhookId,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration}ms`
      },
      false,
      'Webhook processing failed',
      request
    );

    console.error('Webhook processing error:', {
      webhookId,
      error: error instanceof Error ? error.message : 'Unknown error',
      duration: `${duration}ms`
    });

    // Return error response (but don't expose internal details)
    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        webhookId
      },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}

// Handle GET requests for webhook verification
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const challenge = url.searchParams.get('challenge');

    if (challenge) {
      // Square webhook verification challenge
      console.log('Webhook verification challenge received:', challenge);
      
      logSecurityAuditEvent(
        'webhook_verification_challenge',
        { challenge },
        true,
        'Webhook verification challenge',
        request
      );

      return NextResponse.json(
        { challenge },
        { status: 200, headers: getSecurityHeaders() }
      );
    }

    // Return webhook status information
    return NextResponse.json(
      {
        status: 'active',
        supportedEvents: getSupportedWebhookTypes(),
        timestamp: new Date().toISOString()
      },
      { status: 200, headers: getSecurityHeaders() }
    );

  } catch (error) {
    console.error('Webhook GET request error:', error);
    
    return NextResponse.json(
      { error: 'Webhook endpoint error' },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
} 
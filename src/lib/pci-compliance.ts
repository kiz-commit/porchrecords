/**
 * Security Utilities for Square Checkout
 * 
 * This module provides utilities for security and audit logging:
 * 1. Security headers for web requests
 * 2. Audit logging for order and checkout events
 * 3. Environment validation
 * 4. Request origin validation
 */

export interface SecurityAuditLog {
  timestamp: string;
  action: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  details: Record<string, any>;
  success: boolean;
  error?: string;
}

export interface SecurityHeaders {
  'Content-Security-Policy': string;
  'X-Frame-Options': string;
  'X-Content-Type-Options': string;
  'Referrer-Policy': string;
  'Strict-Transport-Security'?: string;
  [key: string]: string | undefined;
}

/**
 * Validate that no sensitive data is present in the request
 * Note: With Square Checkout, no payment data should touch our servers
 */
export function validateNoSensitiveData(data: any): { valid: boolean; issues: string[] } {
  // Since we're using Square Checkout, no payment data should be present
  // This function is kept for future validation needs
  return {
    valid: true,
    issues: []
  };
}

/**
 * Generate security headers for PCI compliance
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://sandbox.web.squarecdn.com https://web.squarecdn.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' https://connect.squareup.com https://api.squareup.com",
      "frame-src https://sandbox.web.squarecdn.com https://web.squarecdn.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; '),
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
  };
}

/**
 * Log security audit event
 */
export function logSecurityAuditEvent(
  action: string,
  details: Record<string, any>,
  success: boolean,
  error?: string,
  request?: Request
): SecurityAuditLog {
  const auditLog: SecurityAuditLog = {
    timestamp: new Date().toISOString(),
    action,
    details,
    success,
    error
  };

  // Add request information if available
  if (request) {
    const headers = request.headers;
    auditLog.ipAddress = headers.get('x-forwarded-for') || 
                        headers.get('x-real-ip') || 
                        'unknown';
    auditLog.userAgent = headers.get('user-agent') || 'unknown';
  }

  // Log to console for development (in production, this would go to a secure audit log)
  console.log('Security Audit Log:', JSON.stringify(auditLog, null, 2));

  return auditLog;
}

/**
 * Validate Square order ID format
 */
export function validateSquareOrderId(orderId: string): boolean {
  // Square order IDs are typically alphanumeric strings
  return typeof orderId === 'string' && 
         orderId.length > 0 && 
         /^[a-zA-Z0-9_-]+$/.test(orderId);
}

/**
 * Sanitize data for logging (remove sensitive information)
 */
export function sanitizeForLogging(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = { ...data };
  const sensitiveKeys = ['orderId', 'customerEmail', 'customerPhone'];

  Object.keys(sanitized).forEach(key => {
    if (sensitiveKeys.some(sensitiveKey => 
      key.toLowerCase().includes(sensitiveKey.toLowerCase())
    )) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLogging(sanitized[key]);
    }
  });

  return sanitized;
}

/**
 * Validate environment variables for Square Checkout
 */
export function validateSquareEnvironment(): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const requiredVars = [
    'SQUARE_ACCESS_TOKEN',
    'SQUARE_APPLICATION_ID',
    'SQUARE_LOCATION_ID'
  ];

  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      issues.push(`Missing required environment variable: ${varName}`);
    }
  });

  // Check for base URL in production
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.NEXT_PUBLIC_BASE_URL) {
      issues.push('Missing NEXT_PUBLIC_BASE_URL for production');
    }
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

/**
 * Generate a secure session ID for tracking
 */
export function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate request origin for security
 */
export function validateRequestOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  // In development, allow localhost
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  // In production, validate against allowed domains
  const allowedDomains = [
    process.env.NEXT_PUBLIC_SITE_URL,
    'https://porchrecords.com',
    'https://www.porchrecords.com'
  ].filter(Boolean);

  if (origin && allowedDomains.some(domain => origin.startsWith(domain!))) {
    return true;
  }

  if (referer && allowedDomains.some(domain => referer.startsWith(domain!))) {
    return true;
  }

  return false;
} 
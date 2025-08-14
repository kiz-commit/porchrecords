/**
 * Comprehensive Error Handling System
 * 
 * This module provides centralized error handling for the checkout process,
 * including user-friendly error messages, error categorization, and recovery suggestions.
 */

export interface ErrorInfo {
  code: string;
  message: string;
  userMessage: string;
  category: 'validation' | 'payment' | 'network' | 'inventory' | 'system' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoverable: boolean;
  suggestions: string[];
  retryable: boolean;
}

export interface ErrorContext {
  action: string;
  step: string;
  timestamp: string;
  sessionId?: string;
  userId?: string;
  additionalData?: Record<string, any>;
}

/**
 * Error codes and their corresponding user-friendly messages
 */
export const ERROR_CODES: Record<string, ErrorInfo> = {
  // Validation Errors
  'VALIDATION_REQUIRED_FIELD': {
    code: 'VALIDATION_REQUIRED_FIELD',
    message: 'Required field validation failed',
    userMessage: 'Please fill in all required fields marked with *',
    category: 'validation',
    severity: 'low',
    recoverable: true,
    suggestions: ['Check that all required fields are filled', 'Look for red asterisks (*) next to field labels'],
    retryable: true
  },
  'VALIDATION_EMAIL_INVALID': {
    code: 'VALIDATION_EMAIL_INVALID',
    message: 'Invalid email format',
    userMessage: 'Please enter a valid email address',
    category: 'validation',
    severity: 'low',
    recoverable: true,
    suggestions: ['Check your email address format', 'Make sure to include @ and domain'],
    retryable: true
  },
  'VALIDATION_PHONE_INVALID': {
    code: 'VALIDATION_PHONE_INVALID',
    message: 'Invalid phone number format',
    userMessage: 'Please enter a valid phone number',
    category: 'validation',
    severity: 'low',
    recoverable: true,
    suggestions: ['Enter phone number with country code', 'Example: +61 4XX XXX XXX'],
    retryable: true
  },

  // Payment Errors
  'PAYMENT_CARD_DECLINED': {
    code: 'PAYMENT_CARD_DECLINED',
    message: 'Payment card was declined',
    userMessage: 'Your payment was declined. Please try a different card or contact your bank.',
    category: 'payment',
    severity: 'medium',
    recoverable: true,
    suggestions: ['Try a different payment method', 'Contact your bank to authorize the transaction', 'Check your card details'],
    retryable: true
  },
  'PAYMENT_INSUFFICIENT_FUNDS': {
    code: 'PAYMENT_INSUFFICIENT_FUNDS',
    message: 'Insufficient funds on payment card',
    userMessage: 'Your card has insufficient funds for this transaction.',
    category: 'payment',
    severity: 'medium',
    recoverable: true,
    suggestions: ['Try a different payment method', 'Check your account balance', 'Use a different card'],
    retryable: true
  },
  'PAYMENT_INVALID_CARD': {
    code: 'PAYMENT_INVALID_CARD',
    message: 'Invalid card information',
    userMessage: 'Please check your card details and try again.',
    category: 'payment',
    severity: 'medium',
    recoverable: true,
    suggestions: ['Verify your card number', 'Check expiry date', 'Ensure CVV is correct'],
    retryable: true
  },
  'PAYMENT_EXPIRED_CARD': {
    code: 'PAYMENT_EXPIRED_CARD',
    message: 'Payment card has expired',
    userMessage: 'Your card has expired. Please use a different payment method.',
    category: 'payment',
    severity: 'medium',
    recoverable: true,
    suggestions: ['Use a different card', 'Update your card information', 'Contact your bank for a new card'],
    retryable: true
  },
  'PAYMENT_TOKENIZATION_FAILED': {
    code: 'PAYMENT_TOKENIZATION_FAILED',
    message: 'Payment tokenization failed',
    userMessage: 'Unable to process your payment. Please try again.',
    category: 'payment',
    severity: 'high',
    recoverable: true,
    suggestions: ['Refresh the page and try again', 'Check your internet connection', 'Try a different browser'],
    retryable: true
  },

  // Network Errors
  'NETWORK_TIMEOUT': {
    code: 'NETWORK_TIMEOUT',
    message: 'Network request timed out',
    userMessage: 'The request took too long. Please check your connection and try again.',
    category: 'network',
    severity: 'medium',
    recoverable: true,
    suggestions: ['Check your internet connection', 'Try again in a few moments', 'Refresh the page'],
    retryable: true
  },
  'NETWORK_OFFLINE': {
    code: 'NETWORK_OFFLINE',
    message: 'No internet connection',
    userMessage: 'Please check your internet connection and try again.',
    category: 'network',
    severity: 'medium',
    recoverable: true,
    suggestions: ['Check your WiFi or mobile data', 'Try refreshing the page', 'Wait for connection to restore'],
    retryable: true
  },
  'NETWORK_SERVER_ERROR': {
    code: 'NETWORK_SERVER_ERROR',
    message: 'Server error occurred',
    userMessage: 'We\'re experiencing technical difficulties. Please try again in a few moments.',
    category: 'network',
    severity: 'high',
    recoverable: true,
    suggestions: ['Try again in a few minutes', 'Contact support if the problem persists', 'Check our status page'],
    retryable: true
  },

  // Inventory Errors
  'INVENTORY_OUT_OF_STOCK': {
    code: 'INVENTORY_OUT_OF_STOCK',
    message: 'Item is out of stock',
    userMessage: 'One or more items in your cart are no longer available.',
    category: 'inventory',
    severity: 'medium',
    recoverable: true,
    suggestions: ['Remove unavailable items from cart', 'Check back later for restock', 'Contact us for availability'],
    retryable: false
  },
  'INVENTORY_LOW_STOCK': {
    code: 'INVENTORY_LOW_STOCK',
    message: 'Insufficient stock for requested quantity',
    userMessage: 'We don\'t have enough stock for your requested quantity.',
    category: 'inventory',
    severity: 'medium',
    recoverable: true,
    suggestions: ['Reduce the quantity in your cart', 'Check if we have enough stock', 'Contact us for alternatives'],
    retryable: true
  },
  'INVENTORY_CHECK_FAILED': {
    code: 'INVENTORY_CHECK_FAILED',
    message: 'Failed to check inventory',
    userMessage: 'Unable to verify item availability. Please try again.',
    category: 'inventory',
    severity: 'medium',
    recoverable: true,
    suggestions: ['Try refreshing the page', 'Check your internet connection', 'Contact support if the problem persists'],
    retryable: true
  },

  // System Errors
  'SYSTEM_CONFIGURATION_ERROR': {
    code: 'SYSTEM_CONFIGURATION_ERROR',
    message: 'System configuration error',
    userMessage: 'We\'re experiencing technical difficulties. Please try again later.',
    category: 'system',
    severity: 'high',
    recoverable: false,
    suggestions: ['Try again later', 'Contact support for assistance', 'Check our status page'],
    retryable: true
  },
  'SYSTEM_MAINTENANCE': {
    code: 'SYSTEM_MAINTENANCE',
    message: 'System under maintenance',
    userMessage: 'We\'re currently performing maintenance. Please try again later.',
    category: 'system',
    severity: 'medium',
    recoverable: false,
    suggestions: ['Try again in a few hours', 'Check our status page for updates', 'Contact support for urgent orders'],
    retryable: true
  },

  // Security Errors
  'SECURITY_INVALID_TOKEN': {
    code: 'SECURITY_INVALID_TOKEN',
    message: 'Invalid security token',
    userMessage: 'Security verification failed. Please refresh the page and try again.',
    category: 'security',
    severity: 'high',
    recoverable: true,
    suggestions: ['Refresh the page', 'Clear your browser cache', 'Try a different browser'],
    retryable: true
  },
  'SECURITY_SIGNATURE_INVALID': {
    code: 'SECURITY_SIGNATURE_INVALID',
    message: 'Invalid webhook signature',
    userMessage: 'Security verification failed. Please contact support.',
    category: 'security',
    severity: 'critical',
    recoverable: false,
    suggestions: ['Contact support immediately', 'Do not retry the transaction', 'Check for suspicious activity'],
    retryable: false
  }
};

/**
 * Parse error and return user-friendly information
 */
export function parseError(error: any, context?: ErrorContext): ErrorInfo {
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  const errorCode = error?.code || 'UNKNOWN_ERROR';

  // Try to find specific error code
  if (ERROR_CODES[errorCode]) {
    return ERROR_CODES[errorCode];
  }

  // Parse common error patterns
  if (errorMessage.toLowerCase().includes('declined')) {
    return ERROR_CODES['PAYMENT_CARD_DECLINED'];
  }
  if (errorMessage.toLowerCase().includes('insufficient funds')) {
    return ERROR_CODES['PAYMENT_INSUFFICIENT_FUNDS'];
  }
  if (errorMessage.toLowerCase().includes('expired')) {
    return ERROR_CODES['PAYMENT_EXPIRED_CARD'];
  }
  if (errorMessage.toLowerCase().includes('timeout')) {
    return ERROR_CODES['NETWORK_TIMEOUT'];
  }
  if (errorMessage.toLowerCase().includes('out of stock')) {
    return ERROR_CODES['INVENTORY_OUT_OF_STOCK'];
  }

  // Default error for unknown cases
  return {
    code: 'UNKNOWN_ERROR',
    message: errorMessage,
    userMessage: 'An unexpected error occurred. Please try again.',
    category: 'system',
    severity: 'medium',
    recoverable: true,
    suggestions: ['Try refreshing the page', 'Check your internet connection', 'Contact support if the problem persists'],
    retryable: true
  };
}

/**
 * Log error with context for debugging
 */
export function logError(error: any, context?: ErrorContext): void {
  const errorInfo = parseError(error, context);
  const logData = {
    error: errorInfo,
    context,
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    url: typeof window !== 'undefined' ? window.location.href : 'server'
  };

  console.error('Error logged:', logData);

  // In production, this would send to an error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: sendToErrorTrackingService(logData);
    console.log('Error would be sent to tracking service in production');
  }
}

/**
 * Get recovery action for error
 */
export function getRecoveryAction(errorInfo: ErrorInfo): string {
  if (!errorInfo.recoverable) {
    return 'Contact support for assistance';
  }

  if (errorInfo.retryable) {
    return 'Try again';
  }

  return 'Please review your information and try again';
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: any): boolean {
  const errorInfo = parseError(error);
  return errorInfo.retryable;
}

/**
 * Get error category icon
 */
export function getErrorIcon(category: string): string {
  switch (category) {
    case 'validation':
      return '⚠️';
    case 'payment':
      return '💳';
    case 'network':
      return '🌐';
    case 'inventory':
      return '📦';
    case 'system':
      return '⚙️';
    case 'security':
      return '🔒';
    default:
      return '❌';
  }
}

/**
 * Get error severity color
 */
export function getErrorColor(severity: string): string {
  switch (severity) {
    case 'low':
      return 'text-yellow-800 bg-yellow-50 border-yellow-200';
    case 'medium':
      return 'text-orange-800 bg-orange-50 border-orange-200';
    case 'high':
      return 'text-red-800 bg-red-50 border-red-200';
    case 'critical':
      return 'text-red-900 bg-red-100 border-red-300';
    default:
      return 'text-gray-800 bg-gray-50 border-gray-200';
  }
}

export function getErrorColorStyles(severity: string): React.CSSProperties {
  switch (severity) {
    case 'low':
      return {
        color: 'rgb(133, 77, 14)',
        backgroundColor: 'rgba(254, 243, 199, 0.5)',
        borderColor: 'rgba(253, 230, 138, 0.5)'
      };
    case 'medium':
      return {
        color: 'rgb(154, 52, 18)',
        backgroundColor: 'rgba(255, 237, 213, 0.5)',
        borderColor: 'rgba(254, 215, 170, 0.5)'
      };
    case 'high':
      return {
        color: 'rgb(153, 27, 27)',
        backgroundColor: 'rgba(254, 242, 242, 0.5)',
        borderColor: 'rgba(254, 202, 202, 0.5)'
      };
    case 'critical':
      return {
        color: 'rgb(127, 29, 29)',
        backgroundColor: 'rgba(254, 226, 226, 0.5)',
        borderColor: 'rgba(252, 165, 165, 0.5)'
      };
    default:
      return {
        color: 'rgb(55, 65, 81)',
        backgroundColor: 'rgba(249, 250, 251, 0.5)',
        borderColor: 'rgba(229, 231, 235, 0.5)'
      };
  }
}

// PageBuilder Error Handling Utilities

export interface PageBuilderError {
  id: string;
  type: 'section' | 'page' | 'save' | 'load' | 'validation' | 'network' | 'unknown';
  message: string;
  details?: string;
  recoverable: boolean;
  timestamp: Date;
  component?: string;
  sectionId?: string;
}

export interface ErrorRecoveryAction {
  label: string;
  action: () => void | Promise<void>;
  type: 'retry' | 'fallback' | 'reset' | 'ignore';
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: PageBuilderError;
  recoveryActions: ErrorRecoveryAction[];
}

// Error types and their recovery strategies
export const ERROR_TYPES = {
  SECTION_RENDER: 'section' as const,
  PAGE_LOAD: 'page' as const,
  SAVE_FAILED: 'save' as const,
  VALIDATION: 'validation' as const,
  NETWORK: 'network' as const,
  UNKNOWN: 'unknown' as const,
} as const;

// Create user-friendly error messages
export function createErrorMessage(error: Error, context?: string): string {
  const baseMessage = error.message || 'An unexpected error occurred';
  
  if (error.name === 'TypeError' && error.message.includes('Cannot read property')) {
    return 'Data structure is invalid. This might be due to a recent update.';
  }
  
  if (error.name === 'NetworkError' || error.message.includes('fetch')) {
    return 'Network connection issue. Please check your internet connection.';
  }
  
  if (error.message.includes('JSON')) {
    return 'Data format error. The page data might be corrupted.';
  }
  
  if (context) {
    return `${context}: ${baseMessage}`;
  }
  
  return baseMessage;
}

// Generate recovery actions based on error type
export function generateRecoveryActions(
  error: PageBuilderError,
  onRetry?: () => void | Promise<void>,
  onReset?: () => void | Promise<void>,
  onFallback?: () => void | Promise<void>
): ErrorRecoveryAction[] {
  const actions: ErrorRecoveryAction[] = [];

  switch (error.type) {
    case 'section':
      if (onRetry) {
        actions.push({
          label: 'Retry Section',
          action: onRetry,
          type: 'retry'
        });
      }
      if (onFallback) {
        actions.push({
          label: 'Use Fallback Content',
          action: onFallback,
          type: 'fallback'
        });
      }
      break;

    case 'page':
      if (onRetry) {
        actions.push({
          label: 'Reload Page',
          action: onRetry,
          type: 'retry'
        });
      }
      if (onReset) {
        actions.push({
          label: 'Reset to Last Saved',
          action: onReset,
          type: 'reset'
        });
      }
      break;

    case 'save':
      if (onRetry) {
        actions.push({
          label: 'Try Saving Again',
          action: onRetry,
          type: 'retry'
        });
      }
      if (onFallback) {
        actions.push({
          label: 'Save as Draft',
          action: onFallback,
          type: 'fallback'
        });
      }
      break;

    case 'network':
      if (onRetry) {
        actions.push({
          label: 'Retry Connection',
          action: onRetry,
          type: 'retry'
        });
      }
      break;

    case 'validation':
      actions.push({
        label: 'Fix Issues',
        action: () => {
          // Scroll to validation errors
          const errorElements = document.querySelectorAll('[data-validation-error]');
          if (errorElements.length > 0) {
            errorElements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        },
        type: 'retry'
      });
      break;

    default:
      if (onRetry) {
        actions.push({
          label: 'Try Again',
          action: onRetry,
          type: 'retry'
        });
      }
      if (onReset) {
        actions.push({
          label: 'Reset',
          action: onReset,
          type: 'reset'
        });
      }
  }

  // Always add ignore option for non-critical errors
  if (error.recoverable) {
    actions.push({
      label: 'Continue Anyway',
      action: () => {
        // This will be handled by the error boundary
        console.warn('User chose to continue despite error:', error);
      },
      type: 'ignore'
    });
  }

  return actions;
}

// Create a PageBuilder error from a standard Error
export function createPageBuilderError(
  error: Error,
  type: PageBuilderError['type'],
  context?: {
    component?: string;
    sectionId?: string;
    recoverable?: boolean;
  }
): PageBuilderError {
  return {
    id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    message: createErrorMessage(error, context?.component),
    details: error.stack,
    recoverable: context?.recoverable ?? true,
    timestamp: new Date(),
    component: context?.component,
    sectionId: context?.sectionId,
  };
}

// Auto-recovery strategies
export const AUTO_RECOVERY_STRATEGIES = {
  // Auto-retry network errors
  network: {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
  },
  
  // Auto-reset corrupted data
  dataCorruption: {
    maxAttempts: 1,
    fallbackToLastSaved: true,
  },
  
  // Auto-fallback for section errors
  sectionError: {
    maxRetries: 2,
    fallbackToPlaceholder: true,
  },
} as const;

// Error logging and analytics for PageBuilder
export function logPageBuilderError(error: PageBuilderError, additionalContext?: Record<string, any>) {
  console.error('PageBuilder Error:', {
    ...error,
    context: additionalContext,
    userAgent: navigator.userAgent,
    timestamp: error.timestamp.toISOString(),
  });

  // In production, you might want to send this to an error tracking service
  // like Sentry, LogRocket, or your own analytics
  if (process.env.NODE_ENV === 'production') {
    // Example: sendToErrorTracking(error, additionalContext);
  }
}

// Error boundary utilities
export function shouldRetryError(error: PageBuilderError, retryCount: number): boolean {
  if (error.type === 'network') {
    return retryCount < AUTO_RECOVERY_STRATEGIES.network.maxRetries;
  }
  
  if (error.type === 'section') {
    return retryCount < AUTO_RECOVERY_STRATEGIES.sectionError.maxRetries;
  }
  
  return false;
}

export function getRetryDelay(error: PageBuilderError, retryCount: number): number {
  if (error.type === 'network') {
    return AUTO_RECOVERY_STRATEGIES.network.retryDelay * 
           Math.pow(AUTO_RECOVERY_STRATEGIES.network.backoffMultiplier, retryCount);
  }
  
  return 1000; // Default 1 second
} 
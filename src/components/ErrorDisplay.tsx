"use client";

import { useState } from 'react';
import { ErrorInfo, parseError, logError, getErrorIcon, getErrorColor, getErrorColorStyles, getRecoveryAction } from '@/lib/error-handling';

interface ErrorDisplayProps {
  error: any;
  context?: {
    action: string;
    step: string;
    sessionId?: string;
    timestamp?: string;
  };
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export default function ErrorDisplay({ 
  error, 
  context, 
  onRetry, 
  onDismiss, 
  className = '' 
}: ErrorDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // Parse the error to get user-friendly information
  const errorInfo = parseError(error, context ? { ...context, timestamp: new Date().toISOString() } : undefined);
  
  // Log the error for debugging
  logError(error, context ? { ...context, timestamp: new Date().toISOString() } : undefined);

  const handleRetry = async () => {
    if (!onRetry) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
    } catch (retryError) {
      console.error('Retry failed:', retryError);
    } finally {
      setIsRetrying(false);
    }
  };

  const errorColorClasses = getErrorColor(errorInfo.severity);
  const errorColorStyles = getErrorColorStyles(errorInfo.severity);
  const errorIcon = getErrorIcon(errorInfo.category);
  const recoveryAction = getRecoveryAction(errorInfo);

  return (
    <div className={`rounded-lg border p-4 ${className}`} style={errorColorStyles}>
      {/* Error Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">{errorIcon}</span>
          <div>
            <h3 className="font-semibold text-sm">
              {errorInfo.userMessage}
            </h3>
            <p className="text-xs opacity-75 mt-1">
              Error: {errorInfo.code}
            </p>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-xs px-2 py-1 rounded hover:bg-black/10 transition-colors"
            >
              Dismiss
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs px-2 py-1 rounded hover:bg-black/10 transition-colors"
          >
            {isExpanded ? 'Less' : 'More'}
          </button>
        </div>
      </div>

      {/* Error Details (Expandable) */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-current/20">
          {/* Suggestions */}
          {errorInfo.suggestions.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium text-xs mb-2">Suggestions:</h4>
              <ul className="text-xs space-y-1">
                {errorInfo.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-xs mt-0.5">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Technical Details */}
          <div className="mb-4">
            <h4 className="font-medium text-xs mb-2">Technical Details:</h4>
            <div className="text-xs space-y-1">
              <p><strong>Category:</strong> {errorInfo.category}</p>
              <p><strong>Severity:</strong> {errorInfo.severity}</p>
              <p><strong>Recoverable:</strong> {errorInfo.recoverable ? 'Yes' : 'No'}</p>
              <p><strong>Retryable:</strong> {errorInfo.retryable ? 'Yes' : 'No'}</p>
              {context && (
                <>
                  <p><strong>Action:</strong> {context.action}</p>
                  <p><strong>Step:</strong> {context.step}</p>
                </>
              )}
            </div>
          </div>

          {/* Recovery Action */}
          <div className="flex items-center justify-between">
            <div className="text-xs">
              <strong>Recommended Action:</strong> {recoveryAction}
            </div>
            
            {onRetry && errorInfo.retryable && (
              <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="px-3 py-1.5 bg-current text-white rounded text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {isRetrying ? (
                  <div className="flex items-center gap-1">
                    <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                    Retrying...
                  </div>
                ) : (
                  'Try Again'
                )}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Quick Retry Button (if not expanded) */}
      {!isExpanded && onRetry && errorInfo.retryable && (
        <div className="mt-3 pt-3 border-t border-current/20">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full px-3 py-2 bg-current text-white rounded text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {isRetrying ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b border-white"></div>
                Retrying...
              </div>
            ) : (
              'Try Again'
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// Compact error display for inline use
export function CompactErrorDisplay({ 
  error, 
  context, 
  onRetry, 
  onDismiss 
}: ErrorDisplayProps) {
  const errorInfo = parseError(error, context ? { ...context, timestamp: new Date().toISOString() } : undefined);
  const errorIcon = getErrorIcon(errorInfo.category);
  const errorColorStyles = getErrorColorStyles(errorInfo.severity);

  return (
    <div className={`flex items-center gap-2 p-2 rounded text-sm`} style={errorColorStyles}>
      <span>{errorIcon}</span>
      <span className="flex-1">{errorInfo.userMessage}</span>
      {onRetry && errorInfo.retryable && (
        <button
          onClick={onRetry}
          className="text-xs underline hover:no-underline"
        >
          Retry
        </button>
      )}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-xs underline hover:no-underline"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}

// Toast-style error notification
export function ErrorToast({ 
  error, 
  context, 
  onRetry, 
  onDismiss 
}: ErrorDisplayProps) {
  const errorInfo = parseError(error, context ? { ...context, timestamp: new Date().toISOString() } : undefined);
  const errorIcon = getErrorIcon(errorInfo.category);
  const errorColorStyles = getErrorColorStyles(errorInfo.severity);

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm rounded-lg border p-3 shadow-lg animate-in slide-in-from-right-2`} style={errorColorStyles}>
      <div className="flex items-start gap-2">
        <span className="text-lg">{errorIcon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{errorInfo.userMessage}</p>
          {errorInfo.suggestions.length > 0 && (
            <p className="text-xs mt-1 opacity-75">
              {errorInfo.suggestions[0]}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onRetry && errorInfo.retryable && (
            <button
              onClick={onRetry}
              className="text-xs underline hover:no-underline"
            >
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-xs underline hover:no-underline"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 
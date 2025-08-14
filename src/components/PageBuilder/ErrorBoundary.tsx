"use client";

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { 
  PageBuilderError, 
  ErrorRecoveryAction, 
  createPageBuilderError, 
  generateRecoveryActions,
  logPageBuilderError 
} from '@/lib/error-handling';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  component?: string;
  sectionId?: string;
  onRetry?: () => void | Promise<void>;
  onReset?: () => void | Promise<void>;
  onFallback?: () => void | Promise<void>;
}

interface State {
  hasError: boolean;
  error?: PageBuilderError;
  recoveryActions: ErrorRecoveryAction[];
}

export default class PageBuilderErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, recoveryActions: [] };
  }

  static getDerivedStateFromError(error: Error, props: Props): State {
    const pageBuilderError = createPageBuilderError(error, 'unknown', {
      component: props.component,
      sectionId: props.sectionId,
    });
    
    const recoveryActions = generateRecoveryActions(
      pageBuilderError,
      props.onRetry,
      props.onReset,
      props.onFallback
    );
    
    return { 
      hasError: true, 
      error: pageBuilderError,
      recoveryActions 
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const pageBuilderError = createPageBuilderError(error, 'unknown', {
      component: this.props.component,
      sectionId: this.props.sectionId,
    });
    
    logPageBuilderError(pageBuilderError, { errorInfo });
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {this.state.error.component ? `${this.state.error.component} Error` : 'Something went wrong'}
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{this.state.error.message}</p>
                {this.state.error.sectionId && (
                  <p className="mt-1 text-xs text-red-600">Section ID: {this.state.error.sectionId}</p>
                )}
              </div>
            </div>
          </div>
          
          {this.state.recoveryActions.length > 0 && (
            <div className="mt-4 space-y-2">
              {this.state.recoveryActions.map((action, index) => (
                <button
                  key={index}
                  onClick={async () => {
                    try {
                      await action.action();
                      if (action.type === 'retry' || action.type === 'reset') {
                        this.setState({ hasError: false, error: undefined, recoveryActions: [] });
                      }
                    } catch (error) {
                      console.error('Recovery action failed:', error);
                    }
                  }}
                  className={`w-full px-3 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    action.type === 'retry' || action.type === 'reset'
                      ? 'bg-red-100 text-red-800 hover:bg-red-200 focus:ring-red-500'
                      : action.type === 'fallback'
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 focus:ring-yellow-500'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-500'
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
          
          {this.state.recoveryActions.length === 0 && (
            <div className="mt-4">
              <button
                onClick={() => this.setState({ hasError: false, error: undefined, recoveryActions: [] })}
                className="bg-red-100 text-red-800 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
} 
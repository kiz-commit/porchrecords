"use client";

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Handle ChunkLoadError specifically
    if (error.name === 'ChunkLoadError' || error.message.includes('ChunkLoadError')) {
      console.log('ChunkLoadError detected, attempting to reload...');
      // Force a page reload to clear cache and reload chunks
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }

  render() {
    if (this.state.hasError) {
      // Check if it's a ChunkLoadError
      if (this.state.error?.name === 'ChunkLoadError' || this.state.error?.message.includes('ChunkLoadError')) {
        return (
          <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-mustard)' }}>
            <div className="text-center p-8">
              <h1 className="text-2xl font-mono mb-4" style={{ color: 'var(--color-black)' }}>Loading Error</h1>
              <p className="mb-4" style={{ color: 'var(--color-black)' }}>There was an issue loading the page. Reloading...</p>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: 'var(--color-black)' }}></div>
            </div>
          </div>
        );
      }

      // Default error fallback
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-mustard)' }}>
          <div className="text-center p-8">
            <h1 className="text-2xl font-mono mb-4" style={{ color: 'var(--color-black)' }}>Something went wrong</h1>
            <p className="mb-4" style={{ color: 'var(--color-black)' }}>Please refresh the page to try again.</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded font-mono transition-colors"
              style={{
                backgroundColor: 'var(--color-black)',
                color: 'var(--color-mustard)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgb(55, 65, 81)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-black)';
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 
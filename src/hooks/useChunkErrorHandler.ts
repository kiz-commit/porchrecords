"use client";

import { useEffect } from 'react';

export function useChunkErrorHandler() {
  useEffect(() => {
    const handleChunkError = (event: ErrorEvent) => {
      // Check if this is a ChunkLoadError
      if (event.error?.name === 'ChunkLoadError' || 
          event.message.includes('ChunkLoadError') ||
          event.filename?.includes('webpack')) {
        
        console.warn('ChunkLoadError detected:', event);
        
        // Prevent the default error handling
        event.preventDefault();
        
        // Show a user-friendly message
        const message = document.createElement('div');
        message.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #E1B84B;
          color: #181818;
          padding: 1rem;
          text-align: center;
          font-family: 'Space Mono', monospace;
          z-index: 10000;
          border-bottom: 2px solid #B86B3A;
        `;
        message.innerHTML = `
          <div>Loading error detected. Reloading page...</div>
          <div style="font-size: 0.8rem; margin-top: 0.5rem;">
            If this persists, please refresh your browser.
          </div>
        `;
        
        document.body.appendChild(message);
        
        // Reload the page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 2000);
        
        return false;
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      // Check if this is a chunk loading related rejection
      if (event.reason?.name === 'ChunkLoadError' || 
          event.reason?.message?.includes('ChunkLoadError')) {
        
        console.warn('ChunkLoadError in promise rejection:', event.reason);
        
        // Prevent the default error handling
        event.preventDefault();
        
        // Reload the page
        setTimeout(() => {
          window.location.reload();
        }, 1000);
        
        return false;
      }
    };

    // Add event listeners
    window.addEventListener('error', handleChunkError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Cleanup
    return () => {
      window.removeEventListener('error', handleChunkError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);
} 
"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface PageTransitionProps {
  children: React.ReactNode;
}

// Global state for transition
let isTransitioning = false;

// Event listeners for transition state
const transitionEvents = {
  start: (direction: 'left' | 'right' = 'left') => {
    isTransitioning = true;
    window.dispatchEvent(new CustomEvent('transitionStart', { detail: { direction } }));
  },
  end: () => {
    isTransitioning = false;
    window.dispatchEvent(new CustomEvent('transitionEnd'));
  }
};

export default function PageTransition({ children }: PageTransitionProps) {
  const [transitionState, setTransitionState] = useState({
    isTransitioning: false,
    direction: 'left' as 'left' | 'right'
  });
  const pathname = usePathname();

  useEffect(() => {
    const handleTransitionStart = (event: CustomEvent) => {
      setTransitionState({
        isTransitioning: true,
        direction: event.detail.direction
      });
    };

    const handleTransitionEnd = () => {
      setTransitionState({
        isTransitioning: false,
        direction: 'left'
      });
    };

    window.addEventListener('transitionStart', handleTransitionStart as EventListener);
    window.addEventListener('transitionEnd', handleTransitionEnd);

    return () => {
      window.removeEventListener('transitionStart', handleTransitionStart as EventListener);
      window.removeEventListener('transitionEnd', handleTransitionEnd);
    };
  }, []);

  // Reset transition state when pathname changes
  useEffect(() => {
    if (transitionState.isTransitioning) {
      const timer = setTimeout(() => {
        transitionEvents.end();
      }, 600); // Allow time for the new page to settle
      
      return () => clearTimeout(timer);
    }
  }, [pathname, transitionState.isTransitioning]);

  return (
    <div 
      className={`page-transition ${
        transitionState.isTransitioning 
          ? transitionState.direction === 'left' 
            ? 'sliding-left' 
            : 'sliding-right'
          : ''
      }`}
    >
      {children}
    </div>
  );
}

// Custom hook for navigation with transition
export const usePageTransition = () => {
  const router = useRouter();
  
  const navigateWithTransition = (href: string) => {
    // Start the transition
    transitionEvents.start('left');
    
    // Navigate after a short delay to allow the transition to start
    setTimeout(() => {
      router.push(href);
    }, 300);
  };
  
  return { navigateWithTransition };
}; 
"use client";

import { useEffect, useRef, useState } from 'react';

const CustomCursor = () => {
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    const cursor = cursorRef.current;
    if (!cursor) return;

    // Add class to body to hide default cursor
    document.body.classList.add('custom-cursor-page');

    let mouseX = 0, mouseY = 0;
    let raf: number;

    const moveCursor = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!raf) raf = requestAnimationFrame(updateCursor);
    };

    const updateCursor = () => {
      if (cursor) {
        cursor.style.transform = `translate3d(${mouseX - 16}px, ${mouseY - 16}px, 0)`;
      }
      raf = 0;
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.closest('[data-cursor="nav"]')) {
        cursor.classList.add('cursor-hover');
      } else {
        cursor.classList.remove('cursor-hover');
      }
    };

    document.addEventListener('mousemove', moveCursor);
    document.addEventListener('mouseover', handleMouseOver);

    // Hide on mobile
    const handleTouch = () => {
      if (cursor) cursor.style.display = 'none';
    };
    document.addEventListener('touchstart', handleTouch);

    return () => {
      // Remove class from body when component unmounts
      document.body.classList.remove('custom-cursor-page');
      
      document.removeEventListener('mousemove', moveCursor);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('touchstart', handleTouch);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isClient]);

  // Don't render the cursor on the server to prevent hydration mismatch
  if (!isClient) {
    return null;
  }

  return (
    <div
      ref={cursorRef}
      className="custom-cursor"
      style={{ pointerEvents: 'none' }}
      aria-hidden="true"
    />
  );
};

export default CustomCursor; 
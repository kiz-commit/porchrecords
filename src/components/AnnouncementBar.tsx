"use client";

import { useState, useEffect, useRef } from 'react';

interface AnnouncementBarProps {
  text: string;
  backgroundColor?: string;
  textColor?: string;
  speed?: number;
  isVisible?: boolean;
}

export default function AnnouncementBar({ 
  text, 
  backgroundColor = "#1f2937", 
  textColor = "#ffffff",
  speed = 20,
  isVisible = true 
}: AnnouncementBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(0);
  const [dimensions, setDimensions] = useState({ container: 0, text: 0 });

  // Measure widths on mount and when text changes
  useEffect(() => {
    const measure = () => {
      const containerWidth = containerRef.current?.offsetWidth || 0;
      const textWidth = textRef.current?.offsetWidth || 0;
      setDimensions({ container: containerWidth, text: textWidth });
      setPosition(containerWidth); // Start off right edge
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [text]);

  // Animate ticker
  useEffect(() => {
    if (!isVisible || dimensions.text === 0 || dimensions.container === 0) return;
    setPosition(dimensions.container); // Reset to right edge on show
    let frame: number;
    const step = () => {
      setPosition(prev => {
        if (prev <= -dimensions.text) {
          return dimensions.container;
        }
        return prev - 1;
      });
      frame = window.requestAnimationFrame(step);
    };
    frame = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(frame);
    // eslint-disable-next-line
  }, [isVisible, dimensions.text, dimensions.container]);

  if (!isVisible) return null;

  return (
    <div
      data-announcement-bar
      ref={containerRef}
      className="fixed top-0 left-0 right-0 z-[60] overflow-hidden flex items-center"
      style={{
        backgroundColor,
        height: '40px',
        fontFamily: 'var(--font-secondary)',
        fontSize: '14px',
        fontWeight: '500',
        letterSpacing: '0.025em'
      }}
    >
      <div
        ref={textRef}
        className="whitespace-nowrap"
        style={{
          color: textColor,
          transform: `translateX(${position}px)`,
          willChange: 'transform',
          transition: 'none',
        }}
      >
        {text}
      </div>
    </div>
  );
} 
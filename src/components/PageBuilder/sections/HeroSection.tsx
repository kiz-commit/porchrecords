"use client";

import React from 'react';
import { PageSection } from '@/lib/types';
import ImageFallback from '../ImageFallback';

interface HeroSectionProps {
  section: PageSection;
  isPreview: boolean;
}

export default function HeroSection({ section, isPreview }: HeroSectionProps) {
  const config = section.settings?.hero;
  
  // Get text alignment class
  const getTextAlignmentClass = () => {
    switch (config?.textAlignment) {
      case 'left':
        return 'text-left';
      case 'right':
        return 'text-right';
      case 'center':
      default:
        return 'text-center';
    }
  };
  
  return (
    <section 
      className={`relative flex items-center justify-center text-white overflow-hidden transition-theme ${
        config?.fullHeight ? 'h-screen' : 'min-h-[80vh]'
      }`}
      style={{ 
        backgroundColor: config?.overlayColor || 'var(--color-primary)'
      }}
    >
      {config?.backgroundImage && (
        <>
          <ImageFallback
            src={config.backgroundImage}
            alt={config.backgroundImageAlt || "Hero background"}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div 
            className="absolute inset-0"
            style={{ 
              backgroundColor: config.overlayColor || 'var(--color-primary)',
              opacity: config.overlayOpacity || 0.8
            }}
          />
        </>
      )}
      
      <div className={`relative z-10 px-4 max-w-6xl mx-auto ${getTextAlignmentClass()}`}>
        <div 
          className="font-serif text-scale-4 md:text-scale-5 font-bold tracking-tight mb-6 leading-tight"
          style={{ 
            color: config?.textColor || 'var(--color-offwhite)',
            textShadow: config?.textShadow ? '2px 2px 4px rgba(0,0,0,0.5)' : 'none'
          }}
          dangerouslySetInnerHTML={{ __html: section.content }}
        />
        
        {config?.buttonText && (
          <button 
            className={`px-8 py-4 rounded-theme font-mono font-semibold transition-theme hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              config.buttonStyle === 'primary' 
                ? 'bg-white text-black hover:bg-gray-100 focus:ring-white'
                : config.buttonStyle === 'secondary'
                ? 'bg-transparent border-2 border-white text-white hover:bg-white hover:text-black focus:ring-white'
                : 'bg-transparent border-2 border-white text-white hover:bg-white hover:text-black focus:ring-white'
            }`}
            style={{
              borderColor: config?.buttonBorderColor || 'var(--color-offwhite)',
              backgroundColor: config?.buttonStyle === 'primary' ? 'var(--color-offwhite)' : 'transparent',
              color: config?.buttonStyle === 'primary' ? 'var(--color-black)' : 'var(--color-offwhite)'
            }}
          >
            {config.buttonText}
          </button>
        )}
      </div>
      
      {config?.scrollIndicator && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div 
            className="w-6 h-10 border-2 rounded-full flex justify-center transition-theme"
            style={{ borderColor: config?.scrollIndicatorColor || 'var(--color-offwhite)' }}
          >
            <div 
              className="w-1 h-3 rounded-full mt-2 animate-pulse"
              style={{ backgroundColor: config?.scrollIndicatorColor || 'var(--color-offwhite)' }}
            />
          </div>
        </div>
      )}
    </section>
  );
} 
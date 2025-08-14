"use client";

import React from 'react';
import { PageSection } from '@/lib/types';

interface CtaSectionProps {
  section: PageSection;
  isPreview: boolean;
}

export default function CtaSection({ section, isPreview }: CtaSectionProps) {
  const config = section.settings?.cta;
  
  const getButtonStyle = () => {
    switch (config?.buttonStyle) {
      case 'primary':
        return 'bg-primary text-black hover:bg-primary/90 focus:ring-primary';
      case 'secondary':
        return 'bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-black focus:ring-primary';
      case 'outline':
        return 'bg-transparent border-2 border-white text-white hover:bg-white hover:text-black focus:ring-white';
      default:
        return 'bg-primary text-black hover:bg-primary/90 focus:ring-primary';
    }
  };

  const getLayoutClass = () => {
    switch (config?.layout) {
      case 'left':
        return 'text-left';
      case 'right':
        return 'text-right';
      case 'center':
      default:
        return 'text-center';
    }
  };

  const getMaxWidthClass = () => {
    switch (config?.maxWidth) {
      case 'sm':
        return 'max-w-sm';
      case 'md':
        return 'max-w-md';
      case 'lg':
        return 'max-w-lg';
      case 'xl':
        return 'max-w-xl';
      case '2xl':
        return 'max-w-2xl';
      case '3xl':
        return 'max-w-3xl';
      case '4xl':
        return 'max-w-4xl';
      case '5xl':
        return 'max-w-5xl';
      case '6xl':
        return 'max-w-6xl';
      case 'full':
        return 'max-w-full';
      default:
        return 'max-w-4xl';
    }
  };

  const getPaddingClass = () => {
    switch (config?.padding) {
      case 'small':
        return 'p-space-unit-2';
      case 'medium':
        return 'p-space-unit-3';
      case 'large':
        return 'p-space-unit-4';
      case 'xl':
        return 'py-20 px-space-unit-3';
      case '2xl':
        return 'py-24 px-space-unit-3';
      default:
        return 'p-space-unit-4';
    }
  };

  return (
    <section 
      className={`${getPaddingClass()} transition-theme`}
      style={{
        backgroundColor: config?.backgroundColor === 'primary' ? 'var(--color-primary)' :
          config?.backgroundColor === 'secondary' ? 'var(--color-secondary)' :
          config?.backgroundColor === 'background' ? 'var(--color-background)' :
          config?.backgroundColor === 'offwhite' ? 'var(--color-offwhite)' :
          config?.backgroundColor === 'black' ? 'var(--color-black)' :
          'var(--color-background)'
      }}
    >
      <div className={`mx-auto ${getMaxWidthClass()}`}>
        <div className={getLayoutClass()}>
          {/* Title */}
          <h2 
            className="font-serif text-scale-4 md:text-scale-5 font-bold mb-4 leading-tight"
            style={{ 
              color: config?.textColor === 'primary' ? 'var(--color-primary)' :
                config?.textColor === 'secondary' ? 'var(--color-secondary)' :
                config?.textColor === 'background' ? 'var(--color-background)' :
                config?.textColor === 'offwhite' ? 'var(--color-offwhite)' :
                config?.textColor === 'black' ? 'var(--color-black)' :
                'var(--color-foreground)'
            }}
          >
            {config?.ctaTitle || section.content || 'Ready to Get Started?'}
          </h2>

          {/* Description */}
          {config?.ctaDescription && (
            <p 
              className="font-sans text-scale-2 mb-8 leading-relaxed"
              style={{ 
                color: config?.textColor === 'primary' ? 'var(--color-primary)' :
                  config?.textColor === 'secondary' ? 'var(--color-secondary)' :
                  config?.textColor === 'background' ? 'var(--color-background)' :
                  config?.textColor === 'offwhite' ? 'var(--color-offwhite)' :
                  config?.textColor === 'black' ? 'var(--color-black)' :
                  'var(--color-foreground)'
              }}
            >
              {config.ctaDescription}
            </p>
          )}

          {/* Buttons */}
          <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
            {/* Primary Button */}
            {config?.buttonText && (
              <a
                href={config.buttonLink || '#'}
                className={`inline-flex items-center px-8 py-4 rounded-theme font-mono font-semibold transition-theme focus:outline-none focus:ring-2 focus:ring-offset-2 ${getButtonStyle()}`}
                style={{
                  backgroundColor: config?.buttonStyle === 'primary' ? 'var(--color-primary)' : 'transparent',
                  borderColor: config?.buttonStyle === 'secondary' ? 'var(--color-primary)' : 
                    config?.buttonStyle === 'outline' ? 'var(--color-offwhite)' : 'transparent',
                  color: config?.buttonStyle === 'primary' ? 'var(--color-black)' : 
                    config?.buttonStyle === 'secondary' ? 'var(--color-primary)' : 'var(--color-offwhite)'
                }}
              >
                {config.buttonText}
                {config?.buttonIcon && (
                  <span className="ml-2">
                    {config.buttonIcon}
                  </span>
                )}
              </a>
            )}

            {/* Secondary Button */}
            {config?.secondaryButtonText && (
              <a
                href={config.secondaryButtonLink || '#'}
                className="inline-flex items-center px-8 py-4 rounded-theme font-mono font-semibold border-2 border-current transition-theme hover:bg-current hover:text-background focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{
                  borderColor: config?.textColor === 'primary' ? 'var(--color-primary)' :
                    config?.textColor === 'secondary' ? 'var(--color-secondary)' :
                    config?.textColor === 'background' ? 'var(--color-background)' :
                    config?.textColor === 'offwhite' ? 'var(--color-offwhite)' :
                    config?.textColor === 'black' ? 'var(--color-black)' :
                    'var(--color-foreground)',
                  color: config?.textColor === 'primary' ? 'var(--color-primary)' :
                    config?.textColor === 'secondary' ? 'var(--color-secondary)' :
                    config?.textColor === 'background' ? 'var(--color-background)' :
                    config?.textColor === 'offwhite' ? 'var(--color-offwhite)' :
                    config?.textColor === 'black' ? 'var(--color-black)' :
                    'var(--color-foreground)'
                }}
              >
                {config.secondaryButtonText}
              </a>
            )}
          </div>

          {/* Additional Content */}
          {config?.additionalContent && (
            <div 
              className="mt-8 font-sans text-scale-1"
              style={{ 
                color: config?.textColor === 'primary' ? 'var(--color-primary)' :
                  config?.textColor === 'secondary' ? 'var(--color-secondary)' :
                  config?.textColor === 'background' ? 'var(--color-background)' :
                  config?.textColor === 'offwhite' ? 'var(--color-offwhite)' :
                  config?.textColor === 'black' ? 'var(--color-black)' :
                  'var(--color-foreground)'
              }}
              dangerouslySetInnerHTML={{ __html: config.additionalContent }}
            />
          )}
        </div>
      </div>
    </section>
  );
}

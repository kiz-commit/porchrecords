"use client";

import React from 'react';
import { PageSection } from '@/lib/types';

interface TextSectionProps {
  section: PageSection;
  isPreview: boolean;
}

export default function TextSection({ section, isPreview }: TextSectionProps) {
  const config = section.settings?.text;
  
  // Debug logging
  if (isPreview) {
    console.log('TextSection content:', section.content);
    console.log('TextSection config:', config);
  }
  
  const getTextSizeClass = () => {
    switch (config?.textSize) {
      case 'small': return 'text-scale-1';
      case 'medium': return 'text-scale-2';
      case 'large': return 'text-scale-3';
      case 'xl': return 'text-scale-4';
      case '2xl': return 'text-5xl';
      case '3xl': return 'text-6xl';
      case '4xl': return 'text-7xl';
      case '5xl': return 'text-8xl';
      case '6xl': return 'text-9xl';
      default: return 'text-scale-2';
    }
  };
  
  const getFontFamilyClass = () => {
    switch (config?.fontFamily) {
      case 'serif': return 'font-serif';
      case 'mono': return 'font-mono';
      case 'sans': return 'font-sans';
      default: return 'font-serif';
    }
  };
  
  const getFontWeightClass = () => {
    switch (config?.fontWeight) {
      case 'light': return 'font-light';
      case 'normal': return 'font-normal';
      case 'medium': return 'font-medium';
      case 'semibold': return 'font-semibold';
      case 'bold': return 'font-bold';
      case 'extrabold': return 'font-extrabold';
      default: return 'font-normal';
    }
  };
  
  const getLineHeightClass = () => {
    switch (config?.lineHeight) {
      case 'tight': return 'leading-tight';
      case 'normal': return 'leading-normal';
      case 'relaxed': return 'leading-relaxed';
      case 'loose': return 'leading-loose';
      default: return 'leading-normal';
    }
  };
  
  const getLetterSpacingClass = () => {
    switch (config?.letterSpacing) {
      case 'tight': return 'tracking-tight';
      case 'normal': return 'tracking-normal';
      case 'wide': return 'tracking-wide';
      case 'wider': return 'tracking-wider';
      default: return 'tracking-normal';
    }
  };
  
  const getPaddingClass = () => {
    switch (config?.padding) {
      case 'small': return 'p-space-unit-2';
      case 'medium': return 'p-space-unit-3';
      case 'large': return 'p-space-unit-4';
      case 'xl': return 'py-20 px-space-unit-3';
      case '2xl': return 'py-24 px-space-unit-3';
      default: return 'p-space-unit-3';
    }
  };

  const getContentAlignmentClass = () => {
    switch (config?.contentAlignment) {
      case 'left':
        return 'text-left';
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      case 'justify':
        return 'text-justify';
      default:
        return config?.textAlignment === 'center' ? 'text-center' :
               config?.textAlignment === 'right' ? 'text-right' : 'text-left';
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
      case '7xl':
        return 'max-w-7xl';
      case 'full':
        return 'max-w-full';
      default:
        return 'max-w-4xl';
    }
  };

  const getBorderClass = () => {
    if (!config?.showBorder) return '';
    
    switch (config.borderStyle) {
      case 'solid':
        return 'border border-gray-300';
      case 'dashed':
        return 'border-2 border-dashed border-gray-300';
      case 'dotted':
        return 'border-2 border-dotted border-gray-300';
      case 'double':
        return 'border-4 border-double border-gray-300';
      default:
        return 'border border-gray-300';
    }
  };

  const getLayoutClass = () => {
    if (config?.layout === '2-column') {
      const columnGap = config?.columnGap || 'medium';
      const gapClass = columnGap === 'small' ? 'gap-4' : 
                      columnGap === 'large' ? 'gap-12' : 'gap-8';
      
      return `grid lg:grid-cols-2 ${gapClass} items-${config?.columnAlignment || 'start'}`;
    }
    return '';
  };

  const getColumnOrder = () => {
    if (config?.layout === '2-column' && config?.columnOrder === 'reverse') {
      return 'order-first lg:order-last';
    }
    return '';
  };

  const getSecondColumnOrder = () => {
    if (config?.layout === '2-column' && config?.columnOrder === 'reverse') {
      return 'order-last lg:order-first';
    }
    return '';
  };
  
  return (
    <section 
      className={`${getPaddingClass()} transition-theme ${getBorderClass()}`}
      style={{
        backgroundColor: config?.backgroundColor === 'transparent' ? 'transparent' : 
          config?.backgroundColor === 'primary' ? 'var(--color-primary)' :
          config?.backgroundColor === 'secondary' ? 'var(--color-secondary)' :
          config?.backgroundColor === 'background' ? 'var(--color-background)' :
          config?.backgroundColor === 'offwhite' ? 'var(--color-offwhite)' :
          config?.backgroundColor === 'gray-50' ? '#f9fafb' :
          config?.backgroundColor === 'gray-100' ? '#f3f4f6' :
          config?.backgroundColor === 'gray-200' ? '#e5e7eb' :
          config?.backgroundColor === 'gray-300' ? '#d1d5db' :
          config?.backgroundColor === 'gray-400' ? '#9ca3af' :
          config?.backgroundColor === 'gray-500' ? '#6b7280' :
          config?.backgroundColor === 'gray-600' ? '#4b5563' :
          config?.backgroundColor === 'gray-700' ? '#374151' :
          config?.backgroundColor === 'gray-800' ? '#1f2937' :
          config?.backgroundColor === 'gray-900' ? '#111827' :
          config?.backgroundColor || 'transparent',
        borderColor: config?.borderColor === 'primary' ? 'var(--color-primary)' :
          config?.borderColor === 'secondary' ? 'var(--color-secondary)' :
          config?.borderColor === 'background' ? 'var(--color-background)' :
          config?.borderColor === 'offwhite' ? 'var(--color-offwhite)' :
          config?.borderColor || 'var(--color-primary)'
      }}
    >
      <div className={`mx-auto ${getMaxWidthClass()}`}>
        {/* Title - Always full width */}
        {config?.title && (
          <div className={getContentAlignmentClass()}>
            <h2 
              className="font-serif text-scale-4 font-bold mb-6"
              style={{ 
                color: config?.textColor === 'primary' ? 'var(--color-primary)' :
                  config?.textColor === 'secondary' ? 'var(--color-secondary)' :
                  config?.textColor === 'background' ? 'var(--color-background)' :
                  config?.textColor === 'offwhite' ? 'var(--color-offwhite)' :
                  config?.textColor === 'black' ? 'var(--color-black)' :
                  'var(--color-foreground)'
              }}
            >
              {config.title}
            </h2>
          </div>
        )}

        {/* Subtitle - Always full width */}
        {config?.subtitle && (
          <div className={getContentAlignmentClass()}>
            <h3 
              className="font-sans text-scale-2 font-medium mb-8"
              style={{ 
                color: config?.textColor === 'primary' ? 'var(--color-primary)' :
                  config?.textColor === 'secondary' ? 'var(--color-secondary)' :
                  config?.textColor === 'background' ? 'var(--color-background)' :
                  config?.textColor === 'offwhite' ? 'var(--color-offwhite)' :
                  config?.textColor === 'black' ? 'var(--color-black)' :
                  'var(--color-foreground)'
              }}
            >
              {config.subtitle}
            </h3>
          </div>
        )}

        {/* Main Content Area */}
        <div className={config?.layout === '2-column' ? getLayoutClass() : getContentAlignmentClass()}>
          {/* First Column / Main Content */}
          <div className={config?.layout === '2-column' ? getColumnOrder() : ''}>
            <div 
              className={`${getTextSizeClass()} ${getFontFamilyClass()} ${getFontWeightClass()} ${getLineHeightClass()} ${getLetterSpacingClass()} transition-theme`}
              style={{ 
                color: config?.textColor === 'primary' ? 'var(--color-primary)' :
                  config?.textColor === 'secondary' ? 'var(--color-secondary)' :
                  config?.textColor === 'background' ? 'var(--color-background)' :
                  config?.textColor === 'offwhite' ? 'var(--color-offwhite)' :
                  config?.textColor === 'black' ? 'var(--color-black)' :
                  config?.textColor || 'var(--color-foreground)'
              }}
              dangerouslySetInnerHTML={{ __html: section.content || 'Add your content here...' }}
            />
          </div>

          {/* Second Column */}
          {config?.layout === '2-column' && config?.secondColumnContent && (
            <div className={getSecondColumnOrder()}>
              <div 
                className={`${getTextSizeClass()} ${getFontFamilyClass()} ${getFontWeightClass()} ${getLineHeightClass()} ${getLetterSpacingClass()} transition-theme`}
                style={{ 
                  color: config?.textColor === 'primary' ? 'var(--color-primary)' :
                    config?.textColor === 'secondary' ? 'var(--color-secondary)' :
                    config?.textColor === 'background' ? 'var(--color-background)' :
                    config?.textColor === 'offwhite' ? 'var(--color-offwhite)' :
                    config?.textColor === 'black' ? 'var(--color-black)' :
                    config?.textColor || 'var(--color-foreground)'
                }}
                dangerouslySetInnerHTML={{ __html: config.secondColumnContent }}
              />
            </div>
          )}
        </div>

        {/* Additional Content - Always full width */}
        {config?.additionalContent && (
          <div className={`mt-8 ${getContentAlignmentClass()}`}>
            <div 
              className="font-sans text-scale-1 leading-relaxed"
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
          </div>
        )}

        {/* Call to Action - Always full width */}
        {config?.ctaText && config?.ctaLink && (
          <div className={`mt-8 ${getContentAlignmentClass()}`}>
            <a
              href={config.ctaLink}
              className={`inline-flex items-center px-8 py-4 font-mono font-semibold rounded-theme transition-theme focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                config?.ctaStyle === 'primary' 
                  ? 'bg-primary text-black hover:bg-primary/90 focus:ring-primary'
                  : 'border-2 border-current hover:bg-current hover:text-background'
              }`}
              style={{
                backgroundColor: config?.ctaStyle === 'primary' ? 'var(--color-primary)' : 'transparent',
                borderColor: config?.ctaStyle === 'primary' ? 'transparent' : 
                  config?.textColor === 'primary' ? 'var(--color-primary)' :
                  config?.textColor === 'secondary' ? 'var(--color-secondary)' :
                  config?.textColor === 'background' ? 'var(--color-background)' :
                  config?.textColor === 'offwhite' ? 'var(--color-offwhite)' :
                  config?.textColor === 'black' ? 'var(--color-black)' :
                  'var(--color-foreground)',
                color: config?.ctaStyle === 'primary' ? 'var(--color-black)' :
                  config?.textColor === 'primary' ? 'var(--color-primary)' :
                  config?.textColor === 'secondary' ? 'var(--color-secondary)' :
                  config?.textColor === 'background' ? 'var(--color-background)' :
                  config?.textColor === 'offwhite' ? 'var(--color-offwhite)' :
                  config?.textColor === 'black' ? 'var(--color-black)' :
                  'var(--color-foreground)'
              }}
            >
              {config.ctaText}
              {config?.ctaIcon && (
                <span className="ml-2">
                  {config.ctaIcon}
                </span>
              )}
            </a>
          </div>
        )}
      </div>
    </section>
  );
} 
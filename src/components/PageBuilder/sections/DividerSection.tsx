"use client";

import React from 'react';
import { PageSection } from '@/lib/types';

interface DividerSectionProps {
  section: PageSection;
  isPreview: boolean;
}

export default function DividerSection({ section, isPreview }: DividerSectionProps) {
  const config = section.settings?.divider;
  
  const getDividerStyle = () => {
    switch (config?.style) {
      case 'line':
        return 'border-t';
      case 'dashed':
        return 'border-t border-dashed';
      case 'dotted':
        return 'border-t border-dotted';
      case 'double':
        return 'border-t-4 border-double';
      case 'gradient':
        return 'bg-gradient-to-r from-transparent via-current to-transparent h-px';
      case 'wave':
        return 'h-8 bg-wave-pattern';
      case 'dots':
        return 'flex justify-center space-x-2';
      case 'chevron':
        return 'flex justify-center';
      default:
        return 'border-t';
    }
  };

  const getThicknessClass = () => {
    switch (config?.thickness) {
      case 'thin':
        return 'border-t';
      case 'medium':
        return 'border-t-2';
      case 'thick':
        return 'border-t-4';
      case 'extra-thick':
        return 'border-t-8';
      default:
        return 'border-t';
    }
  };

  const getSpacingClass = () => {
    switch (config?.spacing) {
      case 'small':
        return 'py-4';
      case 'medium':
        return 'py-8';
      case 'large':
        return 'py-12';
      case 'xl':
        return 'py-16';
      case '2xl':
        return 'py-20';
      default:
        return 'py-8';
    }
  };

  const getWidthClass = () => {
    switch (config?.width) {
      case 'sm':
        return 'w-16';
      case 'md':
        return 'w-32';
      case 'lg':
        return 'w-48';
      case 'xl':
        return 'w-64';
      case '2xl':
        return 'w-80';
      case 'full':
        return 'w-full';
      default:
        return 'w-full';
    }
  };

  const getAlignmentClass = () => {
    switch (config?.alignment) {
      case 'left':
        return 'justify-start';
      case 'center':
        return 'justify-center';
      case 'right':
        return 'justify-end';
      default:
        return 'justify-center';
    }
  };

  const renderDivider = () => {
    const baseClasses = `${getDividerStyle()} ${getThicknessClass()} transition-theme`;
    
    switch (config?.style) {
      case 'dots':
        return (
          <div className={`${baseClasses} ${getAlignmentClass()}`}>
            <div className="w-2 h-2 rounded-full bg-current mx-1" />
            <div className="w-2 h-2 rounded-full bg-current mx-1" />
            <div className="w-2 h-2 rounded-full bg-current mx-1" />
          </div>
        );
      
      case 'chevron':
        return (
          <div className={`${baseClasses} ${getAlignmentClass()}`}>
            <svg 
              className="w-6 h-6" 
              fill="currentColor" 
              viewBox="0 0 20 20"
              style={{ color: config?.color || 'var(--color-primary)' }}
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        );
      
      case 'wave':
        return (
          <div 
            className={`${baseClasses} ${getWidthClass()}`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 28'%3E%3Cpath d='M112,3c3.2,3.2,3.8,8.3,3,13c-0.8,4.7-2.1,9.5-5.7,13.1c-3.6,3.6-8.8,5.7-14.4,5.9c-5.6,0.3-11.6-0.4-16.6-2.1 C82.5,31.6,79,29,76.2,25.2C73.4,21.4,71.4,16.6,71,11.4c-0.4-5.2,0.4-10.1,2.7-14.7c2.3-4.6,6.1-8.4,10.4-11.4 c4.3-3,9.1-5.2,14.4-6.6c5.3-1.4,11.1-2,16.4-1.8C119.7-22.5,112,3,112,3z' fill='currentColor'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'contain',
              color: config?.color || 'var(--color-primary)'
            }}
          />
        );
      
      case 'gradient':
        return (
          <div 
            className={`${baseClasses} ${getWidthClass()}`}
            style={{
              background: config?.gradientColors ? 
                `linear-gradient(to right, ${config.gradientColors.join(', ')})` :
                'linear-gradient(to right, transparent, var(--color-primary), transparent)',
              color: config?.color || 'var(--color-primary)'
            }}
          />
        );
      
      default:
        return (
          <div 
            className={`${baseClasses} ${getWidthClass()}`}
            style={{
              borderColor: config?.color === 'primary' ? 'var(--color-primary)' :
                config?.color === 'secondary' ? 'var(--color-secondary)' :
                config?.color === 'background' ? 'var(--color-background)' :
                config?.color === 'offwhite' ? 'var(--color-offwhite)' :
                config?.color === 'black' ? 'var(--color-black)' :
                config?.color || 'var(--color-primary)'
            }}
          />
        );
    }
  };

  return (
    <section 
      className={`${getSpacingClass()} transition-theme`}
      style={{
        backgroundColor: config?.backgroundColor === 'primary' ? 'var(--color-primary)' :
          config?.backgroundColor === 'secondary' ? 'var(--color-secondary)' :
          config?.backgroundColor === 'background' ? 'var(--color-background)' :
          config?.backgroundColor === 'offwhite' ? 'var(--color-offwhite)' :
          'transparent'
      }}
    >
      <div className="max-w-6xl mx-auto px-4">
        <div className={`flex ${getAlignmentClass()}`}>
          {renderDivider()}
        </div>
        
        {/* Optional text content */}
        {section.content && (
          <div className="text-center mt-4">
            <span 
              className="font-sans text-scale-1 font-medium"
              style={{ 
                color: config?.textColor === 'primary' ? 'var(--color-primary)' :
                  config?.textColor === 'secondary' ? 'var(--color-secondary)' :
                  config?.textColor === 'background' ? 'var(--color-background)' :
                  config?.textColor === 'offwhite' ? 'var(--color-offwhite)' :
                  config?.textColor === 'black' ? 'var(--color-black)' :
                  'var(--color-foreground)'
              }}
            >
              {section.content}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}

"use client";

import React from 'react';
import { PageSection } from '@/lib/types';
import ImageFallback from '../ImageFallback';

interface StorySectionProps {
  section: PageSection;
  isPreview: boolean;
}

export default function StorySection({ section, isPreview }: StorySectionProps) {
  const config = section.settings?.story;
  
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
        return 'max-w-6xl';
    }
  };

  const getLayoutClass = () => {
    switch (config?.layout) {
      case 'text-image':
        return 'grid lg:grid-cols-2 gap-12 items-center';
      case 'image-text':
        return 'grid lg:grid-cols-2 gap-12 items-center';
      case 'text-only':
        return 'max-w-4xl mx-auto';
      case 'image-only':
        return 'max-w-4xl mx-auto';
      case 'centered':
        return 'text-center max-w-4xl mx-auto';
      default:
        return 'grid lg:grid-cols-2 gap-12 items-center';
    }
  };

  const getImagePosition = () => {
    if (config?.layout === 'image-text') {
      return 'order-first lg:order-last';
    }
    return '';
  };

  const getTextPosition = () => {
    if (config?.layout === 'image-text') {
      return 'order-last lg:order-first';
    }
    return '';
  };

  const getImageSize = () => {
    switch (config?.imageSize) {
      case 'small':
        return 'max-w-sm';
      case 'medium':
        return 'max-w-md';
      case 'large':
        return 'max-w-lg';
      case 'xl':
        return 'max-w-xl';
      case '2xl':
        return 'max-w-2xl';
      case 'full':
        return 'w-full';
      default:
        return 'w-full';
    }
  };

  const getImageStyle = () => {
    switch (config?.imageStyle) {
      case 'rounded':
        return 'rounded-theme';
      case 'rounded-lg':
        return 'rounded-theme-lg';
      case 'rounded-xl':
        return 'rounded-theme-xl';
      case 'circle':
        return 'rounded-full';
      case 'none':
        return 'rounded-none';
      default:
        return 'rounded-theme';
    }
  };

  const renderImage = () => {
    if (!config?.storyImage) {
      return (
        <div className={`${getImageSize()} aspect-video bg-gray-200 rounded-theme flex items-center justify-center`}>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="font-sans text-gray-500">No image provided</p>
          </div>
        </div>
      );
    }

    return (
      <div className={`${getImagePosition()} ${getImageSize()}`}>
        <ImageFallback
          src={config.storyImage}
          alt={config.storyTitle || 'Story image'}
          width={600}
          height={400}
          className={`w-full h-auto ${getImageStyle()} shadow-lg transition-theme hover:shadow-xl`}
        />
      </div>
    );
  };

  const renderContent = () => (
    <div className={`${getTextPosition()} space-y-6`}>
      {/* Title */}
      {config?.storyTitle && (
        <h2 
          className="font-serif text-scale-4 font-bold leading-tight"
          style={{ 
            color: config?.textColor === 'primary' ? 'var(--color-primary)' :
              config?.textColor === 'secondary' ? 'var(--color-secondary)' :
              config?.textColor === 'background' ? 'var(--color-background)' :
              config?.textColor === 'offwhite' ? 'var(--color-offwhite)' :
              config?.textColor === 'black' ? 'var(--color-black)' :
              'var(--color-foreground)'
          }}
        >
          {config.storyTitle}
        </h2>
      )}

      {/* Divider */}
      {config?.showDivider && (
        <div 
          className={`w-16 h-1 ${
            config?.dividerStyle === 'primary' ? 'bg-primary' :
            config?.dividerStyle === 'secondary' ? 'bg-secondary' :
            'bg-gray-300'
          }`}
          style={{
            backgroundColor: config?.dividerStyle === 'primary' ? 'var(--color-primary)' :
              config?.dividerStyle === 'secondary' ? 'var(--color-secondary)' :
              'var(--color-primary)'
          }}
        />
      )}

      {/* Story Content */}
      <div 
        className="font-sans text-scale-1 leading-relaxed prose prose-lg max-w-none"
        style={{ 
          color: config?.textColor === 'primary' ? 'var(--color-primary)' :
            config?.textColor === 'secondary' ? 'var(--color-secondary)' :
            config?.textColor === 'background' ? 'var(--color-background)' :
            config?.textColor === 'offwhite' ? 'var(--color-offwhite)' :
            config?.textColor === 'black' ? 'var(--color-black)' :
            'var(--color-foreground)'
        }}
        dangerouslySetInnerHTML={{ __html: config?.storyContent || section.content }}
      />

      {/* Call to Action */}
      {config?.ctaText && config?.ctaLink && (
        <div className="pt-4">
          <a
            href={config.ctaLink}
            className={`inline-flex items-center px-6 py-3 font-mono font-semibold rounded-theme transition-theme focus:outline-none focus:ring-2 focus:ring-offset-2 ${
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
  );

  return (
    <section 
      className={`${getPaddingClass()} transition-theme`}
      style={{
        backgroundColor: config?.backgroundColor === 'primary' ? 'var(--color-primary)' :
          config?.backgroundColor === 'secondary' ? 'var(--color-secondary)' :
          config?.backgroundColor === 'background' ? 'var(--color-background)' :
          config?.backgroundColor === 'offwhite' ? 'var(--color-offwhite)' :
          'var(--color-background)'
      }}
    >
      <div className={`mx-auto ${getMaxWidthClass()}`}>
        <div className={getLayoutClass()}>
          {/* Image */}
          {(config?.layout !== 'text-only') && renderImage()}
          
          {/* Content */}
          {(config?.layout !== 'image-only') && renderContent()}
        </div>

        {/* Additional Content */}
        {config?.additionalContent && (
          <div 
            className="mt-12 font-sans text-scale-1 leading-relaxed"
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
    </section>
  );
}

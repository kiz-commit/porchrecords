"use client";

import React from 'react';
import { PageSection } from '@/lib/types';
import ImageFallback from '../ImageFallback';

interface ImageSectionProps {
  section: PageSection;
  isPreview: boolean;
}

export default function ImageSection({ section, isPreview }: ImageSectionProps) {
  const config = section.settings?.image;
  
  const getImageSize = () => {
    switch (config?.imageSize) {
      case 'small': return { width: 384, height: 288 }; // max-w-sm
      case 'medium': return { width: 448, height: 336 }; // max-w-md
      case 'large': return { width: 512, height: 384 }; // max-w-lg
      case 'full': return { width: 1200, height: 600 }; // full width
      default: return { width: 448, height: 336 }; // max-w-md
    }
  };
  
  const getBorderStyles = () => {
    const borderWidth = config?.borderWidth || 'none';
    const borderStyle = config?.borderStyle || 'solid';
    const borderColor = config?.borderColor || '#000000';
    
    if (borderWidth === 'none') return '';
    
    const widthMap = {
      'thin': '1px',
      'medium': '2px',
      'thick': '3px'
    };
    
    return `${widthMap[borderWidth as keyof typeof widthMap] || '2px'} ${borderStyle} ${borderColor}`;
  };
  
  const getCaptionStyles = () => {
    const fontSize = config?.captionFontSize || 'small';
    const color = config?.captionColor || '#000000';
    
    const sizeMap = {
      'xs': 'text-xs',
      'small': 'text-sm',
      'medium': 'text-base',
      'large': 'text-lg'
    };
    
    return {
      className: sizeMap[fontSize as keyof typeof sizeMap] || 'text-sm',
      style: { color }
    };
  };
  
  const { width, height } = getImageSize();
  const borderStyles = getBorderStyles();
  const captionStyles = getCaptionStyles();
  
  return (
    <section className="py-12 px-4 md:px-8 bg-white">
      <div className="max-w-4xl mx-auto">
        <div 
          className={`${
            config?.imageAlignment === 'center' ? 'text-center' :
            config?.imageAlignment === 'right' ? 'text-right' :
            'text-left'
          }`}
        >
          {/* Caption Above */}
          {config?.caption && config?.captionPosition === 'above' && (
            <p 
              className={`mb-2 ${captionStyles.className}`}
              style={captionStyles.style}
            >
              {config.caption}
            </p>
          )}
          
          <div className={`inline-block ${
            config?.imageSize === 'small' ? 'max-w-sm' :
            config?.imageSize === 'medium' ? 'max-w-md' :
            config?.imageSize === 'large' ? 'max-w-lg' :
            config?.imageSize === 'full' ? 'w-full' :
            'max-w-md'
          } ${
            config?.borderRadius === 'none' ? 'rounded-none' :
            config?.borderRadius === 'small' ? 'rounded' :
            config?.borderRadius === 'medium' ? 'rounded-lg' :
            config?.borderRadius === 'large' ? 'rounded-xl' :
            config?.borderRadius === 'full' ? 'rounded-full' :
            'rounded-lg'
          } ${
            config?.shadow === 'none' ? '' :
            config?.shadow === 'small' ? 'shadow-sm' :
            config?.shadow === 'medium' ? 'shadow-md' :
            config?.shadow === 'large' ? 'shadow-lg' :
            'shadow-md'
          } overflow-hidden relative`}
          style={{ border: borderStyles }}
          >
            <ImageFallback
              src={config?.imageUrl || '/placeholder-image.jpg'}
              alt={config?.altText || 'Image'}
              width={width}
              height={height}
              className="w-full h-auto"
            />
            
            {/* Caption Overlay */}
            {config?.caption && config?.captionPosition === 'overlay' && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2">
                <p className={captionStyles.className}>
                  {config.caption}
                </p>
              </div>
            )}
          </div>
          
          {/* Caption Below */}
          {config?.caption && config?.captionPosition !== 'above' && config?.captionPosition !== 'overlay' && (
            <p 
              className={`mt-2 ${captionStyles.className}`}
              style={captionStyles.style}
            >
              {config.caption}
            </p>
          )}
        </div>
      </div>
    </section>
  );
} 
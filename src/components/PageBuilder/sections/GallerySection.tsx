"use client";

import React, { useState } from 'react';
import { PageSection } from '@/lib/types';
import ImageFallback from '../ImageFallback';

interface GallerySectionProps {
  section: PageSection;
  isPreview: boolean;
}

interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  title?: string;
  description?: string;
  category?: string;
}

export default function GallerySection({ section, isPreview }: GallerySectionProps) {
  const config = section.settings?.gallery;
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  
  // Default gallery images if none provided
  const defaultImages: GalleryImage[] = [
    {
      id: '1',
      src: '/placeholder-gallery-1.jpg',
      alt: 'Vinyl collection showcase',
      title: 'Vinyl Collection',
      description: 'Our carefully curated selection of vinyl records',
      category: 'Vinyl'
    },
    {
      id: '2',
      src: '/placeholder-gallery-2.jpg',
      alt: 'Studio equipment',
      title: 'Studio Equipment',
      description: 'Professional recording and mixing equipment',
      category: 'Studio'
    },
    {
      id: '3',
      src: '/placeholder-gallery-3.jpg',
      alt: 'Live performance setup',
      title: 'Live Performance',
      description: 'Stage setup for live music events',
      category: 'Live'
    },
    {
      id: '4',
      src: '/placeholder-gallery-4.jpg',
      alt: 'Music instruments',
      title: 'Instruments',
      description: 'Quality instruments for sale and rental',
      category: 'Instruments'
    },
    {
      id: '5',
      src: '/placeholder-gallery-5.jpg',
      alt: 'Customer browsing records',
      title: 'Customer Experience',
      description: 'Customers enjoying our vinyl collection',
      category: 'Experience'
    },
    {
      id: '6',
      src: '/placeholder-gallery-6.jpg',
      alt: 'Record store interior',
      title: 'Store Interior',
      description: 'The warm, inviting atmosphere of our store',
      category: 'Store'
    }
  ];

  const images = config?.images?.length > 0 ? config.images : defaultImages;

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

  const getLayoutClass = () => {
    switch (config?.layout) {
      case 'grid':
        return `grid gap-4 ${
          config?.columns === 1 ? 'grid-cols-1' :
          config?.columns === 2 ? 'grid-cols-1 md:grid-cols-2' :
          config?.columns === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
          config?.columns === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' :
          config?.columns === 5 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5' :
          config?.columns === 6 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-6' :
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`;
      case 'masonry':
        return 'columns-1 md:columns-2 lg:columns-3 gap-4';
      case 'carousel':
        return 'flex overflow-x-auto space-x-4 pb-4';
      case 'featured':
        return 'grid gap-4 grid-cols-1 lg:grid-cols-2';
      default:
        return 'grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    }
  };

  const getImageSize = () => {
    switch (config?.imageSize) {
      case 'small':
        return 'h-32';
      case 'medium':
        return 'h-48';
      case 'large':
        return 'h-64';
      case 'xl':
        return 'h-80';
      case '2xl':
        return 'h-96';
      default:
        return 'h-48';
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

  const getOverlayStyle = () => {
    switch (config?.overlayStyle) {
      case 'dark':
        return 'bg-black bg-opacity-50';
      case 'light':
        return 'bg-white bg-opacity-90';
      case 'gradient':
        return 'bg-gradient-to-t from-black via-transparent to-transparent';
      case 'none':
        return '';
      default:
        return 'bg-black bg-opacity-50';
    }
  };

  const renderImage = (image: GalleryImage, index: number) => (
    <div 
      key={image.id}
      className={`relative overflow-hidden transition-theme hover:scale-105 ${
        config?.layout === 'masonry' ? 'break-inside-avoid mb-4' : ''
      }`}
    >
      <div className={`${getImageSize()} ${getImageStyle()} overflow-hidden`}>
        <ImageFallback
          src={image.src}
          alt={image.alt}
          width={400}
          height={300}
          className="w-full h-full object-cover transition-theme hover:scale-110"
        />
        
        {/* Overlay */}
        {(config?.showOverlay !== false) && (
          <div className={`absolute inset-0 ${getOverlayStyle()} opacity-0 hover:opacity-100 transition-theme flex items-end`}>
            <div className="p-4 w-full">
              {image.title && (
                <h3 
                  className="font-serif text-scale-2 font-bold mb-1"
                  style={{ 
                    color: config?.overlayTextColor === 'white' ? 'white' :
                      config?.overlayTextColor === 'black' ? 'black' :
                      'white'
                  }}
                >
                  {image.title}
                </h3>
              )}
              {image.description && (
                <p 
                  className="font-sans text-scale-1"
                  style={{ 
                    color: config?.overlayTextColor === 'white' ? 'rgba(255,255,255,0.9)' :
                      config?.overlayTextColor === 'black' ? 'rgba(0,0,0,0.8)' :
                      'rgba(255,255,255,0.9)'
                  }}
                >
                  {image.description}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Click to view */}
      {config?.clickToView && (
        <button
          onClick={() => setSelectedImage(image)}
          className="absolute inset-0 w-full h-full focus:outline-none"
          aria-label={`View ${image.title || image.alt}`}
        />
      )}
    </div>
  );

  const renderLightbox = () => {
    if (!selectedImage) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
        <div className="relative max-w-4xl max-h-full">
          {/* Close button */}
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-theme z-10"
            aria-label="Close lightbox"
          >
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Image */}
          <ImageFallback
            src={selectedImage.src}
            alt={selectedImage.alt}
            width={800}
            height={600}
            className="w-full h-auto max-h-[80vh] object-contain"
          />

          {/* Image info */}
          {(selectedImage.title || selectedImage.description) && (
            <div className="mt-4 text-center text-white">
              {selectedImage.title && (
                <h3 className="font-serif text-scale-3 font-bold mb-2">
                  {selectedImage.title}
                </h3>
              )}
              {selectedImage.description && (
                <p className="font-sans text-scale-1 opacity-90">
                  {selectedImage.description}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Filter images by category if specified
  const filteredImages = config?.categoryFilter 
    ? images.filter((image: GalleryImage) => image.category === config.categoryFilter)
    : images;

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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 
            className="font-serif text-scale-4 font-bold mb-4"
            style={{ 
              color: config?.textColor === 'primary' ? 'var(--color-primary)' :
                config?.textColor === 'secondary' ? 'var(--color-secondary)' :
                config?.textColor === 'background' ? 'var(--color-background)' :
                config?.textColor === 'offwhite' ? 'var(--color-offwhite)' :
                config?.textColor === 'black' ? 'var(--color-black)' :
                'var(--color-foreground)'
            }}
          >
            {config?.title || section.content || 'Gallery'}
          </h2>
          
          {config?.description && (
            <p 
              className="font-sans text-scale-2 text-gray-600 max-w-2xl mx-auto"
              style={{ 
                color: config?.textColor === 'primary' ? 'var(--color-primary)' :
                  config?.textColor === 'secondary' ? 'var(--color-secondary)' :
                  config?.textColor === 'background' ? 'var(--color-background)' :
                  config?.textColor === 'offwhite' ? 'var(--color-offwhite)' :
                  config?.textColor === 'black' ? 'var(--color-black)' :
                  'var(--color-foreground)'
              }}
            >
              {config.description}
            </p>
          )}
        </div>

        {/* Gallery Grid */}
        <div className={getLayoutClass()}>
          {filteredImages.map(renderImage)}
        </div>

        {/* View All Button */}
        {config?.showViewAllButton && (
          <div className="text-center mt-12">
            <a
              href={config.viewAllLink || '/gallery'}
              className="inline-flex items-center px-8 py-4 bg-primary text-black font-mono font-semibold rounded-theme hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-theme"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-black)'
              }}
            >
              {config.viewAllButtonText || 'View All Images'}
              <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        )}

        {/* Lightbox */}
        {renderLightbox()}
      </div>
    </section>
  );
} 
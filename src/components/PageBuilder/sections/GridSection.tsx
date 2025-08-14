"use client";

import React from 'react';
import { PageSection } from '@/lib/types';
import ImageFallback from '../ImageFallback';

interface GridSectionProps {
  section: PageSection;
  isPreview: boolean;
}

interface GridItem {
  id: string;
  title: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  link?: string;
  linkText?: string;
  category?: string;
  featured?: boolean;
  price?: string;
  rating?: number;
  tags?: string[];
  icon?: string;
  color?: string;
}

export default function GridSection({ section, isPreview }: GridSectionProps) {
  const config = section.settings?.grid;
  
  // Default grid items if none provided
  const defaultItems: GridItem[] = [
    {
      id: '1',
      title: 'Local Music Store',
      description: 'Your trusted source for instruments and equipment.',
      image: '/placeholder-logo.png',
      imageAlt: 'Local Music Store logo',
      link: 'https://localmusicstore.com',
      linkText: 'Visit Website',
      category: 'Equipment',
      featured: true,
      tags: ['Instruments', 'Equipment']
    },
    {
      id: '2',
      title: 'Recording Studio',
      description: 'Professional recording and mixing services.',
      image: '/placeholder-logo.png',
      imageAlt: 'Recording Studio logo',
      link: 'https://recordingstudio.com',
      linkText: 'Book Session',
      category: 'Services',
      featured: true,
      price: '$50/hour',
      rating: 5,
      tags: ['Recording', 'Mixing']
    },
    {
      id: '3',
      title: 'Music Venue',
      description: 'Premier live music venue in the heart of the city.',
      image: '/placeholder-logo.png',
      imageAlt: 'Music Venue logo',
      link: 'https://musicvenue.com',
      linkText: 'View Events',
      category: 'Venues',
      featured: false,
      tags: ['Live Music', 'Events']
    },
    {
      id: '4',
      title: 'Sound Equipment',
      description: 'Professional sound and lighting equipment rentals.',
      image: '/placeholder-logo.png',
      imageAlt: 'Sound Equipment logo',
      link: 'https://soundequipment.com',
      linkText: 'Rent Now',
      category: 'Equipment',
      featured: false,
      price: 'From $100/day',
      tags: ['Sound', 'Lighting']
    }
  ];

  const items = config?.items?.length > 0 ? config.items : defaultItems;

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
        return `grid gap-6 ${
          config?.columns === 1 ? 'grid-cols-1' :
          config?.columns === 2 ? 'grid-cols-1 md:grid-cols-2' :
          config?.columns === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
          config?.columns === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' :
          config?.columns === 5 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5' :
          config?.columns === 6 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-6' :
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`;
      case 'list':
        return 'space-y-6';
      case 'carousel':
        return 'flex overflow-x-auto space-x-6 pb-4';
      case 'masonry':
        return 'columns-1 md:columns-2 lg:columns-3 gap-6';
      default:
        return 'grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    }
  };

  const getImageSize = () => {
    switch (config?.imageSize) {
      case 'small':
        return 'w-16 h-16';
      case 'medium':
        return 'w-24 h-24';
      case 'large':
        return 'w-32 h-32';
      case 'xl':
        return 'w-40 h-40';
      default:
        return 'w-24 h-24';
    }
  };

  const renderItem = (item: GridItem) => (
    <div 
      key={item.id}
      className={`bg-white rounded-theme shadow-sm border border-gray-100 overflow-hidden transition-theme hover:shadow-md hover:scale-105 ${
        item.featured ? 'ring-2 ring-primary' : ''
      }`}
      style={{
        backgroundColor: config?.cardBackgroundColor === 'primary' ? 'var(--color-primary)' :
          config?.cardBackgroundColor === 'secondary' ? 'var(--color-secondary)' :
          config?.cardBackgroundColor === 'background' ? 'var(--color-background)' :
          config?.cardBackgroundColor === 'offwhite' ? 'var(--color-offwhite)' :
          'var(--color-offwhite)',
        borderColor: item.featured ? 'var(--color-primary)' : undefined
      }}
    >
      {/* Image */}
      {config?.showImages && item.image && (
        <div className="relative">
          <div className="aspect-video overflow-hidden">
            <ImageFallback
              src={item.image}
              alt={item.imageAlt || `${item.title} image`}
              width={400}
              height={225}
              className="w-full h-full object-cover transition-theme hover:scale-110"
            />
          </div>
          
          {/* Featured Badge Overlay */}
          {item.featured && (
            <div className="absolute top-3 left-3">
              <span 
                className="inline-block px-2 py-1 text-xs font-mono font-semibold rounded-theme"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-black)'
                }}
              >
                {config?.featuredLabel || 'Featured'}
              </span>
            </div>
          )}
          
          {/* Price Overlay */}
          {item.price && (
            <div className="absolute top-3 right-3">
              <span className="inline-block px-2 py-1 text-xs font-sans font-semibold bg-black bg-opacity-75 text-white rounded-theme">
                {item.price}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Featured Badge (if no image) */}
        {item.featured && !config?.showImages && (
          <div className="mb-3">
            <span 
              className="inline-block px-2 py-1 text-xs font-mono font-semibold rounded-theme"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-black)'
              }}
            >
              {config?.featuredLabel || 'Featured'}
            </span>
          </div>
        )}

        {/* Category */}
        {item.category && (
          <div className="mb-2">
            <span className="inline-block px-2 py-1 text-xs font-sans text-gray-600 bg-gray-100 rounded-theme">
              {item.category}
            </span>
          </div>
        )}

        {/* Title */}
        <h3 
          className="font-serif text-scale-2 font-bold mb-2"
          style={{ 
            color: config?.textColor === 'primary' ? 'var(--color-primary)' :
              config?.textColor === 'secondary' ? 'var(--color-secondary)' :
              config?.textColor === 'background' ? 'var(--color-background)' :
              config?.textColor === 'offwhite' ? 'var(--color-offwhite)' :
              config?.textColor === 'black' ? 'var(--color-black)' :
              'var(--color-foreground)'
          }}
        >
          {item.title}
        </h3>

        {/* Description */}
        {item.description && (
          <p 
            className="font-sans text-scale-1 text-gray-600 mb-4 leading-relaxed"
            style={{ 
              color: config?.textColor === 'primary' ? 'var(--color-primary)' :
                config?.textColor === 'secondary' ? 'var(--color-secondary)' :
                config?.textColor === 'background' ? 'var(--color-background)' :
                config?.textColor === 'offwhite' ? 'var(--color-offwhite)' :
                config?.textColor === 'black' ? 'var(--color-black)' :
                'var(--color-foreground)'
            }}
          >
            {item.description}
          </p>
        )}

        {/* Rating */}
        {item.rating && config?.showRatings && (
          <div className="flex items-center mb-3">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className={`w-4 h-4 ${i < item.rating! ? 'text-yellow-400' : 'text-gray-300'}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="ml-2 text-sm text-gray-600">({item.rating}/5)</span>
          </div>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && config?.showTags && (
          <div className="flex flex-wrap gap-1 mb-4">
            {item.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-block px-2 py-1 text-xs font-sans text-gray-600 bg-gray-100 rounded-theme"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Link */}
        {item.link && (
          <a
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center font-sans text-scale-1 font-medium hover:underline transition-theme"
            style={{
              color: 'var(--color-primary)'
            }}
          >
            {item.linkText || 'Learn More'}
            <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );

  // Filter items by category if specified
  const filteredItems = config?.categoryFilter 
    ? items.filter((item: GridItem) => item.category === config.categoryFilter)
    : items;

  // Sort items (featured first, then alphabetically)
  const sortedItems = filteredItems.sort((a: GridItem, b: GridItem) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return a.title.localeCompare(b.title);
  });

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
            {config?.title || section.content || 'Grid Section'}
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

        {/* Grid Items */}
        <div className={getLayoutClass()}>
          {sortedItems.map(renderItem)}
        </div>

        {/* Call to Action Button */}
        {config?.showCtaButton && (
          <div className="text-center mt-12">
            <a
              href={config.ctaLink || '/contact'}
              className="inline-flex items-center px-8 py-4 bg-primary text-black font-mono font-semibold rounded-theme hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-theme"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-black)'
              }}
            >
              {config.ctaButtonText || 'Get Started'}
              <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        )}

        {/* View All Button */}
        {config?.showViewAllButton && (
          <div className="text-center mt-6">
            <a
              href={config.viewAllLink || '/grid'}
              className="inline-flex items-center font-sans text-scale-1 font-medium hover:underline transition-theme"
              style={{
                color: 'var(--color-primary)'
              }}
            >
              {config.viewAllButtonText || 'View All Items'}
              <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

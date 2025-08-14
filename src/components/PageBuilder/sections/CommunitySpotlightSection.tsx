"use client";

import React from 'react';
import { PageSection } from '@/lib/types';
import ImageFallback from '../ImageFallback';

interface CommunitySpotlightSectionProps {
  section: PageSection;
  isPreview: boolean;
}

interface SpotlightItem {
  id: string;
  title: string;
  description: string;
  image?: string;
  link?: string;
  category?: string;
  date?: string;
}

export default function CommunitySpotlightSection({ section, isPreview }: CommunitySpotlightSectionProps) {
  const config = section.settings?.communitySpotlight;
  
  // Default spotlight items if none provided
  const defaultSpotlightItems: SpotlightItem[] = [
    {
      id: '1',
      title: 'Local Band Spotlight',
      description: 'Discovering amazing local talent and supporting the music community.',
      image: '/placeholder-spotlight.jpg',
      link: '/spotlight/local-band',
      category: 'Music',
      date: '2024-01-15'
    },
    {
      id: '2',
      title: 'Community Event',
      description: 'Join us for our monthly community gathering and music showcase.',
      image: '/placeholder-spotlight.jpg',
      link: '/events/community-gathering',
      category: 'Events',
      date: '2024-01-20'
    },
    {
      id: '3',
      title: 'Artist Interview',
      description: 'Exclusive interview with a rising star in the local music scene.',
      image: '/placeholder-spotlight.jpg',
      link: '/interviews/rising-star',
      category: 'Interviews',
      date: '2024-01-25'
    }
  ];

  const spotlightItems = config?.spotlightItems?.length > 0 ? config.spotlightItems : defaultSpotlightItems;

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

  const renderSpotlightItem = (item: SpotlightItem) => (
    <div 
      key={item.id}
      className="bg-white rounded-theme shadow-sm border border-gray-100 overflow-hidden transition-theme hover:shadow-md hover:scale-105"
      style={{
        backgroundColor: config?.cardBackgroundColor === 'primary' ? 'var(--color-primary)' :
          config?.cardBackgroundColor === 'secondary' ? 'var(--color-secondary)' :
          config?.cardBackgroundColor === 'background' ? 'var(--color-background)' :
          config?.cardBackgroundColor === 'offwhite' ? 'var(--color-offwhite)' :
          'var(--color-offwhite)'
      }}
    >
      {/* Image */}
      {item.image && (
        <div className="aspect-video bg-gray-200">
          <ImageFallback
            src={item.image}
            alt={item.title}
            width={400}
            height={225}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Category */}
        {item.category && (
          <div className="mb-2">
            <span 
              className="inline-block px-2 py-1 text-xs font-mono font-semibold rounded-theme"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-black)'
              }}
            >
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

        {/* Date */}
        {item.date && (
          <p className="font-sans text-sm text-gray-500 mb-4">
            {new Date(item.date).toLocaleDateString()}
          </p>
        )}

        {/* Link */}
        {item.link && (
          <a
            href={item.link}
            className="inline-flex items-center font-sans text-scale-1 font-medium hover:underline transition-theme"
            style={{
              color: 'var(--color-primary)'
            }}
          >
            Read More
            <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </a>
        )}
      </div>
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
            {config?.title || section.content || 'Community Spotlight'}
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

        {/* Spotlight Items */}
        <div className={getLayoutClass()}>
          {spotlightItems.map(renderSpotlightItem)}
        </div>

        {/* View All Button */}
        {config?.showViewAllButton && (
          <div className="text-center mt-12">
            <a
              href={config.viewAllLink || '/community'}
              className="inline-flex items-center px-8 py-4 bg-primary text-black font-mono font-semibold rounded-theme hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-theme"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-black)'
              }}
            >
              {config.viewAllButtonText || 'View All Community Content'}
              <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

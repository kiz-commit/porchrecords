"use client";

import React from 'react';
import { PageSection } from '@/lib/types';
import ImageFallback from '../ImageFallback';

interface TestimonialsSectionProps {
  section: PageSection;
  isPreview: boolean;
}

interface Testimonial {
  id: string;
  name: string;
  role?: string;
  company?: string;
  content: string;
  rating: number;
  avatar?: string;
  avatarAltText?: string;
  date?: string;
}

export default function TestimonialsSection({ section, isPreview }: TestimonialsSectionProps) {
  const config = section.settings?.testimonials;
  
  // Default testimonials if none provided
  const defaultTestimonials: Testimonial[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      role: 'Music Producer',
      company: 'Studio Records',
      content: 'Porch Records has been instrumental in our music production journey. Their expertise and passion for quality sound is unmatched.',
      rating: 5,
      avatar: '/placeholder-avatar.jpg',
      date: '2024-01-15'
    },
    {
      id: '2',
      name: 'Mike Chen',
      role: 'Band Leader',
      company: 'The Echoes',
      content: 'The team at Porch Records truly understands the local music scene. They\'ve helped us grow our audience and improve our sound.',
      rating: 5,
      avatar: '/placeholder-avatar.jpg',
      date: '2024-01-10'
    },
    {
      id: '3',
      name: 'Emma Davis',
      role: 'Solo Artist',
      company: 'Independent',
      content: 'Working with Porch Records has been a game-changer for my music career. Their support and guidance are invaluable.',
      rating: 5,
      avatar: '/placeholder-avatar.jpg',
      date: '2024-01-05'
    }
  ];

  const testimonials = config?.testimonials?.length > 0 ? config.testimonials : defaultTestimonials;

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
      case 'carousel':
        return 'flex overflow-x-auto space-x-6 pb-4';
      case 'list':
        return 'space-y-6';
      default:
        return 'grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
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

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400' : 'text-gray-300'
        }`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  const renderTestimonial = (testimonial: Testimonial) => (
    <div 
      key={testimonial.id}
      className="bg-white rounded-theme p-6 shadow-sm border border-gray-100 transition-theme hover:shadow-md"
      style={{
        backgroundColor: config?.cardBackgroundColor === 'primary' ? 'var(--color-primary)' :
          config?.cardBackgroundColor === 'secondary' ? 'var(--color-secondary)' :
          config?.cardBackgroundColor === 'background' ? 'var(--color-background)' :
          config?.cardBackgroundColor === 'offwhite' ? 'var(--color-offwhite)' :
          'var(--color-offwhite)'
      }}
    >
      {/* Rating */}
      {config?.showRatings && (
        <div className="flex items-center mb-4">
          {renderStars(testimonial.rating)}
          <span className="ml-2 text-sm text-gray-600">
            {testimonial.rating}/5
          </span>
        </div>
      )}

      {/* Content */}
      <blockquote className="mb-4">
        <p 
          className="font-sans text-scale-1 leading-relaxed italic"
          style={{ 
            color: config?.textColor === 'primary' ? 'var(--color-primary)' :
              config?.textColor === 'secondary' ? 'var(--color-secondary)' :
              config?.textColor === 'background' ? 'var(--color-background)' :
              config?.textColor === 'offwhite' ? 'var(--color-offwhite)' :
              config?.textColor === 'black' ? 'var(--color-black)' :
              'var(--color-foreground)'
          }}
        >
          "{testimonial.content}"
        </p>
      </blockquote>

      {/* Author Info */}
      <div className="flex items-center">
        {config?.showAvatars && testimonial.avatar && (
          <div className="flex-shrink-0 mr-3">
            <ImageFallback
              src={testimonial.avatar}
              alt={testimonial.avatarAltText || `${testimonial.name} profile picture`}
              width={48}
              height={48}
              className="w-12 h-12 rounded-full object-cover"
            />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <p 
            className="font-sans font-semibold text-scale-1 truncate"
            style={{ 
              color: config?.textColor === 'primary' ? 'var(--color-primary)' :
                config?.textColor === 'secondary' ? 'var(--color-secondary)' :
                config?.textColor === 'background' ? 'var(--color-background)' :
                config?.textColor === 'offwhite' ? 'var(--color-offwhite)' :
                config?.textColor === 'black' ? 'var(--color-black)' :
                'var(--color-foreground)'
            }}
          >
            {testimonial.name}
          </p>
          {(testimonial.role || testimonial.company) && (
            <p className="font-sans text-sm text-gray-600 truncate">
              {testimonial.role}
              {testimonial.role && testimonial.company && ' at '}
              {testimonial.company}
            </p>
          )}
          {config?.showDates && testimonial.date && (
            <p className="font-sans text-xs text-gray-500 mt-1">
              {new Date(testimonial.date).toLocaleDateString()}
            </p>
          )}
        </div>
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
            style={{ color: 'var(--color-foreground)' }}
          >
            {section.content || 'What Our Customers Say'}
          </h2>
          {config?.description && (
            <p 
              className="font-sans text-scale-2 text-gray-600 max-w-2xl mx-auto"
              style={{ color: 'var(--color-foreground)' }}
            >
              {config.description}
            </p>
          )}
        </div>

        {/* Testimonials Grid */}
        <div className={getLayoutClass()}>
          {testimonials.map(renderTestimonial)}
        </div>

        {/* View All Button */}
        {config?.showViewAllButton && (
          <div className="text-center mt-8">
            <button 
              className="px-8 py-4 bg-primary text-black font-mono font-semibold rounded-theme hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-theme"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-black)'
              }}
            >
              {config.viewAllButtonText || 'View All Testimonials'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

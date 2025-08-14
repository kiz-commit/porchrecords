"use client";

import React from 'react';
import { PageSection } from '@/lib/types';
import ImageFallback from '../ImageFallback';

interface StudioOverviewSectionProps {
  section: PageSection;
  isPreview: boolean;
}

interface Equipment {
  id: string;
  name: string;
  description?: string;
  category: string;
  image?: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  price?: string;
  duration?: string;
  icon?: string;
}

export default function StudioOverviewSection({ section, isPreview }: StudioOverviewSectionProps) {
  const config = section.settings?.studioOverview;
  
  // Default equipment if none provided
  const defaultEquipment: Equipment[] = [
    {
      id: '1',
      name: 'Pro Tools HD',
      description: 'Professional digital audio workstation',
      category: 'Software',
      image: '/placeholder-equipment.jpg'
    },
    {
      id: '2',
      name: 'Neumann U87',
      description: 'Classic large-diaphragm condenser microphone',
      category: 'Microphones',
      image: '/placeholder-equipment.jpg'
    },
    {
      id: '3',
      name: 'Universal Audio LA-2A',
      description: 'Vintage optical compressor',
      category: 'Outboard',
      image: '/placeholder-equipment.jpg'
    },
    {
      id: '4',
      name: 'Yamaha NS10',
      description: 'Industry standard studio monitors',
      category: 'Monitoring',
      image: '/placeholder-equipment.jpg'
    },
    {
      id: '5',
      name: 'Fender Rhodes',
      description: 'Vintage electric piano',
      category: 'Instruments',
      image: '/placeholder-equipment.jpg'
    },
    {
      id: '6',
      name: 'Roland TR-808',
      description: 'Classic drum machine',
      category: 'Drum Machines',
      image: '/placeholder-equipment.jpg'
    }
  ];

  // Default services if none provided
  const defaultServices: Service[] = [
    {
      id: '1',
      name: 'Recording Session',
      description: 'Professional recording with experienced engineer',
      price: '$75/hour',
      duration: '2-8 hours',
      icon: '🎙️'
    },
    {
      id: '2',
      name: 'Mixing & Mastering',
      description: 'Complete post-production services',
      price: '$150/track',
      duration: '1-3 days',
      icon: '🎛️'
    },
    {
      id: '3',
      name: 'Voice Over',
      description: 'Professional voice recording for commercials, podcasts, and more',
      price: '$50/hour',
      duration: '1-4 hours',
      icon: '🎤'
    },
    {
      id: '4',
      name: 'Band Rehearsal',
      description: 'Rehearsal space with full backline',
      price: '$25/hour',
      duration: '2-6 hours',
      icon: '🎸'
    }
  ];

  const equipment = config?.equipment?.length > 0 ? config.equipment : defaultEquipment;
  const services = config?.services?.length > 0 ? config.services : defaultServices;
  const testimonials = config?.testimonials || [];

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
      case 'side-by-side':
        return 'grid lg:grid-cols-2 gap-12 items-start';
      case 'stacked':
        return 'space-y-12';
      case 'compact':
        return 'max-w-4xl mx-auto';
      default:
        return 'grid lg:grid-cols-2 gap-12 items-start';
    }
  };

  const getTextSize = () => {
    switch (config?.textSize) {
      case 'small':
        return 'text-scale-1';
      case 'medium':
        return 'text-scale-2';
      case 'large':
        return 'text-scale-3';
      case 'xl':
        return 'text-scale-4';
      default:
        return 'text-scale-2';
    }
  };

  const renderEquipment = () => (
    <div className="space-y-6">
      <h3 
        className="font-serif text-scale-3 font-bold mb-6"
        style={{ 
          color: config?.textColor === 'primary' ? 'var(--color-primary)' :
            config?.textColor === 'secondary' ? 'var(--color-secondary)' :
            config?.textColor === 'background' ? 'var(--color-background)' :
            config?.textColor === 'offwhite' ? 'var(--color-offwhite)' :
            config?.textColor === 'black' ? 'var(--color-black)' :
            'var(--color-foreground)'
        }}
      >
        {config?.equipmentTitle || 'Studio Equipment'}
      </h3>
      
      <div className="grid gap-4">
        {equipment.map((item: Equipment) => (
          <div 
            key={item.id}
            className="bg-white rounded-theme p-4 shadow-sm border border-gray-100 transition-theme hover:shadow-md"
            style={{
              backgroundColor: config?.cardBackgroundColor === 'primary' ? 'var(--color-primary)' :
                config?.cardBackgroundColor === 'secondary' ? 'var(--color-secondary)' :
                config?.cardBackgroundColor === 'background' ? 'var(--color-background)' :
                config?.cardBackgroundColor === 'offwhite' ? 'var(--color-offwhite)' :
                'var(--color-offwhite)'
            }}
          >
            <div className="flex items-start space-x-4">
              {item.image && (
                <div className="flex-shrink-0">
                  <ImageFallback
                    src={item.image}
                    alt={item.name}
                    width={60}
                    height={60}
                    className="w-15 h-15 rounded-theme object-cover"
                  />
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 
                    className="font-serif font-semibold text-scale-1"
                    style={{ 
                      color: config?.textColor === 'primary' ? 'var(--color-primary)' :
                        config?.textColor === 'secondary' ? 'var(--color-secondary)' :
                        config?.textColor === 'background' ? 'var(--color-background)' :
                        config?.textColor === 'offwhite' ? 'var(--color-offwhite)' :
                        config?.textColor === 'black' ? 'var(--color-black)' :
                        'var(--color-foreground)'
                    }}
                  >
                    {item.name}
                  </h4>
                  <span className="inline-block px-2 py-1 text-xs font-mono font-semibold rounded-theme bg-gray-100 text-gray-600">
                    {item.category}
                  </span>
                </div>
                
                {item.description && (
                  <p 
                    className="font-sans text-scale-1 text-gray-600"
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
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderServices = () => (
    <div className="space-y-6">
      <h3 
        className="font-serif text-scale-3 font-bold mb-6"
        style={{ 
          color: config?.textColor === 'primary' ? 'var(--color-primary)' :
            config?.textColor === 'secondary' ? 'var(--color-secondary)' :
            config?.textColor === 'background' ? 'var(--color-background)' :
            config?.textColor === 'offwhite' ? 'var(--color-offwhite)' :
            config?.textColor === 'black' ? 'var(--color-black)' :
            'var(--color-foreground)'
        }}
      >
        {config?.servicesTitle || 'Studio Services'}
      </h3>
      
      <div className="grid gap-4">
        {services.map((service: Service) => (
          <div 
            key={service.id}
            className="bg-white rounded-theme p-6 shadow-sm border border-gray-100 transition-theme hover:shadow-md"
            style={{
              backgroundColor: config?.cardBackgroundColor === 'primary' ? 'var(--color-primary)' :
                config?.cardBackgroundColor === 'secondary' ? 'var(--color-secondary)' :
                config?.cardBackgroundColor === 'background' ? 'var(--color-background)' :
                config?.cardBackgroundColor === 'offwhite' ? 'var(--color-offwhite)' :
                'var(--color-offwhite)'
            }}
          >
            <div className="flex items-start space-x-4">
              {service.icon && (
                <div className="flex-shrink-0 text-2xl">
                  {service.icon}
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 
                    className="font-serif font-semibold text-scale-1"
                    style={{ 
                      color: config?.textColor === 'primary' ? 'var(--color-primary)' :
                        config?.textColor === 'secondary' ? 'var(--color-secondary)' :
                        config?.textColor === 'background' ? 'var(--color-background)' :
                        config?.textColor === 'offwhite' ? 'var(--color-offwhite)' :
                        config?.textColor === 'black' ? 'var(--color-black)' :
                        'var(--color-foreground)'
                    }}
                  >
                    {service.name}
                  </h4>
                  {service.price && (
                    <span 
                      className="font-mono font-semibold text-scale-1"
                      style={{
                        color: 'var(--color-primary)'
                      }}
                    >
                      {service.price}
                    </span>
                  )}
                </div>
                
                <p 
                  className="font-sans text-scale-1 text-gray-600 mb-2"
                  style={{ 
                    color: config?.textColor === 'primary' ? 'var(--color-primary)' :
                      config?.textColor === 'secondary' ? 'var(--color-secondary)' :
                      config?.textColor === 'background' ? 'var(--color-background)' :
                      config?.textColor === 'offwhite' ? 'var(--color-offwhite)' :
                      config?.textColor === 'black' ? 'var(--color-black)' :
                      'var(--color-foreground)'
                  }}
                >
                  {service.description}
                </p>
                
                {service.duration && (
                  <p className="font-sans text-sm text-gray-500">
                    Duration: {service.duration}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTestimonials = () => (
    <div className="space-y-6">
      <h3 
        className="font-serif text-scale-3 font-bold mb-6"
        style={{ 
          color: config?.textColor === 'primary' ? 'var(--color-primary)' :
            config?.textColor === 'secondary' ? 'var(--color-secondary)' :
            config?.textColor === 'background' ? 'var(--color-background)' :
            config?.textColor === 'offwhite' ? 'var(--color-offwhite)' :
            config?.textColor === 'black' ? 'var(--color-black)' :
            'var(--color-foreground)'
        }}
      >
        {config?.testimonialsTitle || 'Client Testimonials'}
      </h3>
      
      <div className="grid gap-4">
        {testimonials.map((testimonial: any) => (
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 
                    className="font-serif font-semibold text-scale-1"
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
                  </h4>
                  {testimonial.role && (
                    <p className="font-sans text-sm text-gray-500">
                      {testimonial.role}
                    </p>
                  )}
                </div>
                {testimonial.rating && (
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className={`w-4 h-4 ${
                          i < testimonial.rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                )}
              </div>
              
              <p 
                className="font-sans text-scale-1 text-gray-600 italic"
                style={{ 
                  color: config?.textColor === 'primary' ? 'var(--color-primary)' :
                    config?.textColor === 'secondary' ? 'var(--color-secondary)' :
                    config?.textColor === 'background' ? 'var(--color-background)' :
                    config?.textColor === 'offwhite' ? 'var(--color-offwhite)' :
                    config?.textColor === 'black' ? 'var(--color-black)' :
                    'var(--color-foreground)'
                }}
              >
                "{testimonial.text}"
              </p>
            </div>
          </div>
        ))}
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
            {config?.title || section.content || 'Studio Overview'}
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

        {/* Content */}
        <div className={getLayoutClass()}>
          {/* Equipment */}
          {config?.showEquipment !== false && renderEquipment()}
          
          {/* Services */}
          {config?.showServices !== false && renderServices()}
        </div>

        {/* Testimonials - Full Width */}
        {config?.showTestimonials !== false && testimonials.length > 0 && (
          <div className="mt-12">
            {renderTestimonials()}
          </div>
        )}

        {/* Studio Image */}
        {config?.studioImage && (
          <div className="mt-12">
            <ImageFallback
              src={config.studioImage}
              alt="Studio overview"
              width={1200}
              height={600}
              className="w-full h-64 md:h-96 object-cover rounded-theme"
            />
          </div>
        )}

        {/* Call to Action */}
        {config?.showBookingButton && (
          <div className="text-center mt-12">
            <a
              href={config.bookingLink || '/studio/booking'}
              className="inline-flex items-center px-8 py-4 bg-primary text-black font-mono font-semibold rounded-theme hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-theme"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-black)'
              }}
            >
              {config.bookingButtonText || 'Book Studio Time'}
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
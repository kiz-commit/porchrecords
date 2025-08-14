"use client";

import React from 'react';
import { PageSection } from '@/lib/types';

interface HoursLocationSectionProps {
  section: PageSection;
  isPreview: boolean;
}

interface BusinessHours {
  day: string;
  open: string;
  close: string;
  closed?: boolean;
}

export default function HoursLocationSection({ section, isPreview }: HoursLocationSectionProps) {
  const config = section.settings?.hoursLocation;
  
  // Default business hours if none provided
  const defaultHours: BusinessHours[] = [
    { day: 'Monday', open: '9:00 AM', close: '6:00 PM' },
    { day: 'Tuesday', open: '9:00 AM', close: '6:00 PM' },
    { day: 'Wednesday', open: '9:00 AM', close: '6:00 PM' },
    { day: 'Thursday', open: '9:00 AM', close: '6:00 PM' },
    { day: 'Friday', open: '9:00 AM', close: '6:00 PM' },
    { day: 'Saturday', open: '10:00 AM', close: '4:00 PM' },
    { day: 'Sunday', open: '', close: '', closed: true }
  ];

  const hours = config?.hours?.length > 0 ? config.hours : defaultHours;

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
        return 'max-w-2xl mx-auto';
      default:
        return 'grid lg:grid-cols-2 gap-12 items-start';
    }
  };

  const getMapEmbedUrl = () => {
    // If a custom map URL is provided, convert it to embed format
    if (config?.mapUrl) {
      // Extract coordinates from the map URL if possible
      const coordMatch = config.mapUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (coordMatch) {
        const [, lat, lng] = coordMatch;
        return `https://maps.google.com/maps?q=${lat},${lng}&hl=en&z=15&output=embed`;
      }
      // Fallback to address-based embed
      const encodedAddress = encodeURIComponent(config.address || '');
      return `https://maps.google.com/maps?q=${encodedAddress}&hl=en&z=15&output=embed`;
    }
    
    // Use address for embed
    if (!config?.address) return undefined;
    const encodedAddress = encodeURIComponent(config.address);
    return `https://maps.google.com/maps?q=${encodedAddress}&hl=en&z=15&output=embed`;
  };

  const getGoogleMapsUrl = () => {
    // If a custom map URL is provided, use it
    if (config?.mapUrl) {
      return config.mapUrl;
    }
    // Otherwise, generate from address
    if (!config?.address) return undefined;
    const encodedAddress = encodeURIComponent(config.address);
    return `https://www.google.com/maps?q=${encodedAddress}`;
  };

  const renderHours = () => (
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
        {config?.hoursTitle || 'Business Hours'}
      </h3>
      
      <div className="space-y-3">
        {hours.map((hour: BusinessHours, index: number) => (
          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
            <span 
              className="font-sans font-medium"
              style={{ 
                color: config?.textColor === 'primary' ? 'var(--color-primary)' :
                  config?.textColor === 'secondary' ? 'var(--color-secondary)' :
                  config?.textColor === 'background' ? 'var(--color-background)' :
                  config?.textColor === 'offwhite' ? 'var(--color-offwhite)' :
                  config?.textColor === 'black' ? 'var(--color-black)' :
                  'var(--color-foreground)'
              }}
            >
              {hour.day}
            </span>
            <span 
              className="font-sans"
              style={{ 
                color: config?.textColor === 'primary' ? 'var(--color-primary)' :
                  config?.textColor === 'secondary' ? 'var(--color-secondary)' :
                  config?.textColor === 'background' ? 'var(--color-background)' :
                  config?.textColor === 'offwhite' ? 'var(--color-offwhite)' :
                  config?.textColor === 'black' ? 'var(--color-black)' :
                  'var(--color-foreground)'
              }}
            >
              {hour.closed ? (
                <span className="text-red-600 font-medium">Closed</span>
              ) : (
                `${hour.open} - ${hour.close}`
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Special Hours Notice */}
      {config?.specialHoursNotice && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-theme">
          <p className="font-sans text-sm text-yellow-800">
            {config.specialHoursNotice}
          </p>
        </div>
      )}
    </div>
  );

  const renderLocation = () => (
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
        {config?.locationTitle || 'Visit Us'}
      </h3>

      <div className="space-y-4">
        {/* Address */}
        {config?.address && (
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 text-primary mt-1 flex-shrink-0">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-sans font-semibold text-scale-1 mb-1">Address</p>
              <p 
                className="font-sans text-scale-1"
                style={{ 
                  color: config?.textColor === 'primary' ? 'var(--color-primary)' :
                    config?.textColor === 'secondary' ? 'var(--color-secondary)' :
                    config?.textColor === 'background' ? 'var(--color-background)' :
                    config?.textColor === 'offwhite' ? 'var(--color-offwhite)' :
                    config?.textColor === 'black' ? 'var(--color-black)' :
                    'var(--color-foreground)'
                }}
              >
                {config.address}
              </p>
            </div>
          </div>
        )}

        {/* Phone */}
        {config?.phone && (
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 text-primary mt-1 flex-shrink-0">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
            </div>
            <div>
              <p className="font-sans font-semibold text-scale-1 mb-1">Phone</p>
              <a 
                href={`tel:${config.phone}`}
                className="font-sans text-scale-1 hover:underline transition-theme"
                style={{
                  color: 'var(--color-primary)'
                }}
              >
                {config.phone}
              </a>
            </div>
          </div>
        )}

        {/* Email */}
        {config?.email && (
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 text-primary mt-1 flex-shrink-0">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
            <div>
              <p className="font-sans font-semibold text-scale-1 mb-1">Email</p>
              <a 
                href={`mailto:${config.email}`}
                className="font-sans text-scale-1 hover:underline transition-theme"
                style={{
                  color: 'var(--color-primary)'
                }}
              >
                {config.email}
              </a>
            </div>
          </div>
        )}

        {/* Parking Info */}
        {config?.parkingInfo && (
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 text-primary mt-1 flex-shrink-0">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-sans font-semibold text-scale-1 mb-1">Parking</p>
              <p 
                className="font-sans text-scale-1"
                style={{ 
                  color: config?.textColor === 'primary' ? 'var(--color-primary)' :
                    config?.textColor === 'secondary' ? 'var(--color-secondary)' :
                    config?.textColor === 'background' ? 'var(--color-background)' :
                    config?.textColor === 'offwhite' ? 'var(--color-offwhite)' :
                    config?.textColor === 'black' ? 'var(--color-black)' :
                    'var(--color-foreground)'
                }}
              >
                {config.parkingInfo}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 pt-4">
        {config?.showDirectionsButton && getGoogleMapsUrl() && (
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(config.address || '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 bg-primary text-black font-mono font-semibold rounded-theme hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-theme"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-black)'
            }}
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Get Directions
          </a>
        )}

        {config?.showMapButton && getGoogleMapsUrl() && (
          <a
            href={getGoogleMapsUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 border-2 border-current font-mono font-semibold rounded-theme hover:bg-current hover:text-background focus:outline-none focus:ring-2 focus:ring-offset-2 transition-theme"
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
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            View on Map
          </a>
        )}
      </div>
    </div>
  );

  const renderMap = () => {
    if (!config?.mapEmbed || !config?.address) return null;

    return (
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
          {config?.mapTitle || 'Find Us'}
        </h3>
        
        <div className="aspect-video rounded-theme overflow-hidden">
          <iframe
            src={getMapEmbedUrl()}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Location map"
          />
        </div>
      </div>
    );
  };

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
            {config?.title || section.content || 'Hours & Location'}
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
          {/* Hours */}
          {config?.showHours !== false && renderHours()}
          
          {/* Location */}
          {config?.showLocation !== false && renderLocation()}
        </div>

        {/* Map */}
        {renderMap()}
      </div>
    </section>
  );
}

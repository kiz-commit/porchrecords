"use client";

import React, { useState, useEffect } from 'react';
import { PageSection } from '@/lib/types';
import ImageFallback from '../ImageFallback';

interface ShowsSectionProps {
  section: PageSection;
  isPreview: boolean;
}

interface Show {
  id: string;
  title: string;
  artist: string;
  description?: string;
  date: string;
  time: string;
  venue: string;
  address?: string;
  image?: string;
  ticketLink?: string;
  price?: string;
  status: 'upcoming' | 'sold-out' | 'cancelled';
  genre?: string;
}

export default function ShowsSection({ section, isPreview }: ShowsSectionProps) {
  const config = section.settings?.shows;
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);

  // Default shows if no API integration
  const defaultShows: Show[] = [
    {
      id: '1',
      title: 'Local Band Night',
      artist: 'Various Artists',
      description: 'An evening showcasing the best local talent in the area.',
      date: '2024-02-15',
      time: '8:00 PM',
      venue: 'Porch Records Studio',
      address: '123 Music Street, City, State',
      image: '/placeholder-show.jpg',
      ticketLink: 'https://tickets.example.com/show1',
      price: '$15',
      status: 'upcoming',
      genre: 'Rock'
    },
    {
      id: '2',
      title: 'Jazz Ensemble',
      artist: 'The Jazz Collective',
      description: 'Smooth jazz and classic standards performed live.',
      date: '2024-02-22',
      time: '7:30 PM',
      venue: 'Porch Records Studio',
      address: '123 Music Street, City, State',
      image: '/placeholder-show.jpg',
      ticketLink: 'https://tickets.example.com/show2',
      price: '$25',
      status: 'upcoming',
      genre: 'Jazz'
    },
    {
      id: '3',
      title: 'Acoustic Night',
      artist: 'Sarah Johnson & Friends',
      description: 'Intimate acoustic performances in our cozy studio space.',
      date: '2024-02-28',
      time: '8:00 PM',
      venue: 'Porch Records Studio',
      address: '123 Music Street, City, State',
      image: '/placeholder-show.jpg',
      ticketLink: 'https://tickets.example.com/show3',
      price: '$20',
      status: 'sold-out',
      genre: 'Folk'
    },
    {
      id: '4',
      title: 'Electronic Music Showcase',
      artist: 'Digital Dreams',
      description: 'Electronic music and DJ performances with amazing visuals.',
      date: '2024-03-05',
      time: '9:00 PM',
      venue: 'Porch Records Studio',
      address: '123 Music Street, City, State',
      image: '/placeholder-show.jpg',
      ticketLink: 'https://tickets.example.com/show4',
      price: '$18',
      status: 'upcoming',
      genre: 'Electronic'
    }
  ];

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
          'grid-cols-1 md:grid-cols-2'
        }`;
      case 'list':
        return 'space-y-6';
      case 'carousel':
        return 'flex overflow-x-auto space-x-6 pb-4';
      case 'timeline':
        return 'space-y-6';
      default:
        return 'grid gap-6 grid-cols-1 md:grid-cols-2';
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sold-out':
        return (
          <span className="inline-block px-2 py-1 text-xs font-mono font-semibold rounded-theme bg-red-100 text-red-800">
            Sold Out
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-block px-2 py-1 text-xs font-mono font-semibold rounded-theme bg-gray-100 text-gray-800">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-block px-2 py-1 text-xs font-mono font-semibold rounded-theme bg-green-100 text-green-800">
            Available
          </span>
        );
    }
  };

  const renderShow = (show: Show) => (
    <div 
      key={show.id}
      className="bg-white rounded-theme shadow-sm border border-gray-100 overflow-hidden transition-theme hover:shadow-md"
      style={{
        backgroundColor: config?.cardBackgroundColor === 'primary' ? 'var(--color-primary)' :
          config?.cardBackgroundColor === 'secondary' ? 'var(--color-secondary)' :
          config?.cardBackgroundColor === 'background' ? 'var(--color-background)' :
          config?.cardBackgroundColor === 'offwhite' ? 'var(--color-offwhite)' :
          'var(--color-offwhite)'
      }}
    >
      {/* Image */}
      {show.image && (
        <div className="aspect-video bg-gray-200">
          <ImageFallback
            src={show.image}
            alt={show.title}
            width={400}
            height={225}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Status Badge */}
        <div className="mb-3">
          {getStatusBadge(show.status)}
        </div>

        {/* Genre */}
        {show.genre && (
          <div className="mb-2">
            <span className="inline-block px-2 py-1 text-xs font-sans text-gray-600 bg-gray-100 rounded-theme">
              {show.genre}
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
          {show.title}
        </h3>

        {/* Artist */}
        <p 
          className="font-sans text-scale-1 font-medium mb-3"
          style={{ 
            color: config?.textColor === 'primary' ? 'var(--color-primary)' :
              config?.textColor === 'secondary' ? 'var(--color-secondary)' :
              config?.textColor === 'background' ? 'var(--color-background)' :
              config?.textColor === 'offwhite' ? 'var(--color-offwhite)' :
              config?.textColor === 'black' ? 'var(--color-black)' :
              'var(--color-foreground)'
          }}
        >
          {show.artist}
        </p>

        {/* Description */}
        {show.description && (
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
            {show.description}
          </p>
        )}

        {/* Date and Time */}
        <div className="flex items-center space-x-4 mb-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <span>{formatDate(show.date)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span>{show.time}</span>
          </div>
        </div>

        {/* Venue */}
        <div className="flex items-start space-x-2 mb-4">
          <svg className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-sans text-scale-1 font-medium">{show.venue}</p>
            {show.address && (
              <p className="font-sans text-sm text-gray-600">{show.address}</p>
            )}
          </div>
        </div>

        {/* Price and Ticket Link */}
        <div className="flex items-center justify-between">
          {show.price && (
            <span 
              className="font-mono font-semibold text-scale-1"
              style={{
                color: 'var(--color-primary)'
              }}
            >
              {show.price}
            </span>
          )}
          
          {show.ticketLink && show.status === 'upcoming' && (
            <a
              href={show.ticketLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-primary text-black font-mono font-semibold rounded-theme hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-theme"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-black)'
              }}
            >
              Get Tickets
              <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    const loadShows = async () => {
      setLoading(true);
      try {
        // Fetch shows from the actual API
        const response = await fetch('/api/shows/upcoming?limit=10&includePast=false');
        const data = await response.json();
        
        if (data.success && data.shows) {
          // Transform the API data to match our Show interface
          const transformedShows: Show[] = data.shows.map((show: any) => ({
            id: show.id,
            title: show.title,
            artist: show.artist || show.title,
            description: show.description,
            date: show.date,
            time: show.time,
            venue: show.venue,
            address: show.location,
            image: show.image,
            ticketLink: show.ticketUrl,
            price: show.ticketPrice,
            status: show.isSoldOut ? 'sold-out' : 'upcoming',
            genre: show.genre
          }));
          
          setShows(transformedShows);
        } else {
          console.warn('Failed to load shows from API, using defaults');
          setShows(defaultShows);
        }
      } catch (error) {
        console.error('Error loading shows:', error);
        // Fallback to default shows if API fails
        setShows(defaultShows);
      } finally {
        setLoading(false);
      }
    };

    loadShows();
  }, []);

  // Filter shows by status if specified
  const filteredShows = config?.statusFilter 
    ? shows.filter(show => show.status === config.statusFilter)
    : shows;

  // Sort shows by date
  const sortedShows = filteredShows.sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
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
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2 text-gray-600">Loading shows...</span>
        </div>
      )}
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
            {config?.title || section.content || 'Upcoming Shows'}
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

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 font-sans text-gray-600">Loading shows...</p>
          </div>
        )}

        {/* Shows Grid */}
        {!loading && (
          <>
            <div className={getLayoutClass()}>
              {sortedShows.map(renderShow)}
            </div>

            {/* View All Shows Button */}
            {config?.showViewAllButton && (
              <div className="text-center mt-12">
                <a
                  href={config.viewAllLink || '/shows'}
                  className="inline-flex items-center px-8 py-4 bg-primary text-black font-mono font-semibold rounded-theme hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-theme"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-black)'
                  }}
                >
                  {config.viewAllButtonText || 'View All Shows'}
                  <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
} 
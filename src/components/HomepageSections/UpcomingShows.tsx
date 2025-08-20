'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useHomepage } from '@/contexts/HomepageContext';

interface Show {
  id: string;
  title: string;
  artist: string;
  date: string;
  time: string;
  venue: string;
  image: string;
  ticketPrice?: number;
  ticketUrl?: string;
  isSoldOut?: boolean;
  genre?: string;
}

interface UpcomingShowsProps {
  title?: string;
  subtitle?: string;
  maxShows?: number;
  showTicketLinks?: boolean;
}

export default function UpcomingShows({
  title = "Upcoming Shows",
  subtitle = "Live music and events at Porch Records",
  maxShows = 3,
  showTicketLinks = true
}: UpcomingShowsProps) {
  const { homepageData } = useHomepage();
  const [shows, setShows] = useState<Show[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadShows = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use preloaded data if available
      if (homepageData?.shows && homepageData.shows.length > 0) {
        console.log('🚀 Using preloaded shows data');
        setShows(homepageData.shows.slice(0, maxShows));
        setIsLoading(false);
        return;
      }

      // Fallback to API call if no preloaded data
      console.log('📡 Falling back to API call for shows');
      const response = await fetch(`/api/shows/upcoming?limit=${maxShows}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch shows');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to load shows');
      }

      // Transform the data to match our component's interface
      const transformedShows: Show[] = data.shows.map((show: any) => ({
        id: show.id,
        title: show.title,
        artist: show.artist,
        date: show.date,
        time: show.time,
        venue: show.venue,
        image: show.image,
        ticketPrice: show.ticketPrice,
        ticketUrl: show.ticketUrl,
        isSoldOut: show.isSoldOut,
        genre: show.genre
      }));

      setShows(transformedShows);
    } catch (err) {
      console.error('Failed to load upcoming shows:', err);
      setError('Failed to load shows');
    } finally {
      setIsLoading(false);
    }
  }, [homepageData, maxShows]);

  useEffect(() => {
    loadShows();
  }, [loadShows]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date();
  };

  if (isLoading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {title}
            </h2>
            <p className="text-lg text-gray-600">{subtitle}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">{error}</p>
            <button
              onClick={loadShows}
              className="mt-3 text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header - House of Darwin Style */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-mono uppercase tracking-wider mb-6 text-gray-900">
            {title}
          </h2>
          <p className="text-sm md:text-base font-mono uppercase tracking-wide opacity-70 max-w-2xl mx-auto text-gray-600">
            {subtitle}
          </p>
        </div>

        {/* Shows Grid - House of Darwin Style */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-t border-l"
             style={{ borderColor: 'var(--color-black)' }}>
          {shows.map((show) => (
            <div key={show.id} className="border-r border-b group"
                 style={{ borderColor: 'var(--color-black)' }}>
              <Link
                href={`/shows/${show.id}`}
                className="block"
              >
                {/* Show Image Container */}
                <div className="relative aspect-video overflow-hidden flex items-center justify-center"
                     style={{ backgroundColor: 'var(--color-offwhite)' }}>
                  <Image
                    src={show.image}
                    alt={show.title}
                    fill
                    style={{ objectFit: 'cover' }}
                    className="transition-all duration-500 ease-in-out group-hover:scale-105"
                  />
                  {show.isSoldOut && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white text-xs px-3 py-1 font-mono uppercase tracking-wide">
                      Sold Out
                    </div>
                  )}
                  {show.genre && (
                    <div className="absolute bottom-4 left-4 bg-black/80 text-white text-xs px-3 py-1 font-mono uppercase tracking-wide">
                      {show.genre}
                    </div>
                  )}
                </div>

                {/* Show Info - Minimal, below image */}
                <div className="p-6 text-black" style={{ backgroundColor: 'var(--color-offwhite)' }}>
                  {/* Show Title - Uppercase, bold serif/mono */}
                  <h3 className="font-bold text-sm uppercase leading-tight font-mono tracking-wide mb-2">
                    {show.title}
                  </h3>
                  <p className="text-xs font-mono mb-4 opacity-70">
                    {show.artist}
                  </p>
                  
                  <div className="space-y-2 text-xs font-mono mb-4 opacity-80">
                    <div className="flex items-center">
                      <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(show.date)} at {show.time}
                    </div>
                    <div className="flex items-center">
                      <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {show.venue}
                    </div>
                  </div>

                  {/* Ticket Info */}
                  <div className="flex items-center justify-between">
                    {show.ticketPrice && (
                      <span className="text-xs font-mono font-bold">
                        ${show.ticketPrice}
                      </span>
                    )}
                    
                    {showTicketLinks && show.ticketUrl && !show.isSoldOut && (
                      <button
                        className="text-xs font-mono uppercase tracking-wide px-4 py-2 border border-black hover:bg-black hover:text-white transition-colors"
                        style={{ borderColor: 'var(--color-black)' }}
                        onClick={(e) => {
                          e.preventDefault();
                          window.open(show.ticketUrl, '_blank');
                        }}
                      >
                        Get Tickets
                      </button>
                    )}
                    
                    {show.isSoldOut && (
                      <span className="text-xs font-mono uppercase tracking-wide text-red-600">
                        Sold Out
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* View All Shows Button */}
        <div className="text-center mt-12">
          <Link
            href="/shows"
            className="inline-flex items-center px-6 py-3 bg-mustard text-white font-medium rounded-lg hover:bg-mustard/90 transition-colors"
          >
            View All Shows
            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
} 
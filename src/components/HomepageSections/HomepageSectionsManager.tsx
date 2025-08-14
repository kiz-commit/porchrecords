'use client';

import React from 'react';
import { useHomepage } from '@/contexts/HomepageContext';
import { HomepageSection } from '@/lib/types';
import MailchimpSubscribe from './MailchimpSubscribe';
import StoreHighlights from './StoreHighlights';
import UpcomingShows from './UpcomingShows';
import LatestReleases from './LatestReleases';
import AboutPreview from './AboutPreview';

interface HomepageSectionsManagerProps {
  preloadedSections?: any[];
}

export default function HomepageSectionsManager({ preloadedSections }: HomepageSectionsManagerProps) {
  const { sections: contextSections, isLoading, error } = useHomepage();
  
  // Use preloaded sections if available, otherwise use context
  const sections = preloadedSections || contextSections;

  if (isLoading && !preloadedSections) {
    return (
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mustard mx-auto mb-4"></div>
          <p className="text-gray-600">Loading homepage sections...</p>
        </div>
      </div>
    );
  }

  if (error && !preloadedSections) {
    return (
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">Failed to load homepage sections: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!sections || sections.length === 0) {
    return null; // Don't render anything if no sections
  }

  // Sort sections by order_index
  const sortedSections = [...sections].sort((a, b) => a.order_index - b.order_index);

  const renderSection = (section: HomepageSection) => {
    if (!section.is_active) return null;

    switch (section.section_type) {
      case 'mailchimp-subscribe':
        return (
          <MailchimpSubscribe
            key={section.id}
            title={section.section_data?.title}
            subtitle={section.section_data?.subtitle}
            placeholder={section.section_data?.placeholder}
            buttonText={section.section_data?.buttonText}
            successMessage={section.section_data?.successMessage}
            errorMessage={section.section_data?.errorMessage}
            mailchimpApiKey={section.section_data?.mailchimpApiKey}
            mailchimpAudienceId={section.section_data?.mailchimpAudienceId}
            mailchimpServerPrefix={section.section_data?.mailchimpServerPrefix}
            enableDoubleOptIn={section.section_data?.enableDoubleOptIn}
            tags={section.section_data?.tags}
          />
        );

      case 'store-highlights':
        return (
          <StoreHighlights
            key={section.id}
            title={section.section_data?.title}
            subtitle={section.section_data?.subtitle}
            type={section.section_data?.type || 'selling-fast'}
            maxProducts={section.section_data?.maxProducts || 4}
          />
        );

      case 'upcoming-shows':
        return (
          <UpcomingShows
            key={section.id}
            title={section.section_data?.title}
            subtitle={section.section_data?.subtitle}
            maxShows={section.section_data?.maxShows || 3}
            showTicketLinks={section.section_data?.showTicketLinks !== false}
          />
        );

      case 'latest_releases':
        return (
          <LatestReleases
            key={section.id}
            title={section.section_data?.title}
            subtitle={section.section_data?.subtitle}
            maxItems={section.section_data?.maxItems || 4}
            showPrice={section.section_data?.showPrice !== false}
            showAddToCart={section.section_data?.showAddToCart !== false}
          />
        );

      case 'about_preview':
        return (
          <AboutPreview
            key={section.id}
            title={section.section_data?.title}
            subtitle={section.section_data?.subtitle}
            content={section.section_data?.content}
            ctaText={section.section_data?.ctaText}
            ctaLink={section.section_data?.ctaLink}
            image={section.section_data?.image}
          />
        );

      default:
        console.warn(`Unknown section type: ${section.section_type}`);
        return null;
    }
  };

  return (
    <div className="homepage-sections">
      {sortedSections.map(renderSection)}
    </div>
  );
} 
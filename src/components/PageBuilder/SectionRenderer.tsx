"use client";

import React from 'react';
import Image from 'next/image';
import { PageSection } from '@/lib/types';
import PageBuilderErrorBoundary from './ErrorBoundary';
import ImageFallback from './ImageFallback';
import SectionControls from './SectionControls';

// Import section components directly to avoid chunk loading issues
import HeroSection from './sections/HeroSection';
import TextSection from './sections/TextSection';
import ImageSection from './sections/ImageSection';
import GallerySection from './sections/GallerySection';
import StudioOverviewSection from './sections/StudioOverviewSection';
import ShowsSection from './sections/ShowsSection';
import TestimonialsSection from './sections/TestimonialsSection';
import CtaSection from './sections/CtaSection';
import DividerSection from './sections/DividerSection';
import VideoSection from './sections/VideoSection';
import AudioSection from './sections/AudioSection';
import SocialFeedSection from './sections/SocialFeedSection';
import StorySection from './sections/StorySection';

import CommunitySpotlightSection from './sections/CommunitySpotlightSection';
import GridSection from './sections/GridSection';
import HoursLocationSection from './sections/HoursLocationSection';



interface SectionRendererProps {
  section: PageSection;
  isPreview: boolean;
  onSelect?: () => void;
  isSelected?: boolean;
  onEdit?: (section: PageSection) => void;
  onMove?: (sectionId: string, direction: 'up' | 'down') => void;
  onDelete?: (sectionId: string) => void;
  onDuplicate?: (sectionId: string) => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export default function SectionRenderer({ 
  section, 
  isPreview, 
  onSelect, 
  isSelected,
  onEdit,
  onMove,
  onDelete,
  onDuplicate,
  isFirst = false,
  isLast = false
}: SectionRendererProps) {
  const handleClick = () => {
    if (!isPreview && onSelect) {
      console.log('Section clicked:', section.id, section.type);
      onSelect();
    }
  };

  const getSectionContent = () => {
    const sectionProps = { section, isPreview };
    
    switch (section.type) {
      case 'hero':
        return <HeroSection {...sectionProps} />;
      case 'text':
        return <TextSection {...sectionProps} />;
      case 'image':
        return <ImageSection {...sectionProps} />;
      case 'gallery':
        return <GallerySection {...sectionProps} />;
      case 'studio-overview':
        return <StudioOverviewSection {...sectionProps} />;
      case 'shows':
        return <ShowsSection {...sectionProps} />;
      case 'testimonials':
        return <TestimonialsSection {...sectionProps} />;
      case 'cta':
        return <CtaSection {...sectionProps} />;
      case 'divider':
        return <DividerSection {...sectionProps} />;
      case 'video':
        return <VideoSection {...sectionProps} />;
      case 'audio':
        return <AudioSection {...sectionProps} />;
      case 'social-feed':
        return <SocialFeedSection {...sectionProps} />;
      case 'story':
        return <StorySection {...sectionProps} />;

      case 'community-spotlight':
        return <CommunitySpotlightSection {...sectionProps} />;
      case 'grid':
        return <GridSection {...sectionProps} />;
      case 'hours-location':
        return <HoursLocationSection {...sectionProps} />;
      default:
        return <div className="p-6 text-center text-gray-500">Unknown section type: {section.type}</div>;
    }
  };

  return (
    <PageBuilderErrorBoundary
      component={`${section.type.charAt(0).toUpperCase() + section.type.slice(1)} Section`}
      sectionId={section.id}
      onRetry={() => {
        // Force re-render by updating the section
        console.log('Retrying section render:', section.id);
      }}
      onFallback={() => {
        // Replace with a simple text section as fallback
        console.log('Using fallback content for section:', section.id);
      }}
    >
      <div
        onClick={handleClick}
        className={`relative group ${
          !isPreview && onSelect
            ? 'cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all'
            : ''
        } ${
          isSelected ? 'ring-2 ring-blue-500' : ''
        }`}
      >
        {getSectionContent()}
        
        {/* Section Type Badge - Only show in preview/admin mode */}
        {isPreview && (
          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-2 py-1 text-xs text-gray-600">
              {section.type}
            </div>
          </div>
        )}

        {/* Section Controls */}
        {onEdit && onMove && onDelete && onDuplicate && (
          <SectionControls
            section={section}
            isFirst={isFirst}
            isLast={isLast}
            onEdit={onEdit}
            onMove={onMove}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
          />
        )}
      </div>
    </PageBuilderErrorBoundary>
  );
} 
"use client";

import React, { useMemo, useState, lazy, Suspense } from 'react';
import { PageContent, PageSection, PageSectionType } from '@/lib/types';
import pageTemplatesData from '@/data/pageTemplates.json';

// Import SEOTools directly to avoid chunk loading issues
import SEOTools from './SEOTools';
// Import AccessibilityChecker
import AccessibilityChecker from './AccessibilityChecker';



interface SectionTemplate {
  type: PageSectionType;
  title: string;
  icon: string;
  content: string;
  config?: any;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSection: (type: PageSectionType, template?: Partial<PageSection>) => void;
  page: PageContent;
  onUpdatePage: (page: PageContent) => void;
}

const ALL_SECTION_TYPES: SectionTemplate[] = [
  { type: 'hero', title: 'Hero Section', icon: '🎯', content: 'Your Hero Title', config: { hero: { backgroundImage: '/hero-image.jpg', textColor: 'white', textAlignment: 'center', buttonText: 'Learn More', buttonLink: '#', buttonStyle: 'primary', overlayOpacity: 0.8, overlayColor: 'oklch(0.705 0.213 47.604)', fullHeight: true } } },
  { type: 'text', title: 'Content Section', icon: '📄', content: 'Add your content here...', config: { text: { contentAlignment: 'left', textSize: 'medium', backgroundColor: 'transparent', textColor: 'inherit', padding: 'medium', maxWidth: '4xl' } } },
  { type: 'image', title: 'Image Section', icon: '🖼️', content: 'Image caption', config: { image: { imageUrl: '/placeholder-image.jpg', altText: 'Image description', caption: 'Image caption', imageSize: 'medium', imageAlignment: 'center', borderRadius: 'medium', shadow: 'medium', borderColor: '#000000', captionColor: '#000000', borderWidth: 'none', borderStyle: 'solid', captionPosition: 'below', captionFontSize: 'small' } } },
  { type: 'gallery', title: 'Gallery Section', icon: '📸', content: 'Image Gallery', config: { gallery: { images: [], layout: 'grid', columns: 3, gap: 'medium', showCaptions: true, showThumbnails: false } } },

  { type: 'studio-overview', title: 'Studio Overview', icon: '🎙️', content: 'Studio Overview', config: { studioOverview: { studioImage: '/studio-image.jpg', equipment: [], services: [], testimonials: [], bookingLink: '/contact', showEquipment: true, showServices: true, showTestimonials: true, showBookingButton: true } } },
  { type: 'shows', title: 'Shows Section', icon: '🎪', content: 'Live Shows', config: { shows: { showType: 'upcoming', layout: 'grid', showsPerPage: 6, showImages: true, showVenue: true, showTicketLink: true } } },
  { type: 'testimonials', title: 'Testimonials', icon: '💬', content: 'What Our Customers Say', config: { testimonials: { layout: 'grid', columns: 3, showRatings: true, showAvatars: true, testimonials: [] } } },
  { type: 'cta', title: 'Call to Action', icon: '🎯', content: 'Ready to Get Started?', config: { cta: { ctaTitle: 'Ready to Get Started?', ctaDescription: 'Join thousands of music lovers...', buttonText: 'Shop Now', buttonLink: '/store', buttonStyle: 'primary', backgroundColor: '#f3f4f6', textColor: '#111827', layout: 'center' } } },
  { type: 'divider', title: 'Divider', icon: '➖', content: '', config: { divider: { style: 'line', thickness: 'medium', color: '#e5e7eb', width: 'full', spacing: 'normal' } } },
  { type: 'video', title: 'Video', icon: '🎬', content: 'Watch Our Story', config: { video: { videoUrl: '', videoType: 'youtube', aspectRatio: '16:9', autoplay: false, controls: true, loop: false, muted: false, poster: '', caption: '' } } },
  { type: 'audio', title: 'Audio Player', icon: '🎵', content: 'Featured Track', config: { audio: { audioUrl: '', title: 'Featured Track', artist: '', album: '', albumArt: '', autoplay: false, loop: false, showPlaylist: false, playerStyle: 'default', backgroundColor: '#ffffff' } } },
  { type: 'social-feed', title: 'Social Feed', icon: '📱', content: 'Follow Us', config: { socialFeed: { feedType: 'instagram', handle: '@porchrecords', postCount: 6, layout: 'grid', columns: 3, showCaptions: true, showDates: true, showLikes: true, openInNewTab: true, hashtag: '#music', refreshInterval: 15 } } },
  { type: 'story', title: 'Story Section', icon: '📖', content: 'Our Story', config: { story: { storyTitle: 'The Porch Records Story', storyContent: '', storyImage: '', imagePosition: 'right', backgroundColor: 'white', textColor: 'inherit', layout: 'text-image', showDivider: true, dividerStyle: 'line' } } },

  { type: 'community-spotlight', title: 'Community Spotlight', icon: '🌟', content: 'Community Spotlight', config: { communitySpotlight: { title: 'Local Artists & Events', description: '', spotlightItems: [], layout: 'grid', backgroundColor: 'white', textColor: 'inherit' } } },
  { type: 'grid', title: 'Grid', icon: '🔲', content: 'Grid Content', config: { grid: { title: 'Grid Section', description: '', items: [], layout: 'grid', showImages: true, backgroundColor: 'gray-50' } } },
  { type: 'hours-location', title: 'Hours & Location', icon: '📍', content: 'Visit Us', config: { hoursLocation: { title: 'Visit Porch Records', address: '', phone: '', email: '', hours: [], mapEmbed: true, backgroundColor: 'white', textColor: 'inherit' } } },
];

export default function Sidebar({ isOpen, onClose, onAddSection, page, onUpdatePage }: SidebarProps) {
  // Extract templates and categories for display
  const templates = useMemo(() => pageTemplatesData.templates || [], []);
  const categories = useMemo(() => pageTemplatesData.categories || [], []);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showTemplates, setShowTemplates] = useState(false);

  // Filter templates by category
  const filteredTemplates = useMemo(() => {
    if (selectedCategory === 'all') return templates;
    return templates.filter(template => template.category === selectedCategory);
  }, [templates, selectedCategory]);

  // Apply template to page
  const applyTemplate = (template: any) => {
    const newSections = template.sections.map((section: any, index: number) => ({
      ...section,
      id: `${section.type}-${Date.now()}-${index}`,
      order: index + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    onUpdatePage({
      ...page,
      sections: [...page.sections, ...newSections],
      title: template.name,
      description: template.description,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 left-0 w-80 bg-white border-r border-gray-200 z-50 overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Page Builder</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Page Settings */}
        <div className="mb-8">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Page Settings</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={page.description}
                onChange={(e) => onUpdatePage({ ...page, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Page description..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta Title
              </label>
              <input
                type="text"
                value={page.metaTitle || ''}
                onChange={(e) => onUpdatePage({ ...page, metaTitle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="SEO title..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta Description
              </label>
              <textarea
                value={page.metaDescription || ''}
                onChange={(e) => onUpdatePage({ ...page, metaDescription: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="SEO description..."
              />
            </div>
          </div>
        </div>

        {/* Section Types */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-4">Add Sections</h3>
          <div className="space-y-3">
            {ALL_SECTION_TYPES.map((section, idx) => (
              <button
                key={section.type}
                onClick={() => onAddSection(section.type as PageSectionType, section)}
                className="w-full p-4 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{section.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{section.title}</h4>
                    <p className="text-sm text-gray-600">{section.content}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Templates */}
        {templates.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-900">Page Templates</h3>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {showTemplates ? 'Hide' : 'Show'} Templates
              </button>
            </div>
            
            {showTemplates && (
              <div className="space-y-4">
                {/* Category Filter */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      selectedCategory === 'all'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  {categories.map(category => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {category.icon} {category.name}
                    </button>
                  ))}
                </div>

                {/* Template List */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {filteredTemplates.map((template) => (
                    <div key={template.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{template.name}</h4>
                          <p className="text-sm text-gray-600">{template.description}</p>
                        </div>
                        <button
                          onClick={() => applyTemplate(template)}
                          className="ml-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                        >
                          Apply
                        </button>
                      </div>
                      
                      {/* Template Preview */}
                      <div className="mt-3">
                        <div className="text-xs text-gray-500 mb-2">Sections:</div>
                        <div className="flex flex-wrap gap-1">
                          {template.sections.map((section: any, index: number) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded"
                            >
                              {section.title || section.type}
                            </span>
                          ))}
                          {template.sections.length === 0 && (
                            <span className="px-2 py-1 bg-gray-100 text-xs text-gray-500 rounded">
                              Empty template
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quick Add Individual Sections */}
                      {template.sections.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="text-xs text-gray-500 mb-2">Quick add sections:</div>
                          <div className="flex flex-wrap gap-1">
                            {template.sections.slice(0, 3).map((section: any, index: number) => (
                              <button
                                key={index}
                                onClick={() => onAddSection(section.type as PageSectionType, { ...section, type: section.type as PageSectionType } as Partial<PageSection>)}
                                className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded hover:bg-blue-100 transition-colors"
                              >
                                + {section.title || section.type}
                              </button>
                            ))}
                            {template.sections.length > 3 && (
                              <span className="px-2 py-1 text-xs text-gray-500">
                                +{template.sections.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SEO Tools */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">SEO Tools</h3>
          <SEOTools 
            page={page} 
            onUpdateMeta={(meta) => {
              // Update page with new meta tags
              onUpdatePage({
                ...page,
                title: meta.title,
                description: meta.description
              });
            }}
            className="max-h-96 overflow-y-auto"
          />
        </div>

        {/* Accessibility Checker */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Accessibility Checker</h3>
          <AccessibilityChecker 
            page={page}
            onIssuesFound={(issues) => {
              console.log('Accessibility issues found:', issues);
            }}
            className="max-h-96 overflow-y-auto"
          />
        </div>

        {/* Page Stats */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Page Stats</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Sections:</span>
              <span>{page.sections.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className={page.isPublished ? 'text-green-600' : 'text-yellow-600'}>
                {page.isPublished ? 'Published' : 'Draft'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Created:</span>
              <span>{new Date(page.createdAt).toISOString().split('T')[0]}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
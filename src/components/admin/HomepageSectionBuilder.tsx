'use client';

import React, { useState, useEffect } from 'react';
import { useHomepage, useHomepageSections } from '@/contexts/HomepageContext';

interface SectionType {
  id: string;
  name: string;
  description: string;
  icon: string;
  defaultData: any;
}

const sectionTypes: SectionType[] = [
  {
    id: 'store-highlights',
    name: 'Store Highlights',
    description: 'Display products with analytics data (selling fast, customer favorites)',
    icon: '🛍️',
    defaultData: {
      title: 'Selling Fast',
      subtitle: 'Limited stock available on these popular releases',
      type: 'selling-fast',
      maxProducts: 4,
      theme: {
        backgroundColor: 'default',
        textColor: 'default',
        accentColor: 'default'
      }
    }
  },
  {
    id: 'latest_releases',
    name: 'Latest Releases',
    description: 'Display the most recent products added to the store',
    icon: '🆕',
    defaultData: {
      title: 'Latest Releases',
      subtitle: 'Fresh vinyl from the Porch',
      maxItems: 4,
      showPrice: true,
      showAddToCart: true,
      theme: {
        backgroundColor: 'default',
        textColor: 'default',
        accentColor: 'default'
      }
    }
  },
  {
    id: 'upcoming-shows',
    name: 'Upcoming Shows',
    description: 'Showcase upcoming live events and performances',
    icon: '🎵',
    defaultData: {
      title: 'Upcoming Shows',
      subtitle: 'Live music and events at Porch Records',
      maxShows: 3,
      showTicketLinks: true,
      theme: {
        backgroundColor: 'default',
        textColor: 'default',
        accentColor: 'default'
      }
    }
  },
  {
    id: 'about_preview',
    name: 'About Preview',
    description: 'Display an about section with company information and CTA',
    icon: 'ℹ️',
    defaultData: {
      title: 'About Porch Records',
      subtitle: 'Independent record label, physical record store, live-music promoter, and creative studio',
      content: 'Based in Adelaide, we curate and showcase forward-thinking music across Jazz, Funk, Soul, Hip Hop, and international grooves.',
      ctaText: 'Learn More',
      ctaLink: '/about',
      image: '/hero-image.jpg',
      theme: {
        backgroundColor: 'default',
        textColor: 'default',
        accentColor: 'default'
      }
    }
  },
  {
    id: 'mailchimp-subscribe',
    name: 'Newsletter Signup',
    description: 'Email subscription form for newsletter with Mailchimp integration',
    icon: '📧',
    defaultData: {
      title: 'Stay in the Loop',
      subtitle: 'Get updates on new releases, shows, and exclusive offers',
      placeholder: 'Enter your email address',
      buttonText: 'Subscribe',
      successMessage: 'Thanks for subscribing!',
      errorMessage: 'Something went wrong. Please try again.',
      mailchimpApiKey: '',
      mailchimpAudienceId: '',
      mailchimpServerPrefix: '',
      enableDoubleOptIn: true,
      tags: [],
      theme: {
        backgroundColor: 'default',
        textColor: 'default',
        accentColor: 'default'
      }
    }
  }
];

export default function HomepageSectionBuilder() {
  const { sections, isLoading, error, refreshSections } = useHomepage();
  const { createSection, updateSection, deleteSection, reorderSections } = useHomepageSections();
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [selectedSectionType, setSelectedSectionType] = useState<string>('');
  const [editingSection, setEditingSection] = useState<number | null>(null);

  const handleMoveUp = async (sectionId: number, currentIndex: number) => {
    if (currentIndex === 0) return;
    
    const items = Array.from(sections || []);
    const [movedItem] = items.splice(currentIndex, 1);
    items.splice(currentIndex - 1, 0, movedItem);

    // Update order indices
    const updatedItems = items.map((item, index) => ({
      ...item,
      order_index: index + 1
    }));

    await reorderSections(updatedItems);
  };

  const handleMoveDown = async (sectionId: number, currentIndex: number) => {
    if (currentIndex === (sections?.length || 0) - 1) return;
    
    const items = Array.from(sections || []);
    const [movedItem] = items.splice(currentIndex, 1);
    items.splice(currentIndex + 1, 0, movedItem);

    // Update order indices
    const updatedItems = items.map((item, index) => ({
      ...item,
      order_index: index + 1
    }));

    await reorderSections(updatedItems);
  };

  const handleAddSection = async (sectionType: string) => {
    const type = sectionTypes.find(t => t.id === sectionType);
    if (!type) return;

    try {
      await createSection({
        section_type: sectionType,
        section_data: type.defaultData,
        order_index: (sections?.length || 0) + 1,
        is_active: true
      });
      setIsAddingSection(false);
      setSelectedSectionType('');
    } catch (error) {
      console.error('Failed to add section:', error);
    }
  };

  const handleEditSection = (sectionId: number) => {
    setEditingSection(sectionId);
  };

  const handleSaveSection = async (sectionId: number, data: any) => {
    try {
      await updateSection(sectionId, data);
      setEditingSection(null);
    } catch (error) {
      console.error('Failed to update section:', error);
    }
  };

  const handleDeleteSection = async (sectionId: number) => {
    if (!confirm('Are you sure you want to delete this section?')) return;
    
    try {
      await deleteSection(sectionId);
    } catch (error) {
      console.error('Failed to delete section:', error);
    }
  };

  const handleToggleSection = async (sectionId: number, isActive: boolean) => {
    const section = sections?.find(s => s.id === sectionId);
    if (!section) return;

    try {
      await updateSection(sectionId, { ...section, is_active: isActive });
    } catch (error) {
      console.error('Failed to toggle section:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-mustard mx-auto"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Homepage Sections</h2>
          <p className="text-gray-600">Manage your homepage sections below</p>
        </div>
        <button
          onClick={() => setIsAddingSection(true)}
          className="px-6 py-3 bg-mustard text-white font-medium rounded-lg hover:bg-mustard/90 transition-colors shadow-sm"
        >
          ➕ Add New Section
        </button>
      </div>



      {/* Add Section Modal */}
      {isAddingSection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Add New Section</h3>
            <div className="space-y-3">
              {sectionTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleAddSection(type.id)}
                  className="w-full p-4 border border-gray-200 rounded-lg hover:border-mustard hover:bg-mustard/5 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{type.icon}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">{type.name}</h4>
                      <p className="text-sm text-gray-600">{type.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setIsAddingSection(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sections List */}
      <div className="space-y-4">
        {sections?.map((section, index) => (
          <div key={section.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Section Info */}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">
                      {sectionTypes.find(t => t.id === section.section_type)?.icon || '📄'}
                    </span>
                    <h3 className="font-medium text-gray-900">
                      {sectionTypes.find(t => t.id === section.section_type)?.name || section.section_type}
                    </h3>
                    <span className="text-sm text-gray-500">#{section.order_index}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {section.section_data?.title || 'Untitled Section'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2">
                {/* Move Up/Down */}
                <div className="flex flex-col">
                  <button
                    onClick={() => handleMoveUp(section.id, index)}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleMoveDown(section.id, index)}
                    disabled={index === (sections?.length || 0) - 1}
                    className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Toggle Active */}
                <button
                  onClick={() => handleToggleSection(section.id, !section.is_active)}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    section.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {section.is_active ? '✅ Active' : '❌ Inactive'}
                </button>

                {/* Edit */}
                <button
                  onClick={() => handleEditSection(section.id)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDeleteSection(section.id)}
                  className="p-2 text-gray-400 hover:text-red-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Edit Form */}
            {editingSection === section.id && (
              <SectionEditForm
                section={section}
                onSave={(data) => handleSaveSection(section.id, data)}
                onCancel={() => setEditingSection(null)}
              />
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {(!sections || sections.length === 0) && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No sections yet</h3>
          <p className="text-gray-600 mb-4">Add your first homepage section to get started</p>
          <button
            onClick={() => setIsAddingSection(true)}
            className="px-4 py-2 bg-mustard text-white font-medium rounded-lg hover:bg-mustard/90 transition-colors"
          >
            Add Section
          </button>
        </div>
      )}
    </div>
  );
}

// Section Edit Form Component
function SectionEditForm({ section, onSave, onCancel }: {
  section: any;
  onSave: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState(section.section_data);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...section,
      section_data: formData
    });
  };

  const renderThemeFields = () => (
    <div className="border-t border-gray-200 pt-4 mt-4">
      <h4 className="text-sm font-medium text-gray-900 mb-3">Theme Settings</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Background</label>
          <select
            value={formData.theme?.backgroundColor || 'default'}
            onChange={(e) => setFormData({ 
              ...formData, 
              theme: { 
                ...formData.theme, 
                backgroundColor: e.target.value 
              } 
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mustard"
          >
            <option value="default">Default (Site Theme)</option>
            <option value="primary">Primary Color</option>
            <option value="secondary">Secondary Color</option>
            <option value="mustard">Mustard</option>
            <option value="clay">Clay</option>
            <option value="offwhite">Off White</option>
            <option value="black">Black</option>
            <option value="white">White</option>
            <option value="gray-50">Light Gray</option>
            <option value="gray-100">Gray</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
          <select
            value={formData.theme?.textColor || 'default'}
            onChange={(e) => setFormData({ 
              ...formData, 
              theme: { 
                ...formData.theme, 
                textColor: e.target.value 
              } 
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mustard"
          >
            <option value="default">Default (Site Theme)</option>
            <option value="primary">Primary Color</option>
            <option value="secondary">Secondary Color</option>
            <option value="mustard">Mustard</option>
            <option value="clay">Clay</option>
            <option value="offwhite">Off White</option>
            <option value="black">Black</option>
            <option value="white">White</option>
            <option value="gray-600">Dark Gray</option>
            <option value="gray-500">Gray</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Accent Color</label>
          <select
            value={formData.theme?.accentColor || 'default'}
            onChange={(e) => setFormData({ 
              ...formData, 
              theme: { 
                ...formData.theme, 
                accentColor: e.target.value 
              } 
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mustard"
          >
            <option value="default">Default (Site Theme)</option>
            <option value="primary">Primary Color</option>
            <option value="secondary">Secondary Color</option>
            <option value="mustard">Mustard</option>
            <option value="clay">Clay</option>
            <option value="offwhite">Off White</option>
            <option value="black">Black</option>
            <option value="white">White</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderFields = () => {
    switch (section.section_type) {
      case 'store-highlights':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mustard"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
              <input
                type="text"
                value={formData.subtitle || ''}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mustard"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={formData.type || 'selling-fast'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mustard"
              >
                <option value="selling-fast">Selling Fast</option>
                <option value="returning-users">Customer Favorites</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Products</label>
              <input
                type="number"
                min="1"
                max="8"
                value={formData.maxProducts || 4}
                onChange={(e) => setFormData({ ...formData, maxProducts: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mustard"
              />
            </div>
            {renderThemeFields()}
          </div>
        );

      case 'upcoming-shows':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mustard"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
              <input
                type="text"
                value={formData.subtitle || ''}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mustard"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Shows</label>
              <input
                type="number"
                min="1"
                max="6"
                value={formData.maxShows || 3}
                onChange={(e) => setFormData({ ...formData, maxShows: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mustard"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showTicketLinks"
                checked={formData.showTicketLinks !== false}
                onChange={(e) => setFormData({ ...formData, showTicketLinks: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="showTicketLinks" className="text-sm font-medium text-gray-700">
                Show ticket links
              </label>
            </div>
            {renderThemeFields()}
          </div>
        );

      case 'latest_releases':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mustard"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
              <input
                type="text"
                value={formData.subtitle || ''}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mustard"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Items</label>
              <input
                type="number"
                min="1"
                max="8"
                value={formData.maxItems || 4}
                onChange={(e) => setFormData({ ...formData, maxItems: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mustard"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showPrice"
                checked={formData.showPrice !== false}
                onChange={(e) => setFormData({ ...formData, showPrice: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="showPrice" className="text-sm font-medium text-gray-700">
                Show price
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="showAddToCart"
                checked={formData.showAddToCart !== false}
                onChange={(e) => setFormData({ ...formData, showAddToCart: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="showAddToCart" className="text-sm font-medium text-gray-700">
                Show add to cart button
              </label>
            </div>
            {renderThemeFields()}
          </div>
        );

      case 'about_preview':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mustard"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
              <input
                type="text"
                value={formData.subtitle || ''}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mustard"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea
                value={formData.content || ''}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mustard"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CTA Text</label>
              <input
                type="text"
                value={formData.ctaText || ''}
                onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mustard"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CTA Link</label>
              <input
                type="text"
                value={formData.ctaLink || ''}
                onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mustard"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
              <input
                type="text"
                value={formData.image || ''}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mustard"
              />
            </div>
            {renderThemeFields()}
          </div>
        );

      case 'mailchimp-subscribe':
        return (
          <div className="space-y-4">
            {/* Display Settings */}
            <div className="border-b border-gray-200 pb-4 mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Display Settings</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mustard"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={formData.subtitle || ''}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mustard"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder Text</label>
                  <input
                    type="text"
                    value={formData.placeholder || ''}
                    onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mustard"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
                  <input
                    type="text"
                    value={formData.buttonText || ''}
                    onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mustard"
                  />
                </div>
              </div>
            </div>

            {/* Mailchimp Configuration */}
            <div className="border-b border-gray-200 pb-4 mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Mailchimp Configuration</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                  <input
                    type="password"
                    value={formData.mailchimpApiKey || ''}
                    onChange={(e) => setFormData({ ...formData, mailchimpApiKey: e.target.value })}
                    placeholder="Enter your Mailchimp API key"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mustard"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Find this in Mailchimp → Account → Extras → API Keys
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Audience ID</label>
                  <input
                    type="text"
                    value={formData.mailchimpAudienceId || ''}
                    onChange={(e) => setFormData({ ...formData, mailchimpAudienceId: e.target.value })}
                    placeholder="e.g., abc123def4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mustard"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Find this in Mailchimp → Audience → Settings → Audience name and defaults
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Server Prefix</label>
                  <input
                    type="text"
                    value={formData.mailchimpServerPrefix || ''}
                    onChange={(e) => setFormData({ ...formData, mailchimpServerPrefix: e.target.value })}
                    placeholder="e.g., us1, us2, us3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mustard"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    The server prefix from your Mailchimp API key (usually us1, us2, etc.)
                  </p>
                </div>
              </div>
            </div>

            {/* Subscription Settings */}
            <div className="border-b border-gray-200 pb-4 mb-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Subscription Settings</h4>
              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="enableDoubleOptIn"
                    checked={formData.enableDoubleOptIn !== false}
                    onChange={(e) => setFormData({ ...formData, enableDoubleOptIn: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="enableDoubleOptIn" className="text-sm font-medium text-gray-700">
                    Enable double opt-in
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.tags?.join(', ') || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                    })}
                    placeholder="newsletter, website, homepage"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mustard"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Tags to automatically apply to new subscribers
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Messages</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Success Message</label>
                  <input
                    type="text"
                    value={formData.successMessage || ''}
                    onChange={(e) => setFormData({ ...formData, successMessage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mustard"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Error Message</label>
                  <input
                    type="text"
                    value={formData.errorMessage || ''}
                    onChange={(e) => setFormData({ ...formData, errorMessage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mustard"
                  />
                </div>
              </div>
            </div>
            {renderThemeFields()}
          </div>
        );

      default:
        return <div className="text-gray-500">No configuration options available for this section type.</div>;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-gray-200">
      {renderFields()}
      <div className="flex justify-end space-x-2 mt-6">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-mustard text-white font-medium rounded-lg hover:bg-mustard/90 transition-colors"
        >
          Save Changes
        </button>
      </div>
    </form>
  );
} 
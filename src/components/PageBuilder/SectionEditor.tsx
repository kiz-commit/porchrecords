"use client";

import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { PageSection, PageSectionType } from '@/lib/types';
import { validateSection, ValidationError } from '@/lib/validation';
import ValidatedField from './ValidatedField';
import ImageUpload from './ImageUpload';
import PageBuilderErrorBoundary from './ErrorBoundary';
import {
  useUpdateSection,
  usePageBuilderShowRealTimePreview
} from '@/hooks/usePageBuilderStore';



// Import ColorPicker for color selection
import ColorPicker from '../admin/ColorPicker';



interface SectionEditorProps {
  section: PageSection;
  onClose: () => void;
}

export default function SectionEditor({ section, onClose }: SectionEditorProps) {
  console.log('SectionEditor: Rendering with section:', section?.id, section?.type);
  // Store hooks
  const updateSection = useUpdateSection();
  const showRealTimePreview = usePageBuilderShowRealTimePreview();
  
  // Deep copy settings for local editing
  const [localConfig, setLocalConfig] = useState<any>(JSON.parse(JSON.stringify(section.settings || {})));
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [localSection, setLocalSection] = useState<PageSection>({ ...section });

  // Debounce timer for real-time updates
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const handleConfigUpdate = (path: string, value: any) => {
    console.log('Config update:', path, value, 'Current content:', localSection.content);
    setLocalConfig((prev: any) => {
      const config = { ...prev };
      const keys = path.split('.');
      let current: any = config;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return config;
    });

    // Real-time preview update for config changes
    if (showRealTimePreview) {
      // Use the updated config directly instead of relying on state
      const updatedConfig = { ...localConfig };
      const keys = path.split('.');
      let current: any = updatedConfig;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      
      const updatedSection = {
        ...section,
        content: localSection.content, // Preserve the content
        settings: updatedConfig
      };
      updateSection(section.id, updatedSection);
    }
  };

  const handleSectionUpdate = (updates: Partial<PageSection>) => {
    setLocalSection(prev => ({ ...prev, ...updates }));

    // Real-time preview update for section changes
    if (showRealTimePreview) {
      updateSection(section.id, { 
        ...section, 
        ...updates,
        content: localSection.content // Always preserve content
      });
    }
  };

  // Debounced update function for content changes
  const handleContentUpdate = useCallback((content: string) => {
    console.log('Content update:', content);
    setLocalSection(prev => ({ ...prev, content }));

    // Immediate preview update for content
    if (showRealTimePreview) {
      updateSection(section.id, { ...section, content });
    }

    // Debounced save to main state
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      updateSection(section.id, { ...section, content });
    }, 1000); // 1 second debounce

    setDebounceTimer(timer);
  }, [section, updateSection, showRealTimePreview, section.id, debounceTimer]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  // Validate section whenever it changes
  useEffect(() => {
    const sectionToValidate = {
      ...localSection,
      config: localConfig
    };
    const validation = validateSection(sectionToValidate);
    setValidationErrors(validation.errors);
  }, [localSection, localConfig]);

  const handleSave = () => {
    const sectionToValidate = {
      ...localSection,
      config: localConfig
    };
    const validation = validateSection(sectionToValidate);
    
    if (validation.isValid) {
      // Clear any pending debounced updates
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      
      updateSection(section.id, { 
        ...localSection,
        settings: localConfig 
      });
      onClose();
    } else {
      setValidationErrors(validation.errors);
    }
  };

  const handleCancel = () => {
    // Clear any pending debounced updates
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    onClose();
  };

  const renderHeroConfig = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Background Image
        </label>
        <ImageUpload
          value={localConfig?.hero?.backgroundImage || ''}
          onChange={(value) => handleConfigUpdate('hero.backgroundImage', value)}
          placeholder="/hero-image.jpg"
          altText={localConfig?.hero?.backgroundImageAlt || ''}
          onAltTextChange={(value) => handleConfigUpdate('hero.backgroundImageAlt', value)}
          showAltText={true}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Overlay Color
        </label>
        <ColorPicker
          color={localConfig?.hero?.overlayColor || '#E1B84B'}
          onChange={(value) => handleConfigUpdate('hero.overlayColor', value)}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Overlay Opacity
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={localConfig?.hero?.overlayOpacity || 0.8}
          onChange={(e) => handleConfigUpdate('hero.overlayOpacity', parseFloat(e.target.value))}
          className="w-full"
        />
        <span className="text-sm text-gray-500">
          {localConfig?.hero?.overlayOpacity || 0.8}
        </span>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Text Color
        </label>
        <ColorPicker
          color={localConfig?.hero?.textColor || '#FFFFFF'}
          onChange={(value) => handleConfigUpdate('hero.textColor', value)}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Text Alignment
        </label>
        <select
          value={localConfig?.hero?.textAlignment || 'center'}
          onChange={(e) => handleConfigUpdate('hero.textAlignment', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Button Text
        </label>
        <input
          type="text"
          value={localConfig?.hero?.buttonText || ''}
          onChange={(e) => handleConfigUpdate('hero.buttonText', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Learn More"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Button Link
        </label>
        <input
          type="text"
          value={localConfig?.hero?.buttonLink || ''}
          onChange={(e) => handleConfigUpdate('hero.buttonLink', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="/contact"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Button Style
        </label>
        <select
          value={localConfig?.hero?.buttonStyle || 'primary'}
          onChange={(e) => handleConfigUpdate('hero.buttonStyle', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="primary">Primary</option>
          <option value="secondary">Secondary</option>
          <option value="outline">Outline</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Button Border Color
        </label>
        <ColorPicker
          color={localConfig?.hero?.buttonBorderColor || '#F8F6F2'}
          onChange={(value) => handleConfigUpdate('hero.buttonBorderColor', value)}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Full Height
        </label>
        <input
          type="checkbox"
          checked={localConfig?.hero?.fullHeight || false}
          onChange={(e) => handleConfigUpdate('hero.fullHeight', e.target.checked)}
          className="mr-2"
        />
        <span className="text-sm text-gray-600">Full screen height</span>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Scroll Indicator
        </label>
        <input
          type="checkbox"
          checked={localConfig?.hero?.scrollIndicator || false}
          onChange={(e) => handleConfigUpdate('hero.scrollIndicator', e.target.checked)}
          className="mr-2"
        />
        <span className="text-sm text-gray-600">Show scroll indicator</span>
      </div>
      
      {localConfig?.hero?.scrollIndicator && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Scroll Indicator Color
          </label>
          <ColorPicker
            color={localConfig?.hero?.scrollIndicatorColor || '#F8F6F2'}
            onChange={(value) => handleConfigUpdate('hero.scrollIndicatorColor', value)}
          />
        </div>
      )}
    </div>
  );

  const renderTextConfig = () => (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          type="text"
          value={localConfig?.text?.title || ''}
          onChange={(e) => handleConfigUpdate('text.title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Section title (optional)"
        />
      </div>

      {/* Subtitle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Subtitle
        </label>
        <input
          type="text"
          value={localConfig?.text?.subtitle || ''}
          onChange={(e) => handleConfigUpdate('text.subtitle', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Section subtitle (optional)"
        />
      </div>

      {/* Main Content */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Main Content
        </label>
        <textarea
          value={localSection.content || ''}
          onChange={(e) => handleContentUpdate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={6}
          placeholder="Add your content here..."
        />
      </div>

      {/* Layout */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Layout
        </label>
        <select
          value={localConfig?.text?.layout || 'single'}
          onChange={(e) => handleConfigUpdate('text.layout', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="single">Single Column</option>
          <option value="2-column">Two Columns</option>
        </select>
      </div>

      {/* Content Alignment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Content Alignment
        </label>
        <select
          value={localConfig?.text?.contentAlignment || 'left'}
          onChange={(e) => handleConfigUpdate('text.contentAlignment', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
          <option value="justify">Justify</option>
        </select>
      </div>

      {/* Text Size */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Text Size
        </label>
        <select
          value={localConfig?.text?.textSize || 'medium'}
          onChange={(e) => handleConfigUpdate('text.textSize', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
          <option value="xl">Extra Large</option>
        </select>
      </div>
      
      {/* Background Color */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Background Color
        </label>
        <ColorPicker
          color={localConfig?.text?.backgroundColor || '#FFFFFF'}
          onChange={(value) => handleConfigUpdate('text.backgroundColor', value)}
        />
      </div>
      
      {/* Text Color */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Text Color
        </label>
        <ColorPicker
          color={localConfig?.text?.textColor || '#181818'}
          onChange={(value) => handleConfigUpdate('text.textColor', value)}
        />
      </div>
      
      {/* Padding */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Padding
        </label>
        <select
          value={localConfig?.text?.padding || 'medium'}
          onChange={(e) => handleConfigUpdate('text.padding', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
          <option value="xl">Extra Large</option>
          <option value="2xl">2XL</option>
        </select>
      </div>
      
      {/* Max Width */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Max Width
        </label>
        <select
          value={localConfig?.text?.maxWidth || '4xl'}
          onChange={(e) => handleConfigUpdate('text.maxWidth', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="sm">Small</option>
          <option value="md">Medium</option>
          <option value="lg">Large</option>
          <option value="xl">Extra Large</option>
          <option value="2xl">2XL</option>
          <option value="3xl">3XL</option>
          <option value="4xl">4XL</option>
          <option value="5xl">5XL</option>
          <option value="6xl">6XL</option>
          <option value="7xl">7XL</option>
          <option value="full">Full Width</option>
        </select>
      </div>

      {/* Border Settings */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Border Settings</h4>
        
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="showBorder"
              checked={localConfig?.text?.showBorder || false}
              onChange={(e) => handleConfigUpdate('text.showBorder', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="showBorder" className="ml-2 block text-sm text-gray-700">
              Show Border
            </label>
          </div>

          {localConfig?.text?.showBorder && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Border Style
                </label>
                <select
                  value={localConfig?.text?.borderStyle || 'solid'}
                  onChange={(e) => handleConfigUpdate('text.borderStyle', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                  <option value="double">Double</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Border Color
                </label>
                <ColorPicker
                  color={localConfig?.text?.borderColor || '#d1d5db'}
                  onChange={(value) => handleConfigUpdate('text.borderColor', value)}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Typography Settings */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Typography</h4>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Font Family
            </label>
            <select
              value={localConfig?.text?.fontFamily || 'serif'}
              onChange={(e) => handleConfigUpdate('text.fontFamily', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="serif">Serif</option>
              <option value="sans">Sans Serif</option>
              <option value="mono">Monospace</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Font Weight
            </label>
            <select
              value={localConfig?.text?.fontWeight || 'normal'}
              onChange={(e) => handleConfigUpdate('text.fontWeight', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="light">Light</option>
              <option value="normal">Normal</option>
              <option value="medium">Medium</option>
              <option value="semibold">Semibold</option>
              <option value="bold">Bold</option>
              <option value="extrabold">Extrabold</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Line Height
            </label>
            <select
              value={localConfig?.text?.lineHeight || 'normal'}
              onChange={(e) => handleConfigUpdate('text.lineHeight', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="tight">Tight</option>
              <option value="normal">Normal</option>
              <option value="relaxed">Relaxed</option>
              <option value="loose">Loose</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Letter Spacing
            </label>
            <select
              value={localConfig?.text?.letterSpacing || 'normal'}
              onChange={(e) => handleConfigUpdate('text.letterSpacing', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="tight">Tight</option>
              <option value="normal">Normal</option>
              <option value="wide">Wide</option>
              <option value="wider">Wider</option>
            </select>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Call to Action</h4>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CTA Text
            </label>
            <input
              type="text"
              value={localConfig?.text?.ctaText || ''}
              onChange={(e) => handleConfigUpdate('text.ctaText', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Button text (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CTA Link
            </label>
            <input
              type="text"
              value={localConfig?.text?.ctaLink || ''}
              onChange={(e) => handleConfigUpdate('text.ctaLink', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://example.com (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CTA Style
            </label>
            <select
              value={localConfig?.text?.ctaStyle || 'primary'}
              onChange={(e) => handleConfigUpdate('text.ctaStyle', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CTA Icon
            </label>
            <input
              type="text"
              value={localConfig?.text?.ctaIcon || ''}
              onChange={(e) => handleConfigUpdate('text.ctaIcon', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="→ (optional)"
            />
          </div>
        </div>
      </div>

      {/* Two Column Layout Settings */}
      {localConfig?.text?.layout === '2-column' && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Two Column Layout</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Second Column Content
              </label>
              <textarea
                value={localConfig?.text?.secondColumnContent || ''}
                onChange={(e) => handleConfigUpdate('text.secondColumnContent', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={6}
                placeholder="Content for the second column..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Column Order
              </label>
              <select
                value={localConfig?.text?.columnOrder || 'normal'}
                onChange={(e) => handleConfigUpdate('text.columnOrder', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="normal">Main Content First</option>
                <option value="reverse">Second Column First</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Column Gap
              </label>
              <select
                value={localConfig?.text?.columnGap || 'medium'}
                onChange={(e) => handleConfigUpdate('text.columnGap', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Column Alignment
              </label>
              <select
                value={localConfig?.text?.columnAlignment || 'start'}
                onChange={(e) => handleConfigUpdate('text.columnAlignment', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="start">Top</option>
                <option value="center">Center</option>
                <option value="end">Bottom</option>
                <option value="stretch">Stretch</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Additional Content */}
      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Additional Content</h4>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Content
          </label>
          <textarea
            value={localConfig?.text?.additionalContent || ''}
            onChange={(e) => handleConfigUpdate('text.additionalContent', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={4}
            placeholder="Additional content below main text (optional)"
          />
        </div>
      </div>
    </div>
  );

  const renderImageConfig = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Image
        </label>
        <ImageUpload
          value={localConfig?.image?.imageUrl || ''}
          onChange={(value) => handleConfigUpdate('image.imageUrl', value)}
          placeholder="/image.jpg"
          altText={localConfig?.image?.altText || ''}
          onAltTextChange={(value) => handleConfigUpdate('image.altText', value)}
          showAltText={true}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Caption
        </label>
        <input
          type="text"
          value={localConfig?.image?.caption || ''}
          onChange={(e) => handleConfigUpdate('image.caption', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Image caption"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Image Size
        </label>
        <select
          value={localConfig?.image?.imageSize || 'medium'}
          onChange={(e) => handleConfigUpdate('image.imageSize', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
          <option value="full">Full Width</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Image Alignment
        </label>
        <select
          value={localConfig?.image?.imageAlignment || 'center'}
          onChange={(e) => handleConfigUpdate('image.imageAlignment', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Border Radius
        </label>
        <select
          value={localConfig?.image?.borderRadius || 'medium'}
          onChange={(e) => handleConfigUpdate('image.borderRadius', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="none">None</option>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
          <option value="full">Full</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Shadow
        </label>
        <select
          value={localConfig?.image?.shadow || 'medium'}
          onChange={(e) => handleConfigUpdate('image.shadow', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="none">None</option>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>

      {/* Enhanced Color Controls */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Border Color
        </label>
        <ColorPicker
          color={localConfig?.image?.borderColor || '#000000'}
          onChange={(value) => handleConfigUpdate('image.borderColor', value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Caption Color
        </label>
        <ColorPicker
          color={localConfig?.image?.captionColor || '#000000'}
          onChange={(value) => handleConfigUpdate('image.captionColor', value)}
        />
      </div>

      {/* Border Width Control */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Border Width
        </label>
        <select
          value={localConfig?.image?.borderWidth || 'none'}
          onChange={(e) => handleConfigUpdate('image.borderWidth', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="none">None</option>
          <option value="thin">Thin (1px)</option>
          <option value="medium">Medium (2px)</option>
          <option value="thick">Thick (3px)</option>
        </select>
      </div>

      {/* Border Style Control */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Border Style
        </label>
        <select
          value={localConfig?.image?.borderStyle || 'solid'}
          onChange={(e) => handleConfigUpdate('image.borderStyle', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
          <option value="double">Double</option>
        </select>
      </div>

      {/* Caption Position */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Caption Position
        </label>
        <select
          value={localConfig?.image?.captionPosition || 'below'}
          onChange={(e) => handleConfigUpdate('image.captionPosition', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="below">Below Image</option>
          <option value="above">Above Image</option>
          <option value="overlay">Overlay (on image)</option>
        </select>
      </div>

      {/* Caption Font Size */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Caption Font Size
        </label>
        <select
          value={localConfig?.image?.captionFontSize || 'small'}
          onChange={(e) => handleConfigUpdate('image.captionFontSize', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="xs">Extra Small</option>
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
        </select>
      </div>
    </div>
  );

  const renderGalleryConfig = () => (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={localConfig?.gallery?.title || ''}
            onChange={(e) => handleConfigUpdate('gallery.title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Gallery"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={localConfig?.gallery?.description || ''}
            onChange={(e) => handleConfigUpdate('gallery.description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Gallery description..."
            rows={2}
          />
        </div>
      </div>

      {/* Images */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Images</h3>
        
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Images</h4>
          {(localConfig?.gallery?.images || []).map((img: any, idx: number) => (
            <div key={idx} className="mb-4 p-4 border border-gray-200 rounded-lg bg-white shadow-sm relative">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Image
                  </label>
                  <ImageUpload
                    value={img.url || ''}
                    onChange={(value) => {
                      const images = [...(localConfig.gallery?.images || [])];
                      images[idx] = { ...images[idx], url: value };
                      handleConfigUpdate('gallery.images', images);
                    }}
                    placeholder="Enter image URL or upload a file"
                    altText={img.altText || ''}
                    onAltTextChange={(value) => {
                      const images = [...(localConfig.gallery?.images || [])];
                      images[idx] = { ...images[idx], altText: value };
                      handleConfigUpdate('gallery.images', images);
                    }}
                    showAltText={false}
                  />
                </div>
                

                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title (optional)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Title (optional)"
                    value={img.title || ''}
                    onChange={e => {
                      const images = [...(localConfig.gallery?.images || [])];
                      images[idx] = { ...images[idx], title: e.target.value };
                      handleConfigUpdate('gallery.images', images);
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Description (optional)"
                    value={img.description || ''}
                    onChange={e => {
                      const images = [...(localConfig.gallery?.images || [])];
                      images[idx] = { ...images[idx], description: e.target.value };
                      handleConfigUpdate('gallery.images', images);
                    }}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category (optional)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Category (optional)"
                    value={img.category || ''}
                    onChange={e => {
                      const images = [...(localConfig.gallery?.images || [])];
                      images[idx] = { ...images[idx], category: e.target.value };
                      handleConfigUpdate('gallery.images', images);
                    }}
                  />
                </div>
              </div>
              
              <button
                className="absolute bottom-3 right-3 text-sm text-red-600 hover:text-red-800 hover:underline"
                onClick={e => {
                  e.preventDefault();
                  const images = [...(localConfig.gallery?.images || [])];
                  images.splice(idx, 1);
                  handleConfigUpdate('gallery.images', images);
                }}
              >
                Remove
              </button>
            </div>
          ))}
          
          <button
            className="w-full px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors border-2 border-dashed border-blue-300 hover:border-blue-400"
            onClick={e => {
              e.preventDefault();
              const images = [...(localConfig.gallery?.images || [])];
              images.push({ url: '', altText: '', title: '', description: '', category: '' });
              handleConfigUpdate('gallery.images', images);
            }}
          >
            <svg className="w-5 h-5 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Image
          </button>
        </div>
      </div>

      {/* Layout & Display */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Layout & Display</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Layout</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={localConfig?.gallery?.layout || 'grid'}
            onChange={e => handleConfigUpdate('gallery.layout', e.target.value)}
          >
            <option value="grid">Grid</option>
            <option value="masonry">Masonry</option>
            <option value="carousel">Carousel</option>
            <option value="slideshow">Slideshow</option>
            <option value="featured">Featured</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Columns</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={localConfig?.gallery?.columns || 3}
            onChange={e => handleConfigUpdate('gallery.columns', Number(e.target.value))}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={5}>5</option>
            <option value={6}>6</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image Size</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={localConfig?.gallery?.imageSize || 'medium'}
            onChange={e => handleConfigUpdate('gallery.imageSize', e.target.value)}
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="xl">Extra Large</option>
            <option value="2xl">2X Large</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image Style</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={localConfig?.gallery?.imageStyle || 'rounded'}
            onChange={e => handleConfigUpdate('gallery.imageStyle', e.target.value)}
          >
            <option value="rounded">Rounded</option>
            <option value="rounded-lg">Rounded Large</option>
            <option value="rounded-xl">Rounded XL</option>
            <option value="circle">Circle</option>
            <option value="none">None</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Padding</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={localConfig?.gallery?.padding || 'medium'}
            onChange={e => handleConfigUpdate('gallery.padding', e.target.value)}
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="xl">Extra Large</option>
            <option value="2xl">2X Large</option>
          </select>
        </div>
      </div>

      {/* Overlay Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Overlay Settings</h3>
        
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={localConfig?.gallery?.showOverlay !== false}
            onChange={e => handleConfigUpdate('gallery.showOverlay', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label className="text-sm font-medium text-gray-700">Show Overlay</label>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Overlay Style</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={localConfig?.gallery?.overlayStyle || 'dark'}
            onChange={e => handleConfigUpdate('gallery.overlayStyle', e.target.value)}
          >
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="gradient">Gradient</option>
            <option value="none">None</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Overlay Text Color</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={localConfig?.gallery?.overlayTextColor || 'white'}
            onChange={e => handleConfigUpdate('gallery.overlayTextColor', e.target.value)}
          >
            <option value="white">White</option>
            <option value="black">Black</option>
          </select>
        </div>
      </div>

      {/* Interactive Features */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Interactive Features</h3>
        
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={localConfig?.gallery?.clickToView || false}
            onChange={e => handleConfigUpdate('gallery.clickToView', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label className="text-sm font-medium text-gray-700">Click to View (Lightbox)</label>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={localConfig?.gallery?.showViewAllButton || false}
            onChange={e => handleConfigUpdate('gallery.showViewAllButton', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label className="text-sm font-medium text-gray-700">Show View All Button</label>
        </div>
        
        {localConfig?.gallery?.showViewAllButton && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">View All Button Text</label>
              <input
                type="text"
                value={localConfig?.gallery?.viewAllButtonText || ''}
                onChange={(e) => handleConfigUpdate('gallery.viewAllButtonText', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="View All Images"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">View All Link</label>
              <input
                type="text"
                value={localConfig?.gallery?.viewAllLink || ''}
                onChange={(e) => handleConfigUpdate('gallery.viewAllLink', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="/gallery"
              />
            </div>
          </>
        )}
      </div>

      {/* Filtering */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Filtering</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category Filter</label>
          <input
            type="text"
            value={localConfig?.gallery?.categoryFilter || ''}
            onChange={(e) => handleConfigUpdate('gallery.categoryFilter', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Filter by category (optional)"
          />
        </div>
      </div>

      {/* Styling */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Styling</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={localConfig?.gallery?.backgroundColor || 'background'}
            onChange={e => handleConfigUpdate('gallery.backgroundColor', e.target.value)}
          >
            <option value="background">Background</option>
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="offwhite">Off White</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={localConfig?.gallery?.textColor || 'foreground'}
            onChange={e => handleConfigUpdate('gallery.textColor', e.target.value)}
          >
            <option value="foreground">Foreground</option>
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="background">Background</option>
            <option value="offwhite">Off White</option>
            <option value="black">Black</option>
          </select>
        </div>
      </div>
    </div>
  );





  const renderStoryConfig = () => (
    <div className="space-y-6">
      {/* Configuration Header */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900">Configuration</h3>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Story Title
        </label>
        <input
          type="text"
          value={localConfig?.story?.storyTitle || ''}
          onChange={(e) => handleConfigUpdate('story.storyTitle', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Our Story"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Story Content
        </label>
        <textarea
          value={localConfig?.story?.storyContent || ''}
          onChange={(e) => handleConfigUpdate('story.storyContent', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Tell your story here..."
          rows={6}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Layout
        </label>
        <select
          value={localConfig?.story?.layout || 'text-image'}
          onChange={(e) => handleConfigUpdate('story.layout', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="text-image">Text + Image</option>
          <option value="image-text">Image + Text</option>
          <option value="text-only">Text Only</option>
          <option value="image-only">Image Only</option>
          <option value="centered">Centered</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Image Position
        </label>
        <select
          value={localConfig?.story?.imagePosition || 'right'}
          onChange={(e) => handleConfigUpdate('story.imagePosition', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="left">Left</option>
          <option value="right">Right</option>
          <option value="top">Top</option>
          <option value="bottom">Bottom</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Story Image
        </label>
        <ImageUpload
          value={localConfig?.story?.storyImage || ''}
          onChange={(value) => handleConfigUpdate('story.storyImage', value)}
          placeholder="/story-image.jpg"
          altText="Story image"
          onAltTextChange={(value) => handleConfigUpdate('story.storyImageAlt', value)}
          showAltText={true}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Image Size
        </label>
        <select
          value={localConfig?.story?.imageSize || 'medium'}
          onChange={(e) => handleConfigUpdate('story.imageSize', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
          <option value="xl">Extra Large</option>
        </select>
      </div>

      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={localConfig?.story?.showDivider || false}
            onChange={(e) => handleConfigUpdate('story.showDivider', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Show Divider</span>
        </label>
      </div>

      {localConfig?.story?.showDivider && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Divider Style
          </label>
          <select
            value={localConfig?.story?.dividerStyle || 'line'}
            onChange={(e) => handleConfigUpdate('story.dividerStyle', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="line">Line</option>
            <option value="dashed">Dashed</option>
            <option value="dotted">Dotted</option>
            <option value="wave">Wave</option>
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Background Color
        </label>
        <ColorPicker
          color={localConfig?.story?.backgroundColor || '#ffffff'}
          onChange={(value) => handleConfigUpdate('story.backgroundColor', value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Text Color
        </label>
        <ColorPicker
          color={localConfig?.story?.textColor || '#000000'}
          onChange={(value) => handleConfigUpdate('story.textColor', value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Padding
        </label>
        <select
          value={localConfig?.story?.padding || 'medium'}
          onChange={(e) => handleConfigUpdate('story.padding', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
          <option value="xl">Extra Large</option>
        </select>
      </div>
    </div>
  );

  const renderCommunitySpotlightConfig = () => (
    <div className="space-y-6">
      {/* Configuration Header */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900">Configuration</h3>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          type="text"
          value={localConfig?.communitySpotlight?.title || ''}
          onChange={(e) => handleConfigUpdate('communitySpotlight.title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Community Spotlight"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          value={localConfig?.communitySpotlight?.description || ''}
          onChange={(e) => handleConfigUpdate('communitySpotlight.description', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Description of the community spotlight section"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Layout
        </label>
        <select
          value={localConfig?.communitySpotlight?.layout || 'grid'}
          onChange={(e) => handleConfigUpdate('communitySpotlight.layout', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="grid">Grid</option>
          <option value="list">List</option>
          <option value="carousel">Carousel</option>
          <option value="masonry">Masonry</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Columns
        </label>
        <select
          value={localConfig?.communitySpotlight?.columns || 3}
          onChange={(e) => handleConfigUpdate('communitySpotlight.columns', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value={1}>1 Column</option>
          <option value={2}>2 Columns</option>
          <option value={3}>3 Columns</option>
          <option value={4}>4 Columns</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Spotlight Items
        </label>
        <div className="space-y-3">
          {(localConfig?.communitySpotlight?.spotlightItems || []).map((item: any, index: number) => (
            <div key={index} className="p-3 border border-gray-200 rounded-lg bg-white space-y-2">
              <input
                type="text"
                value={item.title || ''}
                onChange={(e) => {
                  const newList = [...(localConfig?.communitySpotlight?.spotlightItems || [])];
                  newList[index] = { ...item, title: e.target.value };
                  handleConfigUpdate('communitySpotlight.spotlightItems', newList);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Item Title"
              />
              <textarea
                value={item.description || ''}
                onChange={(e) => {
                  const newList = [...(localConfig?.communitySpotlight?.spotlightItems || [])];
                  newList[index] = { ...item, description: e.target.value };
                  handleConfigUpdate('communitySpotlight.spotlightItems', newList);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Item Description"
                rows={2}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={item.category || ''}
                  onChange={(e) => {
                    const newList = [...(localConfig?.communitySpotlight?.spotlightItems || [])];
                    newList[index] = { ...item, category: e.target.value };
                    handleConfigUpdate('communitySpotlight.spotlightItems', newList);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Category"
                />
                <input
                  type="text"
                  value={item.link || ''}
                  onChange={(e) => {
                    const newList = [...(localConfig?.communitySpotlight?.spotlightItems || [])];
                    newList[index] = { ...item, link: e.target.value };
                    handleConfigUpdate('communitySpotlight.spotlightItems', newList);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Link URL"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Item Image
                </label>
                <ImageUpload
                  value={item.image || ''}
                  onChange={(value) => {
                    const newList = [...(localConfig?.communitySpotlight?.spotlightItems || [])];
                    newList[index] = { ...item, image: value };
                    handleConfigUpdate('communitySpotlight.spotlightItems', newList);
                  }}
                  placeholder="/spotlight-image.jpg"
                  altText={`${item.title || 'Spotlight'} image`}
                  onAltTextChange={(value) => {
                    const newList = [...(localConfig?.communitySpotlight?.spotlightItems || [])];
                    newList[index] = { ...item, imageAltText: value };
                    handleConfigUpdate('communitySpotlight.spotlightItems', newList);
                  }}
                  showAltText={false}
                />
              </div>
              <button
                onClick={() => {
                  const newList = (localConfig?.communitySpotlight?.spotlightItems || []).filter((_: any, i: number) => i !== index);
                  handleConfigUpdate('communitySpotlight.spotlightItems', newList);
                }}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
              >
                Remove Item
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              const newList = [...(localConfig?.communitySpotlight?.spotlightItems || []), { 
                id: Date.now().toString(),
                title: '', 
                description: '', 
                image: '',
                link: '',
                category: ''
              }];
              handleConfigUpdate('communitySpotlight.spotlightItems', newList);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium"
          >
            Add Spotlight Item
          </button>
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Background Color
        </label>
        <ColorPicker
          color={localConfig?.communitySpotlight?.backgroundColor || '#ffffff'}
          onChange={(value) => handleConfigUpdate('communitySpotlight.backgroundColor', value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Text Color
        </label>
        <ColorPicker
          color={localConfig?.communitySpotlight?.textColor || '#000000'}
          onChange={(value) => handleConfigUpdate('communitySpotlight.textColor', value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Padding
        </label>
        <select
          value={localConfig?.communitySpotlight?.padding || 'medium'}
          onChange={(e) => handleConfigUpdate('communitySpotlight.padding', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="small">Small</option>
          <option value="medium">Medium</option>
          <option value="large">Large</option>
          <option value="xl">Extra Large</option>
        </select>
      </div>
    </div>
  );
      


  const renderGridConfig = () => (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={localConfig?.grid?.title || ''}
            onChange={(e) => handleConfigUpdate('grid.title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Grid Section"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={localConfig?.grid?.description || ''}
            onChange={(e) => handleConfigUpdate('grid.description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Description of the grid section"
            rows={3}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Featured Label
          </label>
          <input
            type="text"
            value={localConfig?.grid?.featuredLabel || ''}
            onChange={(e) => handleConfigUpdate('grid.featuredLabel', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Featured"
          />
        </div>
      </div>

      {/* Grid Items */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Grid Items</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Items</label>
          {(localConfig?.grid?.items || []).map((item: any, idx: number) => (
            <div key={idx} className="mb-4 p-4 border rounded-lg bg-gray-50 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="Title"
                  value={item.title || ''}
                  onChange={e => {
                    const items = [...(localConfig.grid?.items || [])];
                    items[idx] = { ...items[idx], title: e.target.value };
                    handleConfigUpdate('grid.items', items);
                  }}
                />
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="Category"
                  value={item.category || ''}
                  onChange={e => {
                    const items = [...(localConfig.grid?.items || [])];
                    items[idx] = { ...items[idx], category: e.target.value };
                    handleConfigUpdate('grid.items', items);
                  }}
                />
              </div>
              
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="Description"
                value={item.description || ''}
                onChange={e => {
                  const items = [...(localConfig.grid?.items || [])];
                  items[idx] = { ...items[idx], description: e.target.value };
                  handleConfigUpdate('grid.items', items);
                }}
                rows={2}
              />
              
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                   <ImageUpload
                     value={item.image || ''}
                     onChange={(value) => {
                       const items = [...(localConfig.grid?.items || [])];
                       items[idx] = { ...items[idx], image: value };
                       handleConfigUpdate('grid.items', items);
                     }}
                     placeholder="/placeholder-image.jpg"
                     altText={item.imageAlt || ''}
                     onAltTextChange={(value) => {
                       const items = [...(localConfig.grid?.items || [])];
                       items[idx] = { ...items[idx], imageAlt: value };
                       handleConfigUpdate('grid.items', items);
                     }}
                     showAltText={true}
                   />
                 </div>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="Link URL"
                  value={item.link || ''}
                  onChange={e => {
                    const items = [...(localConfig.grid?.items || [])];
                    items[idx] = { ...items[idx], link: e.target.value };
                    handleConfigUpdate('grid.items', items);
                  }}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="Link Text (e.g., Visit Website)"
                  value={item.linkText || ''}
                  onChange={e => {
                    const items = [...(localConfig.grid?.items || [])];
                    items[idx] = { ...items[idx], linkText: e.target.value };
                    handleConfigUpdate('grid.items', items);
                  }}
                />
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="Price (e.g., $50/hour)"
                  value={item.price || ''}
                  onChange={e => {
                    const items = [...(localConfig.grid?.items || [])];
                    items[idx] = { ...items[idx], price: e.target.value };
                    handleConfigUpdate('grid.items', items);
                  }}
                />
                <input
                  type="number"
                  min="1"
                  max="5"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  placeholder="Rating (1-5)"
                  value={item.rating || ''}
                  onChange={e => {
                    const items = [...(localConfig.grid?.items || [])];
                    items[idx] = { ...items[idx], rating: e.target.value ? Number(e.target.value) : undefined };
                    handleConfigUpdate('grid.items', items);
                  }}
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={item.featured || false}
                    onChange={e => {
                      const items = [...(localConfig.grid?.items || [])];
                      items[idx] = { ...items[idx], featured: e.target.checked };
                      handleConfigUpdate('grid.items', items);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Featured</span>
                </label>
              </div>
              
              <button
                className="text-xs text-red-600 hover:underline"
                onClick={e => {
                  e.preventDefault();
                  const items = [...(localConfig.grid?.items || [])];
                  items.splice(idx, 1);
                  handleConfigUpdate('grid.items', items);
                }}
              >Remove Item</button>
            </div>
          ))}
          <button
            className="mt-2 px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            onClick={e => {
              e.preventDefault();
              const items = [...(localConfig.grid?.items || [])];
              items.push({ 
                title: '', 
                description: '', 
                image: '', 
                imageAlt: '',
                link: '', 
                linkText: '', 
                category: '', 
                featured: false,
                price: '',
                rating: undefined,
                tags: []
              });
              handleConfigUpdate('grid.items', items);
            }}
          >Add Item</button>
        </div>
      </div>

      {/* Layout & Display */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Layout & Display</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Layout</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={localConfig?.grid?.layout || 'grid'}
            onChange={e => handleConfigUpdate('grid.layout', e.target.value)}
          >
            <option value="grid">Grid</option>
            <option value="list">List</option>
            <option value="carousel">Carousel</option>
            <option value="masonry">Masonry</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Columns</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={localConfig?.grid?.columns || 3}
            onChange={e => handleConfigUpdate('grid.columns', Number(e.target.value))}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={5}>5</option>
            <option value={6}>6</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image Size</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={localConfig?.grid?.imageSize || 'medium'}
            onChange={e => handleConfigUpdate('grid.imageSize', e.target.value)}
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="xl">Extra Large</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Padding</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={localConfig?.grid?.padding || 'medium'}
            onChange={e => handleConfigUpdate('grid.padding', e.target.value)}
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="xl">Extra Large</option>
            <option value="2xl">2X Large</option>
          </select>
        </div>
      </div>

      {/* Display Options */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Display Options</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={localConfig?.grid?.showImages || false}
              onChange={e => handleConfigUpdate('grid.showImages', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Show Images</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={localConfig?.grid?.showRatings || false}
              onChange={e => handleConfigUpdate('grid.showRatings', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Show Ratings</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={localConfig?.grid?.showTags || false}
              onChange={e => handleConfigUpdate('grid.showTags', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Show Tags</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={localConfig?.grid?.showCtaButton || false}
              onChange={e => handleConfigUpdate('grid.showCtaButton', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Show CTA Button</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={localConfig?.grid?.showViewAllButton || false}
              onChange={e => handleConfigUpdate('grid.showViewAllButton', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Show View All Button</span>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      {localConfig?.grid?.showCtaButton && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Call to Action</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CTA Button Text</label>
            <input
              type="text"
              value={localConfig?.grid?.ctaButtonText || ''}
              onChange={(e) => handleConfigUpdate('grid.ctaButtonText', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Get Started"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CTA Link</label>
            <input
              type="text"
              value={localConfig?.grid?.ctaLink || ''}
              onChange={(e) => handleConfigUpdate('grid.ctaLink', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="/contact"
            />
          </div>
        </div>
      )}

      {/* View All Button */}
      {localConfig?.grid?.showViewAllButton && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">View All Button</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">View All Button Text</label>
            <input
              type="text"
              value={localConfig?.grid?.viewAllButtonText || ''}
              onChange={(e) => handleConfigUpdate('grid.viewAllButtonText', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="View All Items"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">View All Link</label>
            <input
              type="text"
              value={localConfig?.grid?.viewAllLink || ''}
              onChange={(e) => handleConfigUpdate('grid.viewAllLink', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="/grid"
            />
          </div>
        </div>
      )}

      {/* Filtering */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Filtering</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category Filter</label>
          <input
            type="text"
            value={localConfig?.grid?.categoryFilter || ''}
            onChange={(e) => handleConfigUpdate('grid.categoryFilter', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Filter by category (optional)"
          />
        </div>
      </div>

      {/* Styling */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Styling</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={localConfig?.grid?.backgroundColor || 'background'}
            onChange={e => handleConfigUpdate('grid.backgroundColor', e.target.value)}
          >
            <option value="background">Background</option>
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="offwhite">Off White</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={localConfig?.grid?.textColor || 'foreground'}
            onChange={e => handleConfigUpdate('grid.textColor', e.target.value)}
          >
            <option value="foreground">Foreground</option>
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="background">Background</option>
            <option value="offwhite">Off White</option>
            <option value="black">Black</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Card Background Color</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={localConfig?.grid?.cardBackgroundColor || 'offwhite'}
            onChange={e => handleConfigUpdate('grid.cardBackgroundColor', e.target.value)}
          >
            <option value="offwhite">Off White</option>
            <option value="white">White</option>
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="background">Background</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderHoursLocationConfig = () => (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Main Title
          </label>
          <input
            type="text"
            value={localConfig?.hoursLocation?.title || ''}
            onChange={(e) => handleConfigUpdate('hoursLocation.title', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Visit Us"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={localConfig?.hoursLocation?.description || ''}
            onChange={(e) => handleConfigUpdate('hoursLocation.description', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Welcome to our store..."
            rows={2}
          />
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Contact Information</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Address
          </label>
          <textarea
            value={localConfig?.hoursLocation?.address || ''}
            onChange={(e) => handleConfigUpdate('hoursLocation.address', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="123 Main St, City, State 12345"
            rows={2}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            type="text"
            value={localConfig?.hoursLocation?.phone || ''}
            onChange={(e) => handleConfigUpdate('hoursLocation.phone', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="(555) 123-4567"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={localConfig?.hoursLocation?.email || ''}
            onChange={(e) => handleConfigUpdate('hoursLocation.email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="info@porchrecords.com"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Parking Information
          </label>
          <textarea
            value={localConfig?.hoursLocation?.parkingInfo || ''}
            onChange={(e) => handleConfigUpdate('hoursLocation.parkingInfo', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Free parking available in rear lot"
            rows={2}
          />
        </div>
      </div>

      {/* Section Titles */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Section Titles</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hours Section Title
          </label>
          <input
            type="text"
            value={localConfig?.hoursLocation?.hoursTitle || ''}
            onChange={(e) => handleConfigUpdate('hoursLocation.hoursTitle', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Business Hours"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location Section Title
          </label>
          <input
            type="text"
            value={localConfig?.hoursLocation?.locationTitle || ''}
            onChange={(e) => handleConfigUpdate('hoursLocation.locationTitle', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Visit Us"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Map Section Title
          </label>
          <input
            type="text"
            value={localConfig?.hoursLocation?.mapTitle || ''}
            onChange={(e) => handleConfigUpdate('hoursLocation.mapTitle', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Find Us"
          />
        </div>
      </div>

      {/* Business Hours */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Business Hours</h3>
        
        <div className="space-y-3">
          {[
            { day: 'Monday', key: 'monday' },
            { day: 'Tuesday', key: 'tuesday' },
            { day: 'Wednesday', key: 'wednesday' },
            { day: 'Thursday', key: 'thursday' },
            { day: 'Friday', key: 'friday' },
            { day: 'Saturday', key: 'saturday' },
            { day: 'Sunday', key: 'sunday' }
          ].map(({ day, key }) => {
            const hours = localConfig?.hoursLocation?.hours || [];
            const dayHours = hours.find((h: any) => h.day === day) || { day, open: '', close: '', closed: false };
            
            return (
              <div key={key} className="flex items-center space-x-3 p-3 border rounded-lg bg-gray-50">
                <div className="w-20 font-medium text-sm">{day}</div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={dayHours.closed || false}
                    onChange={(e) => {
                      const updatedHours = [...hours];
                      const existingIndex = updatedHours.findIndex((h: any) => h.day === day);
                      
                      if (existingIndex >= 0) {
                        updatedHours[existingIndex] = { ...updatedHours[existingIndex], closed: e.target.checked };
                      } else {
                        updatedHours.push({ day, open: '', close: '', closed: e.target.checked });
                      }
                      
                      handleConfigUpdate('hoursLocation.hours', updatedHours);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">Closed</span>
                </div>
                
                {!dayHours.closed && (
                  <>
                    <input
                      type="time"
                      value={dayHours.open || ''}
                      onChange={(e) => {
                        const updatedHours = [...hours];
                        const existingIndex = updatedHours.findIndex((h: any) => h.day === day);
                        
                        if (existingIndex >= 0) {
                          updatedHours[existingIndex] = { ...updatedHours[existingIndex], open: e.target.value };
                        } else {
                          updatedHours.push({ day, open: e.target.value, close: '', closed: false });
                        }
                        
                        handleConfigUpdate('hoursLocation.hours', updatedHours);
                      }}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                    <span className="text-sm text-gray-500">to</span>
                    <input
                      type="time"
                      value={dayHours.close || ''}
                      onChange={(e) => {
                        const updatedHours = [...hours];
                        const existingIndex = updatedHours.findIndex((h: any) => h.day === day);
                        
                        if (existingIndex >= 0) {
                          updatedHours[existingIndex] = { ...updatedHours[existingIndex], close: e.target.value };
                        } else {
                          updatedHours.push({ day, open: '', close: e.target.value, closed: false });
                        }
                        
                        handleConfigUpdate('hoursLocation.hours', updatedHours);
                      }}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Special Hours Notice
          </label>
          <textarea
            value={localConfig?.hoursLocation?.specialHoursNotice || ''}
            onChange={(e) => handleConfigUpdate('hoursLocation.specialHoursNotice', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Holiday hours may vary. Call ahead for confirmation."
            rows={2}
          />
        </div>
      </div>

      {/* Display Options */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Display Options</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={localConfig?.hoursLocation?.showHours !== false}
                onChange={(e) => handleConfigUpdate('hoursLocation.showHours', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Show Hours Section</span>
            </label>
          </div>
          
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={localConfig?.hoursLocation?.showLocation !== false}
                onChange={(e) => handleConfigUpdate('hoursLocation.showLocation', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Show Location Section</span>
            </label>
          </div>
          
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={localConfig?.hoursLocation?.mapEmbed || false}
                onChange={(e) => handleConfigUpdate('hoursLocation.mapEmbed', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Show Map Embed</span>
            </label>
          </div>
          
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={localConfig?.hoursLocation?.showDirectionsButton || false}
                onChange={(e) => handleConfigUpdate('hoursLocation.showDirectionsButton', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Show Directions Button</span>
            </label>
          </div>
          
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={localConfig?.hoursLocation?.showMapButton || false}
                onChange={(e) => handleConfigUpdate('hoursLocation.showMapButton', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Show Map Button</span>
            </label>
          </div>
        </div>
      </div>

      {/* Layout & Styling */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Layout & Styling</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Layout
          </label>
          <select
            value={localConfig?.hoursLocation?.layout || 'side-by-side'}
            onChange={(e) => handleConfigUpdate('hoursLocation.layout', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="side-by-side">Side by Side</option>
            <option value="stacked">Stacked</option>
            <option value="compact">Compact</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Padding
          </label>
          <select
            value={localConfig?.hoursLocation?.padding || 'medium'}
            onChange={(e) => handleConfigUpdate('hoursLocation.padding', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="xl">Extra Large</option>
            <option value="2xl">2X Large</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Background Color
          </label>
          <select
            value={localConfig?.hoursLocation?.backgroundColor || 'white'}
            onChange={(e) => handleConfigUpdate('hoursLocation.backgroundColor', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="white">White</option>
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="background">Background</option>
            <option value="offwhite">Off White</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Text Color
          </label>
          <select
            value={localConfig?.hoursLocation?.textColor || 'inherit'}
            onChange={(e) => handleConfigUpdate('hoursLocation.textColor', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="inherit">Inherit</option>
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="background">Background</option>
            <option value="offwhite">Off White</option>
            <option value="black">Black</option>
          </select>
        </div>
      </div>

      {/* Map Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Map Settings</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Map URL (Optional)
          </label>
          <input
            type="text"
            value={localConfig?.hoursLocation?.mapUrl || ''}
            onChange={(e) => handleConfigUpdate('hoursLocation.mapUrl', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://maps.google.com/..."
          />
          <div className="text-xs text-gray-500 mt-1 space-y-1">
            <p>• Leave empty to use address for Google Maps integration</p>
            <p>• For custom maps, use a simple Google Maps URL like:</p>
            <p className="font-mono text-xs bg-gray-100 p-1 rounded">https://maps.google.com/?q=Summertown+Studio</p>
            <p>• Or extract coordinates from complex URLs and use:</p>
            <p className="font-mono text-xs bg-gray-100 p-1 rounded">https://maps.google.com/?q=-34.9993404,138.5236074</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStudioOverviewConfig = () => (
    <div className="space-y-6">
      {/* Configuration Header */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900">Configuration</h3>
      </div>

      {/* Studio Image URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Studio Image URL
        </label>
        <input
          type="text"
          value={localConfig?.studioOverview?.studioImage || ''}
          onChange={(e) => handleConfigUpdate('studioOverview.studioImage', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="/studio-image.jpg"
        />
      </div>
      
      {/* Equipment List */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Equipment List
        </label>
        <div className="space-y-3">
          {(localConfig?.studioOverview?.equipment || []).map((item: any, index: number) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg bg-white space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={item.name || ''}
                  onChange={(e) => {
                    const newList = [...(localConfig?.studioOverview?.equipment || [])];
                    newList[index] = { ...item, name: e.target.value };
                    handleConfigUpdate('studioOverview.equipment', newList);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Equipment name"
                />
                <input
                  type="text"
                  value={item.category || ''}
                  onChange={(e) => {
                    const newList = [...(localConfig?.studioOverview?.equipment || [])];
                    newList[index] = { ...item, category: e.target.value };
                    handleConfigUpdate('studioOverview.equipment', newList);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Category"
                />
              </div>
              <textarea
                value={item.description || ''}
                onChange={(e) => {
                  const newList = [...(localConfig?.studioOverview?.equipment || [])];
                  newList[index] = { ...item, description: e.target.value };
                  handleConfigUpdate('studioOverview.equipment', newList);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Description"
                rows={2}
              />
              <input
                type="text"
                value={item.image || ''}
                onChange={(e) => {
                  const newList = [...(localConfig?.studioOverview?.equipment || [])];
                  newList[index] = { ...item, image: e.target.value };
                  handleConfigUpdate('studioOverview.equipment', newList);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Image URL (optional)"
              />
              <button
                onClick={() => {
                  const newList = (localConfig?.studioOverview?.equipment || []).filter((_: any, i: number) => i !== index);
                  handleConfigUpdate('studioOverview.equipment', newList);
                }}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
              >
                Remove Equipment
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              const newList = [...(localConfig?.studioOverview?.equipment || []), { 
                id: Date.now().toString(),
                name: '', 
                category: '', 
                description: '', 
                image: '' 
              }];
              handleConfigUpdate('studioOverview.equipment', newList);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium"
          >
            Add Equipment
          </button>
        </div>
      </div>
      
      {/* Services */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Services
        </label>
        <div className="space-y-3">
          {(localConfig?.studioOverview?.services || []).map((service: any, index: number) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg bg-white space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={service.name || ''}
                  onChange={(e) => {
                    const newList = [...(localConfig?.studioOverview?.services || [])];
                    newList[index] = { ...service, name: e.target.value };
                    handleConfigUpdate('studioOverview.services', newList);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Service name"
                />
                <input
                  type="text"
                  value={service.price || ''}
                  onChange={(e) => {
                    const newList = [...(localConfig?.studioOverview?.services || [])];
                    newList[index] = { ...service, price: e.target.value };
                    handleConfigUpdate('studioOverview.services', newList);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Price (e.g., $75/hour)"
                />
              </div>
              <textarea
                value={service.description || ''}
                onChange={(e) => {
                  const newList = [...(localConfig?.studioOverview?.services || [])];
                  newList[index] = { ...service, description: e.target.value };
                  handleConfigUpdate('studioOverview.services', newList);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Service description"
                rows={2}
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={service.duration || ''}
                  onChange={(e) => {
                    const newList = [...(localConfig?.studioOverview?.services || [])];
                    newList[index] = { ...service, duration: e.target.value };
                    handleConfigUpdate('studioOverview.services', newList);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Duration (e.g., 2-8 hours)"
                />
                <input
                  type="text"
                  value={service.icon || ''}
                  onChange={(e) => {
                    const newList = [...(localConfig?.studioOverview?.services || [])];
                    newList[index] = { ...service, icon: e.target.value };
                    handleConfigUpdate('studioOverview.services', newList);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Icon (emoji or URL)"
                />
              </div>
              <button
                onClick={() => {
                  const newList = (localConfig?.studioOverview?.services || []).filter((_: any, i: number) => i !== index);
                  handleConfigUpdate('studioOverview.services', newList);
                }}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
              >
                Remove Service
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              const newList = [...(localConfig?.studioOverview?.services || []), { 
                id: Date.now().toString(),
                name: '', 
                description: '', 
                price: '', 
                duration: '', 
                icon: '' 
              }];
              handleConfigUpdate('studioOverview.services', newList);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium"
          >
            Add Service
          </button>
        </div>
      </div>
      
      {/* Booking Link */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Booking Link
        </label>
        <input
          type="text"
          value={localConfig?.studioOverview?.bookingLink || ''}
          onChange={(e) => handleConfigUpdate('studioOverview.bookingLink', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="https://booking.example.com"
        />
      </div>
      
      {/* Testimonials */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Testimonials
        </label>
        <div className="space-y-3">
          {(localConfig?.studioOverview?.testimonials || []).map((testimonial: any, index: number) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg bg-white space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={testimonial.name || ''}
                  onChange={(e) => {
                    const newList = [...(localConfig?.studioOverview?.testimonials || [])];
                    newList[index] = { ...testimonial, name: e.target.value };
                    handleConfigUpdate('studioOverview.testimonials', newList);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Name"
                />
                <input
                  type="text"
                  value={testimonial.role || ''}
                  onChange={(e) => {
                    const newList = [...(localConfig?.studioOverview?.testimonials || [])];
                    newList[index] = { ...testimonial, role: e.target.value };
                    handleConfigUpdate('studioOverview.testimonials', newList);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Role/Title"
                />
              </div>
              <textarea
                value={testimonial.text || ''}
                onChange={(e) => {
                  const newList = [...(localConfig?.studioOverview?.testimonials || [])];
                  newList[index] = { ...testimonial, text: e.target.value };
                  handleConfigUpdate('studioOverview.testimonials', newList);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Testimonial text"
                rows={3}
              />
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={testimonial.rating || 5}
                  onChange={(e) => {
                    const newList = [...(localConfig?.studioOverview?.testimonials || [])];
                    newList[index] = { ...testimonial, rating: parseInt(e.target.value) };
                    handleConfigUpdate('studioOverview.testimonials', newList);
                  }}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Rating"
                />
                <span className="text-sm text-gray-500">Rating (1-5)</span>
                <button
                  onClick={() => {
                    const newList = (localConfig?.studioOverview?.testimonials || []).filter((_: any, i: number) => i !== index);
                    handleConfigUpdate('studioOverview.testimonials', newList);
                  }}
                  className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                >
                  Remove Testimonial
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={() => {
              const newList = [...(localConfig?.studioOverview?.testimonials || []), { 
                id: Date.now().toString(),
                name: '', 
                role: '', 
                text: '', 
                rating: 5 
              }];
              handleConfigUpdate('studioOverview.testimonials', newList);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium"
          >
            Add Testimonial
          </button>
        </div>
      </div>

      {/* Display Options */}
      <div className="border-t border-gray-200 pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Display Options</h4>
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={localConfig?.studioOverview?.showEquipment !== false}
              onChange={(e) => handleConfigUpdate('studioOverview.showEquipment', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Show Equipment Section</span>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={localConfig?.studioOverview?.showServices !== false}
              onChange={(e) => handleConfigUpdate('studioOverview.showServices', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Show Services Section</span>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={localConfig?.studioOverview?.showTestimonials !== false}
              onChange={(e) => handleConfigUpdate('studioOverview.showTestimonials', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Show Testimonials Section</span>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={localConfig?.studioOverview?.showBookingButton !== false}
              onChange={(e) => handleConfigUpdate('studioOverview.showBookingButton', e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Show Booking Button</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderShowsConfig = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Show Type
        </label>
        <select
          value={localConfig?.shows?.showType || 'upcoming'}
          onChange={(e) => handleConfigUpdate('shows.showType', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="upcoming">Upcoming Shows</option>
          <option value="past">Past Shows</option>
          <option value="all">All Shows</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Layout
        </label>
        <select
          value={localConfig?.shows?.layout || 'grid'}
          onChange={(e) => handleConfigUpdate('shows.layout', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="grid">Grid</option>
          <option value="list">List</option>
          <option value="carousel">Carousel</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Shows Per Page
        </label>
        <input
          type="number"
          min="1"
          max="20"
          value={localConfig?.shows?.showsPerPage || 6}
          onChange={(e) => handleConfigUpdate('shows.showsPerPage', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={localConfig?.shows?.showImages || true}
            onChange={(e) => handleConfigUpdate('shows.showImages', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Show Images</span>
        </label>
      </div>
      
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={localConfig?.shows?.showVenue || true}
            onChange={(e) => handleConfigUpdate('shows.showVenue', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Show Venue</span>
        </label>
      </div>
      
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={localConfig?.shows?.showTicketLink || true}
            onChange={(e) => handleConfigUpdate('shows.showTicketLink', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Show Ticket Links</span>
        </label>
      </div>
    </div>
  );



  const renderTestimonialsConfig = () => (
    <div className="space-y-6">
      {/* Configuration Header */}
      <div className="border-b border-gray-200 pb-4">
        <h3 className="text-lg font-semibold text-gray-900">Configuration</h3>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Layout
        </label>
        <select
          value={localConfig?.testimonials?.layout || 'grid'}
          onChange={(e) => handleConfigUpdate('testimonials.layout', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="grid">Grid</option>
          <option value="carousel">Carousel</option>
          <option value="masonry">Masonry</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Columns
        </label>
        <select
          value={localConfig?.testimonials?.columns || 3}
          onChange={(e) => handleConfigUpdate('testimonials.columns', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value={1}>1 Column</option>
          <option value={2}>2 Columns</option>
          <option value={3}>3 Columns</option>
          <option value={4}>4 Columns</option>
        </select>
      </div>
      
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={localConfig?.testimonials?.showRatings || true}
            onChange={(e) => handleConfigUpdate('testimonials.showRatings', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Show Ratings</span>
        </label>
      </div>
      
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={localConfig?.testimonials?.showAvatars || true}
            onChange={(e) => handleConfigUpdate('testimonials.showAvatars', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Show Profile Pictures</span>
        </label>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Testimonials
        </label>
        <div className="space-y-4">
          {(localConfig?.testimonials?.testimonials || []).map((testimonial: any, index: number) => (
            <div key={index} className="p-4 border border-gray-200 rounded-lg bg-white space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={testimonial.name || ''}
                  onChange={(e) => {
                    const newList = [...(localConfig?.testimonials?.testimonials || [])];
                    newList[index] = { ...testimonial, name: e.target.value };
                    handleConfigUpdate('testimonials.testimonials', newList);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Name"
                />
                <input
                  type="text"
                  value={testimonial.role || ''}
                  onChange={(e) => {
                    const newList = [...(localConfig?.testimonials?.testimonials || [])];
                    newList[index] = { ...testimonial, role: e.target.value };
                    handleConfigUpdate('testimonials.testimonials', newList);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Role/Title"
                />
              </div>
              <textarea
                value={testimonial.text || ''}
                onChange={(e) => {
                  const newList = [...(localConfig?.testimonials?.testimonials || [])];
                  newList[index] = { ...testimonial, text: e.target.value };
                  handleConfigUpdate('testimonials.testimonials', newList);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Testimonial text"
                rows={3}
              />
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={testimonial.rating || 5}
                  onChange={(e) => {
                    const newList = [...(localConfig?.testimonials?.testimonials || [])];
                    newList[index] = { ...testimonial, rating: parseInt(e.target.value) };
                    handleConfigUpdate('testimonials.testimonials', newList);
                  }}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Rating"
                />
                <span className="text-sm text-gray-500">Rating (1-5)</span>
              </div>
              
              {/* Profile Picture Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Picture
                </label>
                <ImageUpload
                  value={testimonial.avatar || ''}
                  onChange={(value) => {
                    const newList = [...(localConfig?.testimonials?.testimonials || [])];
                    newList[index] = { ...testimonial, avatar: value };
                    handleConfigUpdate('testimonials.testimonials', newList);
                  }}
                  placeholder="/profile-picture.jpg"
                  altText={`${testimonial.name || 'Testimonial'} profile picture`}
                  onAltTextChange={(value) => {
                    const newList = [...(localConfig?.testimonials?.testimonials || [])];
                    newList[index] = { ...testimonial, avatarAltText: value };
                    handleConfigUpdate('testimonials.testimonials', newList);
                  }}
                  showAltText={false}
                />
              </div>
              
              <button
                onClick={() => {
                  const newList = (localConfig?.testimonials?.testimonials || []).filter((_: any, i: number) => i !== index);
                  handleConfigUpdate('testimonials.testimonials', newList);
                }}
                className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm"
              >
                Remove Testimonial
              </button>
            </div>
          ))}
          <button
            onClick={() => {
              const newList = [...(localConfig?.testimonials?.testimonials || []), { 
                id: Date.now().toString(),
                name: '', 
                role: '', 
                text: '', 
                rating: 5, 
                avatar: '' 
              }];
              handleConfigUpdate('testimonials.testimonials', newList);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 font-medium"
          >
            Add Testimonial
          </button>
        </div>
      </div>
    </div>
  );

  const renderCtaConfig = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          CTA Title
        </label>
        <input
          type="text"
          value={localConfig?.cta?.ctaTitle || ''}
          onChange={(e) => handleConfigUpdate('cta.ctaTitle', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Call to Action Title"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          CTA Description
        </label>
        <textarea
          value={localConfig?.cta?.ctaDescription || ''}
          onChange={(e) => handleConfigUpdate('cta.ctaDescription', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          rows={3}
          placeholder="Call to action description"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Button Text
        </label>
        <input
          type="text"
          value={localConfig?.cta?.buttonText || ''}
          onChange={(e) => handleConfigUpdate('cta.buttonText', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Get Started"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Button Link
        </label>
        <input
          type="text"
          value={localConfig?.cta?.buttonLink || ''}
          onChange={(e) => handleConfigUpdate('cta.buttonLink', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="/contact"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Button Style
        </label>
        <select
          value={localConfig?.cta?.buttonStyle || 'primary'}
          onChange={(e) => handleConfigUpdate('cta.buttonStyle', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="primary">Primary</option>
          <option value="secondary">Secondary</option>
          <option value="outline">Outline</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Background Color
        </label>
        <input
          type="color"
          value={localConfig?.cta?.backgroundColor || '#ffffff'}
          onChange={(e) => handleConfigUpdate('cta.backgroundColor', e.target.value)}
          className="w-full h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Text Color
        </label>
        <input
          type="color"
          value={localConfig?.cta?.textColor || '#000000'}
          onChange={(e) => handleConfigUpdate('cta.textColor', e.target.value)}
          className="w-full h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Layout
        </label>
        <select
          value={localConfig?.cta?.layout || 'center'}
          onChange={(e) => handleConfigUpdate('cta.layout', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="center">Center</option>
          <option value="left">Left</option>
          <option value="right">Right</option>
          <option value="split">Split</option>
        </select>
      </div>
    </div>
  );

  const renderDividerConfig = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Divider Style
        </label>
        <select
          value={localConfig?.divider?.style || 'line'}
          onChange={(e) => handleConfigUpdate('divider.style', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="line">Line</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
          <option value="double">Double</option>
          <option value="gradient">Gradient</option>
          <option value="wave">Wave</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Thickness
        </label>
        <select
          value={localConfig?.divider?.thickness || 'medium'}
          onChange={(e) => handleConfigUpdate('divider.thickness', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="thin">Thin</option>
          <option value="medium">Medium</option>
          <option value="thick">Thick</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Color
        </label>
        <input
          type="color"
          value={localConfig?.divider?.color || '#e5e7eb'}
          onChange={(e) => handleConfigUpdate('divider.color', e.target.value)}
          className="w-full h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Width
        </label>
        <select
          value={localConfig?.divider?.width || 'full'}
          onChange={(e) => handleConfigUpdate('divider.width', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="full">Full Width</option>
          <option value="half">Half Width</option>
          <option value="quarter">Quarter Width</option>
          <option value="custom">Custom</option>
        </select>
      </div>
      
      {localConfig?.divider?.width === 'custom' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Custom Width (%)
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={localConfig?.divider?.customWidth || 50}
            onChange={(e) => handleConfigUpdate('divider.customWidth', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Spacing
        </label>
        <select
          value={localConfig?.divider?.spacing || 'normal'}
          onChange={(e) => handleConfigUpdate('divider.spacing', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="small">Small</option>
          <option value="normal">Normal</option>
          <option value="large">Large</option>
        </select>
      </div>
    </div>
  );

  const renderVideoConfig = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Video URL
        </label>
        <input
          type="text"
          value={localConfig?.video?.videoUrl || ''}
          onChange={(e) => handleConfigUpdate('video.videoUrl', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="https://youtube.com/watch?v=... or /video.mp4"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Video Type
        </label>
        <select
          value={localConfig?.video?.videoType || 'youtube'}
          onChange={(e) => handleConfigUpdate('video.videoType', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="youtube">YouTube</option>
          <option value="vimeo">Vimeo</option>
          <option value="mp4">MP4 File</option>
          <option value="embed">Custom Embed</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Aspect Ratio
        </label>
        <select
          value={localConfig?.video?.aspectRatio || '16:9'}
          onChange={(e) => handleConfigUpdate('video.aspectRatio', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="16:9">16:9 (Widescreen)</option>
          <option value="4:3">4:3 (Standard)</option>
          <option value="1:1">1:1 (Square)</option>
          <option value="21:9">21:9 (Ultrawide)</option>
        </select>
      </div>
      
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={localConfig?.video?.autoplay || false}
            onChange={(e) => handleConfigUpdate('video.autoplay', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Autoplay</span>
        </label>
      </div>
      
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={localConfig?.video?.controls || true}
            onChange={(e) => handleConfigUpdate('video.controls', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Show Controls</span>
        </label>
      </div>
      
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={localConfig?.video?.loop || false}
            onChange={(e) => handleConfigUpdate('video.loop', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Loop</span>
        </label>
      </div>
      
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={localConfig?.video?.muted || false}
            onChange={(e) => handleConfigUpdate('video.muted', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Muted</span>
        </label>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Poster Image (Thumbnail)
        </label>
        <input
          type="text"
          value={localConfig?.video?.poster || ''}
          onChange={(e) => handleConfigUpdate('video.poster', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="/video-thumbnail.jpg"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Video Caption
        </label>
        <input
          type="text"
          value={localConfig?.video?.caption || ''}
          onChange={(e) => handleConfigUpdate('video.caption', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Video caption"
        />
      </div>
    </div>
  );

  const renderAudioConfig = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Audio URL
        </label>
        <input
          type="text"
          value={localConfig?.audio?.audioUrl || ''}
          onChange={(e) => handleConfigUpdate('audio.audioUrl', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="/audio.mp3"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Track Title
        </label>
        <input
          type="text"
          value={localConfig?.audio?.title || ''}
          onChange={(e) => handleConfigUpdate('audio.title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Track title"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Artist
        </label>
        <input
          type="text"
          value={localConfig?.audio?.artist || ''}
          onChange={(e) => handleConfigUpdate('audio.artist', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Artist name"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Album
        </label>
        <input
          type="text"
          value={localConfig?.audio?.album || ''}
          onChange={(e) => handleConfigUpdate('audio.album', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Album name"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Album Art URL
        </label>
        <input
          type="text"
          value={localConfig?.audio?.albumArt || ''}
          onChange={(e) => handleConfigUpdate('audio.albumArt', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="/album-art.jpg"
        />
      </div>
      
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={localConfig?.audio?.autoplay || false}
            onChange={(e) => handleConfigUpdate('audio.autoplay', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Autoplay</span>
        </label>
      </div>
      
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={localConfig?.audio?.loop || false}
            onChange={(e) => handleConfigUpdate('audio.loop', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Loop</span>
        </label>
      </div>
      
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={localConfig?.audio?.showPlaylist || false}
            onChange={(e) => handleConfigUpdate('audio.showPlaylist', e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-700">Show Playlist</span>
        </label>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Player Style
        </label>
        <select
          value={localConfig?.audio?.playerStyle || 'default'}
          onChange={(e) => handleConfigUpdate('audio.playerStyle', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="default">Default</option>
          <option value="minimal">Minimal</option>
          <option value="vinyl">Vinyl</option>
          <option value="waveform">Waveform</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Background Color
        </label>
        <input
          type="color"
          value={localConfig?.audio?.backgroundColor || '#ffffff'}
          onChange={(e) => handleConfigUpdate('audio.backgroundColor', e.target.value)}
          className="w-full h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  );



  const renderSocialFeedConfig = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Feed Type
        </label>
        <select
          value={localConfig?.socialFeed?.feedType || 'instagram'}
          onChange={(e) => handleConfigUpdate('socialFeed.feedType', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="instagram">Instagram</option>
          <option value="twitter">Twitter</option>
          <option value="facebook">Facebook</option>
          <option value="youtube">YouTube</option>
          <option value="mixed">Mixed</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Account Handle
        </label>
        <input
          type="text"
          value={localConfig?.socialFeed?.handle || ''}
          onChange={(e) => handleConfigUpdate('socialFeed.handle', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="@username"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Number of Posts
        </label>
        <input
          type="number"
          min="1"
          max="20"
          value={localConfig?.socialFeed?.postCount || 6}
          onChange={(e) => handleConfigUpdate('socialFeed.postCount', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Layout
        </label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded"
          value={localConfig?.socialFeed?.layout || 'grid'}
          onChange={e => handleConfigUpdate('socialFeed.layout', e.target.value)}
        >
          <option value="grid">Grid</option>
          <option value="carousel">Carousel</option>
          <option value="masonry">Masonry</option>
          <option value="list">List</option>
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Columns
        </label>
        <select
          className="w-full px-3 py-2 border border-gray-300 rounded"
          value={localConfig?.socialFeed?.columns || 3}
          onChange={e => handleConfigUpdate('socialFeed.columns', Number(e.target.value))}
        >
          <option value={2}>2</option>
          <option value={3}>3</option>
          <option value={4}>4</option>
          <option value={5}>5</option>
        </select>
      </div>
      
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={localConfig?.socialFeed?.showCaptions || true}
            onChange={e => handleConfigUpdate('socialFeed.showCaptions', e.target.checked)}
          />
          <label className="text-sm font-medium text-gray-700">Show Captions</label>
        </label>
      </div>
      
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={localConfig?.socialFeed?.showDates || true}
            onChange={e => handleConfigUpdate('socialFeed.showDates', e.target.checked)}
          />
          <label className="text-sm font-medium text-gray-700">Show Dates</label>
        </label>
      </div>
      
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={localConfig?.socialFeed?.showLikes || true}
            onChange={e => handleConfigUpdate('socialFeed.showLikes', e.target.checked)}
          />
          <label className="text-sm font-medium text-gray-700">Show Likes</label>
        </label>
      </div>
      
      <div>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={localConfig?.socialFeed?.openInNewTab || true}
            onChange={e => handleConfigUpdate('socialFeed.openInNewTab', e.target.checked)}
          />
          <label className="text-sm font-medium text-gray-700">Open Links in New Tab</label>
        </label>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Hashtag Filter
        </label>
        <input
          type="text"
          value={localConfig?.socialFeed?.hashtag || ''}
          onChange={(e) => handleConfigUpdate('socialFeed.hashtag', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="#music"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Refresh Interval (minutes)
        </label>
        <input
          type="number"
          min="5"
          max="60"
          value={localConfig?.socialFeed?.refreshInterval || 15}
          onChange={(e) => handleConfigUpdate('socialFeed.refreshInterval', parseInt(e.target.value))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    </div>
  );

  const renderConfigEditor = () => {
    switch (section.type) {
      case 'hero':
        return renderHeroConfig();
      case 'text':
        return renderTextConfig();
      case 'image':
        return renderImageConfig();
      case 'gallery':
        return renderGalleryConfig();
      case 'studio-overview':
        return renderStudioOverviewConfig();
      case 'shows':
        return renderShowsConfig();
      case 'testimonials':
        return renderTestimonialsConfig();
      case 'cta':
        return renderCtaConfig();
      case 'divider':
        return renderDividerConfig();
      case 'video':
        return renderVideoConfig();
      case 'audio':
        return renderAudioConfig();
      case 'social-feed':
        return renderSocialFeedConfig();

      case 'story':
        return renderStoryConfig();
      case 'community-spotlight':
        return renderCommunitySpotlightConfig();
      case 'grid':
        return renderGridConfig();
      case 'hours-location':
        return renderHoursLocationConfig();
      default:
        return (
          <div className="text-center py-8 text-gray-500">
            Configuration options for {section.type} sections are coming soon.
          </div>
        );
    }
  };

  return (
    <PageBuilderErrorBoundary
      component="Section Editor"
      sectionId={section.id}
      onRetry={() => {
        // Reset local state and try again
        setLocalConfig(JSON.parse(JSON.stringify(section.settings || {})));
        setLocalSection({ ...section });
        setValidationErrors([]);
      }}
      onReset={() => {
        // Reset to original section data
        setLocalConfig(JSON.parse(JSON.stringify(section.settings || {})));
        setLocalSection({ ...section });
        setValidationErrors([]);
      }}
    >
      <div className="fixed inset-y-0 right-0 w-80 bg-white border-l border-gray-200 z-50 overflow-y-auto">
        <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Section Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close Editor"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-red-800">
                {validationErrors.length} validation error{validationErrors.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="space-y-1">
              {validationErrors.map((error, index) => (
                <p key={index} className="text-sm text-red-700">
                  • {error.message}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Section Info */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">Section {localSection.id}</h3>
          <p className="text-sm text-gray-600">
            Type: {section.type.charAt(0).toUpperCase() + section.type.slice(1).replace('-', ' ')}
          </p>
          <p className="text-sm text-gray-600">
            Order: {section.order}
          </p>
        </div>



        {/* Configuration Editor */}
        <div>
          <h3 className="text-sm font-medium text-gray-900 mb-4">Configuration</h3>
          {renderConfigEditor()}
        </div>

        {/* Save/Cancel Buttons */}
        <div className="mt-8 flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            className={`px-4 py-2 rounded text-white transition-colors ${
              validationErrors.length > 0 
                ? 'bg-red-600 hover:bg-red-700 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
            onClick={handleSave}
            disabled={validationErrors.length > 0}
          >
            {validationErrors.length > 0 ? 'Fix Errors' : 'Save'}
          </button>
        </div>
      </div>
    </div>
    </PageBuilderErrorBoundary>
  );
} 
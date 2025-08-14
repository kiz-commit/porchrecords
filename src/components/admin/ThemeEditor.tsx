'use client';

import React, { useState } from 'react';
import { ThemeConfig } from '@/lib/types';
import { useTheme } from '@/contexts/ThemeContext';
import ColorPicker from './ColorPicker';
import FontSelector from './FontSelector';

interface ThemeEditorProps {
  theme: ThemeConfig;
}

export default function ThemeEditor({ theme }: ThemeEditorProps) {
  const { updateTheme } = useTheme();
  const [localTheme, setLocalTheme] = useState<ThemeConfig>(theme);
  const [activeSection, setActiveSection] = useState<'colors' | 'typography' | 'spacing' | 'effects'>('colors');

  const sections = [
    { id: 'colors', label: 'Colors', icon: '🎨' },
    { id: 'typography', label: 'Typography', icon: '📝' },
    { id: 'spacing', label: 'Spacing', icon: '📏' },
    { id: 'effects', label: 'Effects', icon: '✨' },
  ];

  const handleColorChange = (colorKey: keyof ThemeConfig['colors'], value: string) => {
    const newTheme = {
      ...localTheme,
      colors: {
        ...localTheme.colors,
        [colorKey]: value,
      },
    };
    setLocalTheme(newTheme);
    updateTheme({ colors: newTheme.colors });
  };

  const handleTypographyChange = (key: keyof ThemeConfig['typography'], value: string | number) => {
    const newTheme = {
      ...localTheme,
      typography: {
        ...localTheme.typography,
        [key]: value,
      },
    };
    setLocalTheme(newTheme);
    updateTheme({ typography: newTheme.typography });
  };

  const handleSpacingChange = (key: keyof ThemeConfig['spacing'], value: number) => {
    const newTheme = {
      ...localTheme,
      spacing: {
        ...localTheme.spacing,
        [key]: value,
      },
    };
    setLocalTheme(newTheme);
    updateTheme({ spacing: newTheme.spacing });
  };

  const handleEffectsChange = (key: keyof ThemeConfig['effects'], value: number) => {
    const newTheme = {
      ...localTheme,
      effects: {
        ...localTheme.effects,
        [key]: value,
      },
    };
    setLocalTheme(newTheme);
    updateTheme({ effects: newTheme.effects });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Configuration Panel */}
      <div className="lg:col-span-1">
        <div className="bg-gray-50 rounded-lg p-6">
          {/* Section Navigation */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Theme Settings</h3>
            <nav className="space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id as any)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeSection === section.id
                      ? 'bg-mustard text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-2">{section.icon}</span>
                  {section.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Section Content */}
          <div className="space-y-6">
            {activeSection === 'colors' && (
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Color Palette</h4>
                <div className="space-y-4">
                  {Object.entries(localTheme.colors).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <ColorPicker
                        color={value}
                        onChange={(newColor) => handleColorChange(key as keyof ThemeConfig['colors'], newColor)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'typography' && (
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Typography</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Font
                    </label>
                    <FontSelector
                      value={localTheme.typography.primaryFont}
                      onChange={(value) => handleTypographyChange('primaryFont', value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secondary Font
                    </label>
                    <FontSelector
                      value={localTheme.typography.secondaryFont}
                      onChange={(value) => handleTypographyChange('secondaryFont', value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sans Font
                    </label>
                    <FontSelector
                      value={localTheme.typography.sansFont}
                      onChange={(value) => handleTypographyChange('sansFont', value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Base Font Size (px)
                    </label>
                    <input
                      type="number"
                      min="12"
                      max="24"
                      value={localTheme.typography.baseSize}
                      onChange={(e) => handleTypographyChange('baseSize', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mustard focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Font Scale
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="2"
                      step="0.1"
                      value={localTheme.typography.scale}
                      onChange={(e) => handleTypographyChange('scale', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mustard focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'spacing' && (
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Spacing</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Base Unit (px)
                    </label>
                    <input
                      type="number"
                      min="4"
                      max="16"
                      value={localTheme.spacing.unit}
                      onChange={(e) => handleSpacingChange('unit', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mustard focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scale Factor
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="3"
                      step="0.1"
                      value={localTheme.spacing.scale}
                      onChange={(e) => handleSpacingChange('scale', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mustard focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'effects' && (
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Effects</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transition Speed (seconds)
                    </label>
                    <input
                      type="number"
                      min="0.1"
                      max="2"
                      step="0.1"
                      value={localTheme.effects.transitionSpeed}
                      onChange={(e) => handleEffectsChange('transitionSpeed', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mustard focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Border Radius (px)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={localTheme.effects.borderRadius}
                      onChange={(e) => handleEffectsChange('borderRadius', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mustard focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Preview */}
      <div className="lg:col-span-2">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h3>
          <div className="bg-gray-50 rounded-lg p-6 min-h-[400px]">
            <div className="space-y-6">
              {/* Color Preview */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Color Palette</h4>
                <div className="grid grid-cols-4 gap-3">
                  {Object.entries(localTheme.colors).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <div
                        className="w-12 h-12 rounded-lg mx-auto mb-2 border border-gray-200"
                        style={{ backgroundColor: value }}
                      ></div>
                      <p className="text-xs text-gray-600 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Typography Preview */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Typography</h4>
                <div className="space-y-2">
                  <h1 style={{ fontFamily: localTheme.typography.primaryFont }} className="text-2xl">
                    Primary Font Sample
                  </h1>
                  <p style={{ fontFamily: localTheme.typography.secondaryFont }} className="text-sm">
                    Secondary Font Sample
                  </p>
                  <p style={{ fontFamily: localTheme.typography.sansFont }} className="text-base">
                    Sans Font Sample
                  </p>
                </div>
              </div>

              {/* Spacing Preview */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Spacing</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div
                      className="bg-mustard rounded"
                      style={{
                        width: `${localTheme.spacing.unit}px`,
                        height: `${localTheme.spacing.unit}px`,
                      }}
                    ></div>
                    <span className="text-sm text-gray-600">Base unit: {localTheme.spacing.unit}px</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div
                      className="bg-clay rounded"
                      style={{
                        width: `${localTheme.spacing.unit * localTheme.spacing.scale}px`,
                        height: `${localTheme.spacing.unit * localTheme.spacing.scale}px`,
                      }}
                    ></div>
                    <span className="text-sm text-gray-600">
                      Scaled unit: {Math.round(localTheme.spacing.unit * localTheme.spacing.scale)}px
                    </span>
                  </div>
                </div>
              </div>

              {/* Effects Preview */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Effects</h4>
                <div className="space-y-3">
                  <button
                    className="px-4 py-2 bg-mustard text-white rounded"
                    style={{
                      borderRadius: `${localTheme.effects.borderRadius}px`,
                      transition: `all ${localTheme.effects.transitionSpeed}s ease`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    Hover me (transition: {localTheme.effects.transitionSpeed}s)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
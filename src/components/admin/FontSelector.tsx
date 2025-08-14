'use client';

import React, { useState, useRef, useEffect } from 'react';

interface FontSelectorProps {
  value: string;
  onChange: (font: string) => void;
}

const FONT_OPTIONS = [
  {
    value: "'EB Garamond', serif",
    label: 'EB Garamond',
    category: 'Serif',
    preview: 'The quick brown fox jumps over the lazy dog',
  },
  {
    value: "'Space Mono', monospace",
    label: 'Space Mono',
    category: 'Monospace',
    preview: 'The quick brown fox jumps over the lazy dog',
  },
  {
    value: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    label: 'Inter',
    category: 'Sans-serif',
    preview: 'The quick brown fox jumps over the lazy dog',
  },
  {
    value: "'Playfair Display', serif",
    label: 'Playfair Display',
    category: 'Serif',
    preview: 'The quick brown fox jumps over the lazy dog',
  },
  {
    value: "'Roboto', sans-serif",
    label: 'Roboto',
    category: 'Sans-serif',
    preview: 'The quick brown fox jumps over the lazy dog',
  },
  {
    value: "'Open Sans', sans-serif",
    label: 'Open Sans',
    category: 'Sans-serif',
    preview: 'The quick brown fox jumps over the lazy dog',
  },
  {
    value: "'Lora', serif",
    label: 'Lora',
    category: 'Serif',
    preview: 'The quick brown fox jumps over the lazy dog',
  },
  {
    value: "'Source Code Pro', monospace",
    label: 'Source Code Pro',
    category: 'Monospace',
    preview: 'The quick brown fox jumps over the lazy dog',
  },
  {
    value: "'Merriweather', serif",
    label: 'Merriweather',
    category: 'Serif',
    preview: 'The quick brown fox jumps over the lazy dog',
  },
  {
    value: "'Poppins', sans-serif",
    label: 'Poppins',
    category: 'Sans-serif',
    preview: 'The quick brown fox jumps over the lazy dog',
  },
];

export default function FontSelector({ value, onChange }: FontSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const filteredFonts = FONT_OPTIONS.filter((font) =>
    font.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    font.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedFont = FONT_OPTIONS.find((font) => font.value === value) || FONT_OPTIONS[0];

  const handleFontSelect = (fontValue: string) => {
    onChange(fontValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={selectorRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md text-left bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-mustard focus:border-transparent"
      >
        <div className="flex items-center justify-between">
          <div>
            <div 
              className="font-medium text-gray-900"
              style={{ fontFamily: selectedFont.value }}
            >
              {selectedFont.label}
            </div>
            <div className="text-xs text-gray-500">{selectedFont.category}</div>
          </div>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-64 overflow-hidden">
          {/* Search */}
          <div className="p-3 border-b border-gray-200">
            <input
              type="text"
              placeholder="Search fonts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-mustard focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Font List */}
          <div className="max-h-48 overflow-y-auto">
            {filteredFonts.length > 0 ? (
              filteredFonts.map((font) => (
                <button
                  key={font.value}
                  onClick={() => handleFontSelect(font.value)}
                  className={`w-full px-3 py-3 text-left hover:bg-gray-50 transition-colors ${
                    value === font.value ? 'bg-mustard bg-opacity-10' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div 
                        className="font-medium text-gray-900 mb-1"
                        style={{ fontFamily: font.value }}
                      >
                        {font.label}
                      </div>
                      <div 
                        className="text-xs text-gray-600"
                        style={{ fontFamily: font.value }}
                      >
                        {font.preview}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 ml-2">{font.category}</div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-gray-500 text-sm">
                No fonts found matching "{searchTerm}"
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 
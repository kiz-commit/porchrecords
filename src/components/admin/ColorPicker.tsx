'use client';

import React, { useState, useRef, useEffect } from 'react';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

const PRESET_COLORS = [
  '#E1B84B', // mustard
  '#B86B3A', // clay
  '#F8F6F2', // offwhite
  '#181818', // black
  '#FFFFFF', // white
  '#000000', // pure black
  '#FF6B6B', // red
  '#4ECDC4', // teal
  '#45B7D1', // blue
  '#96CEB4', // green
  '#FFEAA7', // yellow
  '#DDA0DD', // plum
  '#98D8C8', // mint
  '#F7DC6F', // gold
  '#BB8FCE', // lavender
];

export default function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(color);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(color);
  }, [color]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    // Validate hex color format
    if (/^#[0-9A-F]{6}$/i.test(value)) {
      onChange(value);
    }
  };

  const handlePresetClick = (presetColor: string) => {
    setInputValue(presetColor);
    onChange(presetColor);
    setIsOpen(false);
  };

  const handleInputBlur = () => {
    // Try to fix the color format if it's close
    let fixedColor = inputValue;
    if (inputValue.startsWith('#') && inputValue.length === 4) {
      // Convert #RGB to #RRGGBB
      fixedColor = '#' + inputValue[1] + inputValue[1] + inputValue[2] + inputValue[2] + inputValue[3] + inputValue[3];
    } else if (!inputValue.startsWith('#') && inputValue.length === 6) {
      // Add # if missing
      fixedColor = '#' + inputValue;
    }
    
    if (/^#[0-9A-F]{6}$/i.test(fixedColor)) {
      setInputValue(fixedColor);
      onChange(fixedColor);
    } else {
      // Reset to original if invalid
      setInputValue(color);
    }
  };

  return (
    <div className="relative" ref={pickerRef}>
      <div className="flex items-center space-x-2">
        <div
          className="w-10 h-10 rounded-lg border-2 border-gray-300 cursor-pointer hover:border-gray-400 transition-colors"
          style={{ backgroundColor: color }}
          onClick={() => setIsOpen(!isOpen)}
        />
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder="#000000"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-mustard focus:border-transparent"
        />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 min-w-[280px]">
          <div className="mb-3">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Preset Colors</h4>
            <div className="grid grid-cols-8 gap-2">
              {PRESET_COLORS.map((presetColor) => (
                <button
                  key={presetColor}
                  onClick={() => handlePresetClick(presetColor)}
                  className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                    color === presetColor ? 'border-gray-900' : 'border-gray-300 hover:border-gray-500'
                  }`}
                  style={{ backgroundColor: presetColor }}
                  title={presetColor}
                />
              ))}
            </div>
          </div>

          <div className="mb-3">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Custom Color</h4>
            <input
              type="color"
              value={color}
              onChange={(e) => {
                setInputValue(e.target.value);
                onChange(e.target.value);
              }}
              className="w-full h-10 rounded-lg border border-gray-300 cursor-pointer"
            />
          </div>

          <div className="text-xs text-gray-500">
            <p>• Click the color swatch or use the color picker</p>
            <p>• Enter a hex color code (e.g., #E1B84B)</p>
            <p>• Choose from preset colors above</p>
          </div>
        </div>
      )}
    </div>
  );
} 
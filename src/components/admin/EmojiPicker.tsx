"use client";

import { useState } from 'react';

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  className?: string;
}

// Curated emoji collections for different moods and contexts
const EMOJI_CATEGORIES = {
  moods: [
    '😊', '😌', '🥳', '😎', '🤔', '😴', '🧘', '💭', '🌟', '✨',
    '🔥', '💫', '🌙', '☀️', '🌈', '🌊', '🏝️', '🌴', '🎵', '🎶',
    '🎧', '🎸', '🥁', '🎹', '🎺', '🎷', '🎤', '📻', '💿', '📀'
  ],
  nature: [
    '🌱', '🌿', '🍃', '🌾', '🌳', '🌲', '🌴', '🌵', '🌷', '🌸',
    '🌺', '🌻', '🌹', '🌼', '🌻', '🌚', '🌝', '🌞', '⭐', '🌟',
    '💫', '✨', '🌈', '☁️', '🌤️', '⛅', '🌦️', '🌧️', '⛈️', '🌩️'
  ],
  activities: [
    '🕺', '💃', '🏊', '🏄', '🧗', '🚴', '🏃', '🧘', '🎯', '🎮',
    '🎲', '🎨', '🖌️', '✏️', '📚', '📖', '📝', '💻', '🎬', '📸'
  ],
  emotions: [
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💗',
    '💖', '💝', '💯', '💢', '💥', '💫', '💨', '🔥', '✨', '⚡'
  ],
  objects: [
    '🎵', '🎶', '🎼', '🎹', '🥁', '🎸', '🎺', '🎷', '🎻', '🪕',
    '🎤', '🎧', '📻', '💿', '📀', '💾', '📱', '💻', '🖥️', '⌚'
  ]
};

export default function EmojiPicker({ value, onChange, className = '' }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<keyof typeof EMOJI_CATEGORIES>('moods');

  const handleEmojiSelect = (emoji: string) => {
    onChange(emoji);
    setIsOpen(false);
  };

  const clearEmoji = () => {
    onChange('');
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 border-2 border-gray-300 rounded-lg flex items-center justify-center text-xl hover:border-blue-500 transition-colors bg-white"
        title="Select emoji"
      >
        {value || '😊'}
      </button>
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Picker */}
          <div className="absolute top-14 left-0 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 w-80">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium text-gray-900">Select Emoji</h3>
              <button
                onClick={clearEmoji}
                className="text-sm text-gray-500 hover:text-red-500"
              >
                Clear
              </button>
            </div>
            
            {/* Category Tabs */}
            <div className="flex gap-1 mb-3 border-b">
              {Object.keys(EMOJI_CATEGORIES).map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category as keyof typeof EMOJI_CATEGORIES)}
                  className={`px-3 py-1 text-sm rounded-t transition-colors capitalize ${
                    activeCategory === category
                      ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            
            {/* Emoji Grid */}
            <div className="grid grid-cols-8 gap-1 max-h-48 overflow-y-auto">
              {EMOJI_CATEGORIES[activeCategory].map((emoji, index) => (
                <button
                  key={`${emoji}-${index}`}
                  onClick={() => handleEmojiSelect(emoji)}
                  className={`w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 rounded transition-colors ${
                    value === emoji ? 'bg-blue-100 ring-2 ring-blue-500' : ''
                  }`}
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
            
            {/* Quick access to common mood emojis */}
            <div className="mt-3 pt-3 border-t">
              <div className="text-xs text-gray-500 mb-2">Quick Access</div>
              <div className="flex gap-1">
                {['😊', '😌', '🥳', '🧘', '🔥', '💫', '🌟', '🎵'].map((emoji, index) => (
                  <button
                    key={`quick-${emoji}-${index}`}
                    onClick={() => handleEmojiSelect(emoji)}
                    className={`w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 rounded transition-colors ${
                      value === emoji ? 'bg-blue-100 ring-2 ring-blue-500' : ''
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
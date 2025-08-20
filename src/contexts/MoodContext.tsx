"use client";

import React, { createContext, useContext } from 'react';

interface MoodContextType {
  getMoodEmoji: (mood: string) => string;
  getMoodColor: (mood: string) => string;
}

const MoodContext = createContext<MoodContextType | undefined>(undefined);

interface MoodProviderProps {
  children: React.ReactNode;
}

export function MoodProvider({ children }: MoodProviderProps) {
  const getMoodEmoji = (mood: string): string => {
    const moodEmojis: Record<string, string> = {
      'energetic': '⚡',
      'chill': '😌',
      'melancholic': '🌧️',
      'uplifting': '✨',
      'dark': '🖤',
      'romantic': '💕',
      'nostalgic': '📷',
      'experimental': '🔬',
      'raw': '🔥',
      'ethereal': '🌙',
      'groovy': '🕺',
      'atmospheric': '🌫️',
      'intense': '💥',
      'dreamy': '💭',
      'aggressive': '👊',
      'peaceful': '🕊️',
      'mysterious': '🔮',
      'playful': '🎈',
      'serious': '🎭',
      'wild': '🐺'
    };
    
    return moodEmojis[mood.toLowerCase()] || '🎵';
  };

  const getMoodColor = (mood: string): string => {
    const moodColors: Record<string, string> = {
      'energetic': '#FF6B35',
      'chill': '#4ECDC4',
      'melancholic': '#6C5CE7',
      'uplifting': '#FFD93D',
      'dark': '#2D3436',
      'romantic': '#FF8A80',
      'nostalgic': '#A29BFE',
      'experimental': '#00B894',
      'raw': '#E17055',
      'ethereal': '#74B9FF',
      'groovy': '#FDCB6E',
      'atmospheric': '#636E72',
      'intense': '#D63031',
      'dreamy': '#FD79A8',
      'aggressive': '#E84393',
      'peaceful': '#00B894',
      'mysterious': '#6C5CE7',
      'playful': '#FDCB6E',
      'serious': '#2D3436',
      'wild': '#E17055'
    };
    
    return moodColors[mood.toLowerCase()] || '#000000';
  };

  const value: MoodContextType = {
    getMoodEmoji,
    getMoodColor,
  };

  return (
    <MoodContext.Provider value={value}>
      {children}
    </MoodContext.Provider>
  );
}

export function useMood() {
  const context = useContext(MoodContext);
  if (context === undefined) {
    throw new Error('useMood must be used within a MoodProvider');
  }
  return context;
}

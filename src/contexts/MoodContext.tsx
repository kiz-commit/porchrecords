"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { type TaxonomyItem } from '@/lib/taxonomy-utils';
import { fetchMoodsWithEmojis, setMoodCache, isMoodCacheExpired } from '@/lib/mood-utils';

interface MoodContextType {
  moods: TaxonomyItem[];
  getMoodEmoji: (moodName: string) => string;
  getMoodColor: (moodName: string) => string;
  isLoading: boolean;
  refreshMoods: () => Promise<void>;
}

const MoodContext = createContext<MoodContextType | undefined>(undefined);

export function MoodProvider({ children }: { children: React.ReactNode }) {
  const [moods, setMoods] = useState<TaxonomyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMoods = async () => {
    if (isMoodCacheExpired()) {
      setIsLoading(true);
      try {
        const moodData = await fetchMoodsWithEmojis();
        setMoods(moodData);
        setMoodCache(moodData);
      } catch (error) {
        console.error('Error loading moods:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMoods();
  }, []);

  const getMoodEmoji = (moodName: string): string => {
    const mood = moods.find(m => m.name.toLowerCase() === moodName.toLowerCase());
    return mood?.emoji || '';
  };

  const getMoodColor = (moodName: string): string => {
    const mood = moods.find(m => m.name.toLowerCase() === moodName.toLowerCase());
    return mood?.color || '';
  };

  const refreshMoods = async () => {
    await loadMoods();
  };

  const value: MoodContextType = {
    moods,
    getMoodEmoji,
    getMoodColor,
    isLoading,
    refreshMoods
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
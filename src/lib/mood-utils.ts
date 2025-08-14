import { getTaxonomyByType, type TaxonomyItem } from './taxonomy-utils';

// Client-side utility to get mood emoji
export function getMoodEmoji(moodName: string): string {
  if (typeof window === 'undefined') {
    // Server-side: return empty string, will be hydrated on client
    return '';
  }
  
  // Try to get from cache first
  const cachedMoods = getMoodCache();
  const mood = cachedMoods.find(m => m.name.toLowerCase() === moodName.toLowerCase());
  return mood?.emoji || '';
}

// Client-side cache for moods
let moodCacheData: TaxonomyItem[] | null = null;
let moodCacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getMoodCache(): TaxonomyItem[] {
  const now = Date.now();
  
  if (moodCacheData && (now - moodCacheTimestamp < CACHE_DURATION)) {
    return moodCacheData;
  }
  
  // Cache is expired or doesn't exist, return empty array
  // The cache will be populated by the component
  return [];
}

export function setMoodCache(moods: TaxonomyItem[]): void {
  moodCacheData = moods;
  moodCacheTimestamp = Date.now();
}

export function isMoodCacheExpired(): boolean {
  const now = Date.now();
  return !moodCacheData || (now - moodCacheTimestamp >= CACHE_DURATION);
}

// React hook for mood data
export async function fetchMoodsWithEmojis(): Promise<TaxonomyItem[]> {
  try {
    const response = await fetch('/api/admin/taxonomy?type=mood');
    if (response.ok) {
      const data = await response.json();
      return data.items || [];
    }
  } catch (error) {
    console.error('Error fetching moods:', error);
  }
  
  return [];
}
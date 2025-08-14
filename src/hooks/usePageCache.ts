import { useCallback } from 'react';
import { getCache, setCache, invalidateCache, clearCache, CacheKey, CacheValue } from '@/lib/cache-utils';

export function usePageCache() {
  // Get a value from the cache
  const get = useCallback(<T = any>(key: CacheKey): T | undefined => {
    return getCache<T>(key);
  }, []);

  // Set a value in the cache
  const set = useCallback(<T = any>(key: CacheKey, value: T) => {
    setCache<T>(key, value);
  }, []);

  // Invalidate a cache entry
  const invalidate = useCallback((key: CacheKey) => {
    invalidateCache(key);
  }, []);

  // Clear the entire cache
  const clear = useCallback(() => {
    clearCache();
  }, []);

  // (Optional) Add subscription logic for cache changes here

  return { get, set, invalidate, clear };
} 
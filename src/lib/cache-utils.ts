// PageBuilder cache utilities

export type CacheKey = string;
export type CacheValue = any;

// In-memory cache (can be replaced with localStorage or server cache)
const cache = new Map<CacheKey, CacheValue>();

export function getCache<T = any>(key: CacheKey): T | undefined {
  return cache.get(key);
}

export function setCache<T = any>(key: CacheKey, value: T): void {
  cache.set(key, value);
}

export function invalidateCache(key: CacheKey): void {
  cache.delete(key);
}

export function clearCache(): void {
  cache.clear();
}

// Cache key generators for consistent naming
export function getPageCacheKey(pageId: string): string {
  return `page:${pageId}`;
}

export function getSectionCacheKey(pageId: string, sectionId: string): string {
  return `section:${pageId}:${sectionId}`;
}

export function getPagesListCacheKey(): string {
  return 'pages:list';
}

// Bulk cache operations
export function invalidatePageCache(pageId: string): void {
  // Invalidate page and all its sections
  invalidateCache(getPageCacheKey(pageId));
  
  // Invalidate pages list cache
  invalidateCache(getPagesListCacheKey());
}

export function invalidateSectionCache(pageId: string, sectionId: string): void {
  invalidateCache(getSectionCacheKey(pageId, sectionId));
  invalidateCache(getPageCacheKey(pageId));
}

// Products cache utilities
export function getProductsCacheKey(): string {
  return 'products:list';
}

export function invalidateProductsCache(reason: string = 'unknown'): void {
  console.log(`Invalidating products cache: ${reason}`);
  invalidateCache(getProductsCacheKey());
}

// Optionally, add localStorage persistence later 
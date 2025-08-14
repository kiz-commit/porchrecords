import { ThemeConfig } from './types';

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEY = 'porch-theme-cache';
const STORAGE_VERSION = '1.0';

interface CacheEntry {
  data: ThemeConfig;
  timestamp: number;
  version: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  invalidations: number;
  lastAccess: number;
}

class ThemeCache {
  private memoryCache = new Map<string, CacheEntry>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    invalidations: 0,
    lastAccess: Date.now(),
  };

  // Get theme from cache
  get(key: string): ThemeConfig | null {
    this.stats.lastAccess = Date.now();
    
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && this.isValid(memoryEntry)) {
      this.stats.hits++;
      return memoryEntry.data;
    }

    // Check localStorage
    try {
      const storageEntry = this.getFromStorage(key);
      if (storageEntry && this.isValid(storageEntry)) {
        // Update memory cache
        this.memoryCache.set(key, storageEntry);
        this.stats.hits++;
        return storageEntry.data;
      }
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
    }

    this.stats.misses++;
    return null;
  }

  // Set theme in cache
  set(key: string, data: ThemeConfig): void {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      version: STORAGE_VERSION,
    };

    // Update memory cache
    this.memoryCache.set(key, entry);
    this.stats.sets++;

    // Update localStorage
    try {
      this.setInStorage(key, entry);
    } catch (error) {
      console.warn('Failed to write to localStorage:', error);
    }
  }

  // Invalidate cache entry
  invalidate(key: string): void {
    this.memoryCache.delete(key);
    this.stats.invalidations++;
    
    try {
      localStorage.removeItem(`${STORAGE_KEY}_${key}`);
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error);
    }
  }

  // Clear all cache
  clear(): void {
    this.memoryCache.clear();
    this.stats.invalidations++;
    
    try {
      // Clear all theme-related localStorage items
      Object.keys(localStorage)
        .filter(key => key.startsWith(STORAGE_KEY))
        .forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }

  // Get cache statistics
  getStats(): CacheStats {
    return { ...this.stats };
  }

  // Get cache hit rate
  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total > 0 ? this.stats.hits / total : 0;
  }

  // Check if cache entry is valid
  private isValid(entry: CacheEntry): boolean {
    const now = Date.now();
    return (
      entry.version === STORAGE_VERSION &&
      now - entry.timestamp < CACHE_TTL
    );
  }

  // Get from localStorage
  private getFromStorage(key: string): CacheEntry | null {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${key}`);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  // Set in localStorage
  private setInStorage(key: string, entry: CacheEntry): void {
    try {
      localStorage.setItem(`${STORAGE_KEY}_${key}`, JSON.stringify(entry));
    } catch (error) {
      // If localStorage is full, try to clear old entries
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.cleanupStorage();
        localStorage.setItem(`${STORAGE_KEY}_${key}`, JSON.stringify(entry));
      } else {
        throw error;
      }
    }
  }

  // Cleanup old localStorage entries
  private cleanupStorage(): void {
    try {
      const now = Date.now();
      const keysToRemove: string[] = [];

      Object.keys(localStorage)
        .filter(key => key.startsWith(STORAGE_KEY))
        .forEach(key => {
          try {
            const entry = JSON.parse(localStorage.getItem(key) || '{}');
            if (!this.isValid(entry)) {
              keysToRemove.push(key);
            }
          } catch {
            keysToRemove.push(key);
          }
        });

      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to cleanup localStorage:', error);
    }
  }
}

// Performance monitoring utilities
export interface ThemePerformanceMetrics {
  loadTime: number;
  cacheHit: boolean;
  cacheHitRate: number;
  memoryUsage: number;
  cssUpdateTime: number;
}

class ThemePerformanceMonitor {
  private metrics: ThemePerformanceMetrics[] = [];
  private maxMetrics = 100;

  recordLoadTime(loadTime: number, cacheHit: boolean, cacheHitRate: number): void {
    const metric: ThemePerformanceMetrics = {
      loadTime,
      cacheHit,
      cacheHitRate,
      memoryUsage: this.getMemoryUsage(),
      cssUpdateTime: 0, // Will be set by recordCSSUpdate
    };

    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  recordCSSUpdate(cssUpdateTime: number): void {
    if (this.metrics.length > 0) {
      this.metrics[this.metrics.length - 1].cssUpdateTime = cssUpdateTime;
    }
  }

  getAverageLoadTime(): number {
    if (this.metrics.length === 0) return 0;
    const total = this.metrics.reduce((sum, m) => sum + m.loadTime, 0);
    return total / this.metrics.length;
  }

  getAverageCSSUpdateTime(): number {
    if (this.metrics.length === 0) return 0;
    const total = this.metrics.reduce((sum, m) => sum + m.cssUpdateTime, 0);
    return total / this.metrics.length;
  }

  getCacheHitRate(): number {
    if (this.metrics.length === 0) return 0;
    const hits = this.metrics.filter(m => m.cacheHit).length;
    return hits / this.metrics.length;
  }

  getRecentMetrics(count: number = 10): ThemePerformanceMetrics[] {
    return this.metrics.slice(-count);
  }

  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }
}

// CSS variable optimization utilities
export class CSSVariableOptimizer {
  private static instance: CSSVariableOptimizer;
  private batchUpdates: Map<string, string> = new Map();
  private updateTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY = 16; // ~60fps

  static getInstance(): CSSVariableOptimizer {
    if (!CSSVariableOptimizer.instance) {
      CSSVariableOptimizer.instance = new CSSVariableOptimizer();
    }
    return CSSVariableOptimizer.instance;
  }

  setVariable(name: string, value: string): void {
    this.batchUpdates.set(name, value);
    this.scheduleBatchUpdate();
  }

  setVariables(variables: Record<string, string>): void {
    Object.entries(variables).forEach(([name, value]) => {
      this.batchUpdates.set(name, value);
    });
    this.scheduleBatchUpdate();
  }

  private scheduleBatchUpdate(): void {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }

    this.updateTimeout = setTimeout(() => {
      this.applyBatchUpdates();
    }, this.BATCH_DELAY);
  }

  private applyBatchUpdates(): void {
    const startTime = performance.now();
    const root = document.documentElement;

    this.batchUpdates.forEach((value, name) => {
      root.style.setProperty(name, value);
    });

    this.batchUpdates.clear();
    this.updateTimeout = null;

    const endTime = performance.now();
    performanceMonitor.recordCSSUpdate(endTime - startTime);
  }

  // Force immediate update
  flush(): void {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
      this.applyBatchUpdates();
    }
  }
}

// Create singleton instances
export const themeCache = new ThemeCache();
export const performanceMonitor = new ThemePerformanceMonitor();
export const cssOptimizer = CSSVariableOptimizer.getInstance();

// Utility function to optimize theme application
export function applyThemeOptimized(themeConfig: ThemeConfig): void {
  const startTime = performance.now();
  
  // Batch CSS variable updates
  const variables: Record<string, string> = {};
  
  // Colors
  Object.entries(themeConfig.colors).forEach(([key, value]) => {
    variables[`--color-${key}`] = value;
  });
  
  // Typography
  variables['--font-primary'] = themeConfig.typography.primaryFont;
  variables['--font-secondary'] = themeConfig.typography.secondaryFont;
  variables['--font-sans'] = themeConfig.typography.sansFont;
  variables['--font-size-base'] = `${themeConfig.typography.baseSize}px`;
  variables['--font-size-scale'] = themeConfig.typography.scale.toString();
  
  // Spacing
  variables['--spacing-unit'] = `${themeConfig.spacing.unit}px`;
  variables['--spacing-scale'] = themeConfig.spacing.scale.toString();
  
  // Effects
  variables['--transition-speed'] = `${themeConfig.effects.transitionSpeed}s`;
  variables['--border-radius'] = `${themeConfig.effects.borderRadius}px`;
  
  // Legacy variables for backward compatibility
  variables['--background'] = themeConfig.colors.background;
  variables['--foreground'] = themeConfig.colors.foreground;
  variables['--mustard'] = themeConfig.colors.mustard;
  variables['--clay'] = themeConfig.colors.clay;
  variables['--offwhite'] = themeConfig.colors.offwhite;
  variables['--black'] = themeConfig.colors.black;
  variables['--font-serif'] = themeConfig.typography.primaryFont;
  variables['--font-mono'] = themeConfig.typography.secondaryFont;

  // Apply all variables in a single batch
  cssOptimizer.setVariables(variables);
  
  const endTime = performance.now();
  performanceMonitor.recordCSSUpdate(endTime - startTime);
}

// Utility function to get cached theme with performance monitoring
export async function getCachedTheme(key: string, fetchFn: () => Promise<ThemeConfig>): Promise<ThemeConfig> {
  const startTime = performance.now();
  
  // Try cache first
  const cached = themeCache.get(key);
  if (cached) {
    const endTime = performance.now();
    performanceMonitor.recordLoadTime(
      endTime - startTime,
      true,
      themeCache.getHitRate()
    );
    return cached;
  }

  // Fetch from server
  const theme = await fetchFn();
  
  // Cache the result
  themeCache.set(key, theme);
  
  const endTime = performance.now();
  performanceMonitor.recordLoadTime(
    endTime - startTime,
    false,
    themeCache.getHitRate()
  );
  
  return theme;
} 
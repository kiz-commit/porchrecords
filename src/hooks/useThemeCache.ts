import { useState, useEffect, useCallback, useRef } from 'react';
import { ThemeConfig } from '@/lib/types';
import { 
  themeCache, 
  performanceMonitor, 
  getCachedTheme, 
  applyThemeOptimized,
  ThemePerformanceMetrics 
} from '@/lib/theme-cache';

interface UseThemeCacheOptions {
  cacheKey?: string;
  enablePerformanceMonitoring?: boolean;
  enableOptimizedCSS?: boolean;
  cacheTTL?: number;
}

interface UseThemeCacheReturn {
  theme: ThemeConfig | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  invalidate: () => void;
  performance: {
    metrics: ThemePerformanceMetrics[];
    averageLoadTime: number;
    averageCSSUpdateTime: number;
    cacheHitRate: number;
    stats: ReturnType<typeof themeCache.getStats>;
  };
}

export function useThemeCache(
  fetchTheme: () => Promise<ThemeConfig>,
  options: UseThemeCacheOptions = {}
): UseThemeCacheReturn {
  const {
    cacheKey = 'default-theme',
    enablePerformanceMonitoring = true,
    enableOptimizedCSS = true,
  } = options;

  const [theme, setTheme] = useState<ThemeConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [performance, setPerformance] = useState({
    metrics: [] as ThemePerformanceMetrics[],
    averageLoadTime: 0,
    averageCSSUpdateTime: 0,
    cacheHitRate: 0,
    stats: themeCache.getStats(),
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Load theme with caching and performance monitoring
  const loadTheme = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Cancel any ongoing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      const themeConfig = await getCachedTheme(cacheKey, fetchTheme);
      
      // Check if request was cancelled
      if (abortControllerRef.current.signal.aborted) {
        return;
      }

      setTheme(themeConfig);

      // Apply theme with optimization
      if (enableOptimizedCSS) {
        applyThemeOptimized(themeConfig);
      }

      // Update performance metrics
      if (enablePerformanceMonitoring) {
        setPerformance(prev => ({
          ...prev,
          metrics: performanceMonitor.getRecentMetrics(),
          averageLoadTime: performanceMonitor.getAverageLoadTime(),
          averageCSSUpdateTime: performanceMonitor.getAverageCSSUpdateTime(),
          cacheHitRate: performanceMonitor.getCacheHitRate(),
          stats: themeCache.getStats(),
        }));
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Request was cancelled, don't set error
        return;
      }
      
      console.error('Failed to load theme:', err);
      setError(err instanceof Error ? err.message : 'Failed to load theme');
    } finally {
      setIsLoading(false);
    }
  }, [cacheKey, fetchTheme, enablePerformanceMonitoring, enableOptimizedCSS]);

  // Refresh theme (force reload from server)
  const refresh = useCallback(async () => {
    themeCache.invalidate(cacheKey);
    await loadTheme();
  }, [cacheKey, loadTheme]);

  // Invalidate cache
  const invalidate = useCallback(() => {
    themeCache.invalidate(cacheKey);
  }, [cacheKey]);

  // Load theme on mount
  useEffect(() => {
    loadTheme();

    // Cleanup on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadTheme]);

  // Update performance metrics periodically
  useEffect(() => {
    if (!enablePerformanceMonitoring) return;

    const interval = setInterval(() => {
      setPerformance(prev => ({
        ...prev,
        metrics: performanceMonitor.getRecentMetrics(),
        averageLoadTime: performanceMonitor.getAverageLoadTime(),
        averageCSSUpdateTime: performanceMonitor.getAverageCSSUpdateTime(),
        cacheHitRate: performanceMonitor.getCacheHitRate(),
        stats: themeCache.getStats(),
      }));
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [enablePerformanceMonitoring]);

  return {
    theme,
    isLoading,
    error,
    refresh,
    invalidate,
    performance,
  };
}

// Hook for theme updates with caching
export function useThemeUpdate() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<number | null>(null);

  const updateTheme = useCallback(async (
    updateFn: () => Promise<void>,
    cacheKey: string = 'default-theme'
  ) => {
    try {
      setIsUpdating(true);
      const startTime = performance.now();
      
      await updateFn();
      
      // Invalidate cache after update
      themeCache.invalidate(cacheKey);
      
      const endTime = performance.now();
      setLastUpdateTime(endTime);
      
      // Record performance metrics
      performanceMonitor.recordLoadTime(
        endTime - startTime,
        false,
        themeCache.getHitRate()
      );
    } catch (error) {
      console.error('Theme update failed:', error);
      throw error;
    } finally {
      setIsUpdating(false);
    }
  }, []);

  return {
    updateTheme,
    isUpdating,
    lastUpdateTime,
  };
}



// Hook for cache management
export function useThemeCacheManagement() {
  const clearCache = useCallback(() => {
    themeCache.clear();
  }, []);

  const getCacheStats = useCallback(() => {
    return themeCache.getStats();
  }, []);

  const getPerformanceMetrics = useCallback(() => {
    return {
      averageLoadTime: performanceMonitor.getAverageLoadTime(),
      averageCSSUpdateTime: performanceMonitor.getAverageCSSUpdateTime(),
      cacheHitRate: performanceMonitor.getCacheHitRate(),
      recentMetrics: performanceMonitor.getRecentMetrics(),
    };
  }, []);

  return {
    clearCache,
    getCacheStats,
    getPerformanceMetrics,
  };
} 
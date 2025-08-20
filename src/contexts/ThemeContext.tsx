'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { ThemeConfig } from '@/lib/types';
import { updateThemeConfigClient } from '@/lib/client-config-utils';
import { useThemeCache } from '@/hooks/useThemeCache';
import { fetchThemeConfig } from '@/lib/client-config-utils';

interface ThemeContextType {
  theme: ThemeConfig | null;
  isLoading: boolean;
  error: string | null;
  updateTheme: (newTheme: Partial<ThemeConfig>) => Promise<void>;
  refreshTheme: () => Promise<void>;
  performance: {
    averageLoadTime: number;
    averageCSSUpdateTime: number;
    cacheHitRate: number;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Use the cached theme hook
  const {
    theme,
    isLoading,
    error,
    refresh: refreshTheme,
    performance,
  } = useThemeCache(fetchThemeConfig, {
    cacheKey: 'main-theme',
    enablePerformanceMonitoring: true,
    enableOptimizedCSS: false, // Disable optimized CSS since server handles it
  });



  // Update theme configuration
  const updateTheme = async (newTheme: Partial<ThemeConfig>) => {
    try {
      // Update in database
      await updateThemeConfigClient(newTheme);
      
      // Refresh theme from cache
      await refreshTheme();
    } catch (err) {
      console.error('Failed to update theme:', err);
      throw err;
    }
  };



  const value: ThemeContextType = {
    theme,
    isLoading,
    error,
    updateTheme,
    refreshTheme,
    performance: {
      averageLoadTime: performance.averageLoadTime,
      averageCSSUpdateTime: performance.averageCSSUpdateTime,
      cacheHitRate: performance.cacheHitRate,
    },
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Hook for applying theme changes with debouncing
export function useThemeUpdate() {
  const { updateTheme } = useTheme();
  const [isUpdating, setIsUpdating] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout | undefined>(undefined);

  const debouncedUpdate = React.useCallback((newTheme: Partial<ThemeConfig>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(async () => {
      setIsUpdating(true);
      try {
        await updateTheme(newTheme);
      } finally {
        setIsUpdating(false);
      }
    }, 300); // 300ms debounce
  }, [updateTheme]);

  return { updateTheme: debouncedUpdate, isUpdating };
} 
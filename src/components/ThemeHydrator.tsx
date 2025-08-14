'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { applyThemeOptimized } from '@/lib/theme-cache';

interface ThemeHydratorProps {
  children: React.ReactNode;
}

export function ThemeHydrator({ children }: ThemeHydratorProps) {
  const { theme, isLoading } = useTheme();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window === 'undefined') return;

    // Get the current CSS variables from the server-injected styles
    const root = document.documentElement;
    const serverTheme = {
      colors: {
        primary: getComputedStyle(root).getPropertyValue('--color-primary').trim(),
        secondary: getComputedStyle(root).getPropertyValue('--color-secondary').trim(),
        background: getComputedStyle(root).getPropertyValue('--color-background').trim(),
        foreground: getComputedStyle(root).getPropertyValue('--color-foreground').trim(),
        mustard: getComputedStyle(root).getPropertyValue('--color-mustard').trim(),
        clay: getComputedStyle(root).getPropertyValue('--color-clay').trim(),
        offwhite: getComputedStyle(root).getPropertyValue('--color-offwhite').trim(),
        black: getComputedStyle(root).getPropertyValue('--color-black').trim(),
      },
      typography: {
        primaryFont: getComputedStyle(root).getPropertyValue('--font-primary').trim(),
        secondaryFont: getComputedStyle(root).getPropertyValue('--font-secondary').trim(),
        sansFont: getComputedStyle(root).getPropertyValue('--font-sans').trim(),
        baseSize: parseInt(getComputedStyle(root).getPropertyValue('--font-size-base').trim()) || 16,
        scale: parseFloat(getComputedStyle(root).getPropertyValue('--font-size-scale').trim()) || 1.25,
      },
      spacing: {
        unit: parseInt(getComputedStyle(root).getPropertyValue('--spacing-unit').trim()) || 8,
        scale: parseFloat(getComputedStyle(root).getPropertyValue('--spacing-scale').trim()) || 1.5,
      },
      effects: {
        transitionSpeed: parseFloat(getComputedStyle(root).getPropertyValue('--transition-speed').trim()) || 0.3,
        borderRadius: parseInt(getComputedStyle(root).getPropertyValue('--border-radius').trim()) || 4,
      },
    };

    // If we have a theme from the context, ensure it matches the server theme
    if (theme) {
      // Only apply if there's a mismatch to avoid unnecessary updates
      const hasMismatch = 
        theme.colors.primary !== serverTheme.colors.primary ||
        theme.colors.secondary !== serverTheme.colors.secondary ||
        theme.colors.background !== serverTheme.colors.background ||
        theme.colors.foreground !== serverTheme.colors.foreground;

      if (hasMismatch) {
        applyThemeOptimized(theme);
      }
    }

    // Mark as hydrated
    setIsHydrated(true);
  }, [theme, isLoading]);

  return <>{children}</>;
} 
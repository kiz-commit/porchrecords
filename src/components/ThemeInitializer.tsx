'use client';

import { useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { applyThemeOptimized } from '@/lib/theme-cache';

interface ThemeInitializerProps {
  initialTheme?: any;
}

export function ThemeInitializer({ initialTheme }: ThemeInitializerProps) {
  const { theme, isLoading } = useTheme();

  useEffect(() => {
    // Only apply theme if we don't already have one from the server
    // The server should have already injected the CSS variables
    if (initialTheme && !theme && typeof window !== 'undefined') {
      // Check if CSS variables are already set
      const root = document.documentElement;
      const existingColor = getComputedStyle(root).getPropertyValue('--color-primary');
      
      // Only apply if CSS variables aren't already set
      if (!existingColor || existingColor.trim() === '') {
        applyThemeOptimized(initialTheme);
      }
    }
  }, [initialTheme, theme]);

  // Show loading state if theme is still loading
  if (isLoading && !initialTheme) {
    return (
      <style jsx global>{`
        body {
          opacity: 0.8;
          transition: opacity 0.3s ease;
        }
      `}</style>
    );
  }

  return null;
}

// Server-side component to inject initial CSS variables
export function ThemeCSSInjector({ theme }: { theme: any }) {
  if (!theme) return null;

  const cssVariables = `
    :root {
      /* Colors */
      --color-primary: ${theme.colors.primary};
      --color-secondary: ${theme.colors.secondary};
      --color-background: ${theme.colors.background};
      --color-foreground: ${theme.colors.foreground};
      --color-mustard: ${theme.colors.mustard};
      --color-clay: ${theme.colors.clay};
      --color-offwhite: ${theme.colors.offwhite};
      --color-black: ${theme.colors.black};
      
      /* Typography */
      --font-primary: ${theme.typography.primaryFont};
      --font-secondary: ${theme.typography.secondaryFont};
      --font-sans: ${theme.typography.sansFont};
      --font-size-base: ${theme.typography.baseSize}px;
      --font-size-scale: ${theme.typography.scale};
      
      /* Spacing */
      --spacing-unit: ${theme.spacing.unit}px;
      --spacing-scale: ${theme.spacing.scale};
      
      /* Effects */
      --transition-speed: ${theme.effects.transitionSpeed}s;
      --border-radius: ${theme.effects.borderRadius}px;
      
      /* Legacy variables for backward compatibility */
      --background: ${theme.colors.background};
      --foreground: ${theme.colors.foreground};
      --mustard: ${theme.colors.mustard};
      --clay: ${theme.colors.clay};
      --offwhite: ${theme.colors.offwhite};
      --black: ${theme.colors.black};
      --font-serif: ${theme.typography.primaryFont};
      --font-mono: ${theme.typography.secondaryFont};
    }
  `;

  return (
    <style dangerouslySetInnerHTML={{ __html: cssVariables }} />
  );
} 
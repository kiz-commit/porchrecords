// Client-side configuration utilities (use these in React components)

import { ThemeConfig, HomepageConfig, HomepageSection } from './types';

// Client-side API functions
export async function fetchThemeConfig(): Promise<ThemeConfig> {
  const response = await fetch('/api/theme');
  if (!response.ok) {
    throw new Error('Failed to fetch theme configuration');
  }
  const data = await response.json();
  return data.theme;
}

export async function fetchHomepageConfig(): Promise<HomepageConfig> {
  const response = await fetch('/api/admin/site-config?key=homepage.hero');
  if (!response.ok) {
    throw new Error('Failed to fetch homepage configuration');
  }
  const data = await response.json();
  return data.config_value;
}

export async function fetchHomepageSections(): Promise<HomepageSection[]> {
  const response = await fetch('/api/homepage-sections');
  if (!response.ok) {
    throw new Error('Failed to fetch homepage sections');
  }
  const data = await response.json();
  return data.sections;
}



export async function updateThemeConfigClient(themeConfig: Partial<ThemeConfig>): Promise<void> {
  const response = await fetch('/api/admin/site-config', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      configurations: Object.entries(themeConfig).flatMap(([category, categoryData]) => {
        if (typeof categoryData === 'object' && categoryData !== null) {
          return Object.entries(categoryData).map(([key, value]) => ({
            config_key: `theme.${category}.${key}`,
            config_value: value,
          }));
        }
        return [];
      }),
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to update theme configuration');
  }
}

export async function updateHomepageConfigClient(homepageConfig: Partial<HomepageConfig>): Promise<void> {
  const response = await fetch('/api/admin/site-config', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      configurations: Object.entries(homepageConfig).flatMap(([category, categoryData]) => {
        if (typeof categoryData === 'object' && categoryData !== null) {
          return Object.entries(categoryData).map(([key, value]) => ({
            config_key: `homepage.${category}.${key}`,
            config_value: value,
          }));
        }
        return [];
      }),
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to update homepage configuration');
  }
}

// CSS variable application utilities
export function applyThemeToCSS(themeConfig: ThemeConfig): void {
  const root = document.documentElement;
  
  // Apply colors
  Object.entries(themeConfig.colors).forEach(([key, value]) => {
    root.style.setProperty(`--color-${key}`, value);
  });
  
  // Apply typography
  root.style.setProperty('--font-primary', themeConfig.typography.primaryFont);
  root.style.setProperty('--font-secondary', themeConfig.typography.secondaryFont);
  root.style.setProperty('--font-sans', themeConfig.typography.sansFont);
  root.style.setProperty('--font-size-base', `${themeConfig.typography.baseSize}px`);
  root.style.setProperty('--font-size-scale', themeConfig.typography.scale.toString());
  
  // Apply spacing
  root.style.setProperty('--spacing-unit', `${themeConfig.spacing.unit}px`);
  root.style.setProperty('--spacing-scale', themeConfig.spacing.scale.toString());
  
  // Apply effects
  root.style.setProperty('--transition-speed', `${themeConfig.effects.transitionSpeed}s`);
  root.style.setProperty('--border-radius', `${themeConfig.effects.borderRadius}px`);
  
  // Update legacy variables for backward compatibility
  root.style.setProperty('--background', themeConfig.colors.background);
  root.style.setProperty('--foreground', themeConfig.colors.foreground);
  root.style.setProperty('--mustard', themeConfig.colors.mustard);
  root.style.setProperty('--clay', themeConfig.colors.clay);
  root.style.setProperty('--offwhite', themeConfig.colors.offwhite);
  root.style.setProperty('--black', themeConfig.colors.black);
  root.style.setProperty('--font-serif', themeConfig.typography.primaryFont);
  root.style.setProperty('--font-mono', themeConfig.typography.secondaryFont);
}

// Utility to generate CSS variables string for SSR
export function generateCSSVariablesString(themeConfig: ThemeConfig): string {
  return `
:root {
  /* Colors */
  --color-primary: ${themeConfig.colors.primary};
  --color-secondary: ${themeConfig.colors.secondary};
  --color-background: ${themeConfig.colors.background};
  --color-foreground: ${themeConfig.colors.foreground};
  --color-mustard: ${themeConfig.colors.mustard};
  --color-clay: ${themeConfig.colors.clay};
  --color-offwhite: ${themeConfig.colors.offwhite};
  --color-black: ${themeConfig.colors.black};
  
  /* Typography */
  --font-primary: ${themeConfig.typography.primaryFont};
  --font-secondary: ${themeConfig.typography.secondaryFont};
  --font-sans: ${themeConfig.typography.sansFont};
  --font-size-base: ${themeConfig.typography.baseSize}px;
  --font-size-scale: ${themeConfig.typography.scale};
  
  /* Spacing */
  --spacing-unit: ${themeConfig.spacing.unit}px;
  --spacing-scale: ${themeConfig.spacing.scale};
  
  /* Effects */
  --transition-speed: ${themeConfig.effects.transitionSpeed}s;
  --border-radius: ${themeConfig.effects.borderRadius}px;
  
  /* Legacy variables for backward compatibility */
  --background: ${themeConfig.colors.background};
  --foreground: ${themeConfig.colors.foreground};
  --mustard: ${themeConfig.colors.mustard};
  --clay: ${themeConfig.colors.clay};
  --offwhite: ${themeConfig.colors.offwhite};
  --black: ${themeConfig.colors.black};
  --font-serif: ${themeConfig.typography.primaryFont};
  --font-mono: ${themeConfig.typography.secondaryFont};
}
  `.trim();
} 
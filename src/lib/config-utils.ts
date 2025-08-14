import { getDatabase } from './database';
import { ThemeConfig, HomepageConfig, HomepageSection, ThemePreset } from './types';

// Server-side only functions (use these in API routes and server components)
export async function getSiteConfig(category?: string): Promise<any> {
  const database = await getDatabase();
  
  if (category) {
    const configs = await database.all(
      'SELECT config_key, config_value FROM site_config WHERE config_key LIKE ? ORDER BY config_key',
      [`${category}.%`]
    );
    
    const result: any = {};
    configs.forEach(config => {
      const key = config.config_key.split('.')[1];
      result[key] = JSON.parse(config.config_value);
    });
    
    return result;
  } else {
    const configs = await database.all(
      'SELECT config_key, config_value FROM site_config ORDER BY config_key'
    );
    
    const result: Record<string, any> = {};
    configs.forEach(config => {
      const [category, key] = config.config_key.split('.');
      if (!result[category]) {
        result[category] = {};
      }
      result[category][key] = JSON.parse(config.config_value);
    });
    
    return result;
  }
}

export async function getThemeConfig(): Promise<ThemeConfig> {
  const database = await getDatabase();
  
  // Get all theme configurations
  const configs = await database.all(
    'SELECT config_key, config_value FROM site_config WHERE config_key LIKE "theme.%" ORDER BY config_key'
  );
  
  // Initialize default theme structure
  const themeConfig: ThemeConfig = {
    colors: {
      primary: '#E1B84B',
      secondary: '#B86B3A',
      background: '#F8F6F2',
      foreground: '#181818',
      mustard: '#E1B84B',
      clay: '#B86B3A',
      offwhite: '#F8F6F2',
      black: '#181818'
    },
    typography: {
      primaryFont: "'EB Garamond', serif",
      secondaryFont: "'Space Mono', monospace",
      sansFont: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      baseSize: 16,
      scale: 1.25
    },
    spacing: {
      unit: 8,
      scale: 1.5
    },
    effects: {
      transitionSpeed: 0.3,
      borderRadius: 4
    }
  };
  
  // Parse configurations and apply them
  configs.forEach(config => {
    const parts = config.config_key.split('.');
    if (parts.length >= 3) {
      const category = parts[1];
      const key = parts[2];
      const value = JSON.parse(config.config_value);
      
      if (category === 'colors' && key in themeConfig.colors) {
        (themeConfig.colors as any)[key] = value;
      } else if (category === 'typography' && key in themeConfig.typography) {
        (themeConfig.typography as any)[key] = value;
      } else if (category === 'spacing' && key in themeConfig.spacing) {
        (themeConfig.spacing as any)[key] = value;
      } else if (category === 'effects' && key in themeConfig.effects) {
        (themeConfig.effects as any)[key] = value;
      }
    }
  });
  
  return themeConfig;
}

export async function getHomepageConfig(): Promise<HomepageConfig> {
  const homepageConfig = await getSiteConfig('homepage');
  return homepageConfig as HomepageConfig;
}

export async function getHomepageSections(): Promise<HomepageSection[]> {
  const database = await getDatabase();
  
  const sections = await database.all(
    'SELECT * FROM homepage_sections WHERE is_active = 1 ORDER BY order_index ASC'
  );
  
  return sections.map(section => ({
    id: section.id,
    section_type: section.section_type,
    section_data: JSON.parse(section.section_data),
    order: section.order_index, // required by HomepageSection
    isVisible: Boolean(section.is_active), // required by HomepageSection
    type: section.section_type, // required by HomepageSection
    order_index: section.order_index,
    is_active: Boolean(section.is_active),
    created_at: section.created_at,
    updated_at: section.updated_at
  }));
}

export async function getThemePresets(): Promise<ThemePreset[]> {
  const database = await getDatabase();
  
  const presets = await database.all(
    'SELECT * FROM theme_presets ORDER BY is_default DESC, name ASC'
  );
  
  return presets.map(preset => ({
    id: preset.id,
    name: preset.name,
    description: preset.description,
    config_data: JSON.parse(preset.config_data),
    is_default: Boolean(preset.is_default),
    created_at: preset.created_at
  }));
}

export async function getDefaultThemePreset(): Promise<ThemePreset | null> {
  const database = await getDatabase();
  
  const preset = await database.get(
    'SELECT * FROM theme_presets WHERE is_default = 1'
  );
  
  if (!preset) {
    return null;
  }
  
  return {
    id: preset.id,
    name: preset.name,
    description: preset.description,
    config_data: JSON.parse(preset.config_data),
    is_default: Boolean(preset.is_default),
    created_at: preset.created_at
  };
}

export async function updateSiteConfig(category: string, key: string, value: any): Promise<void> {
  const database = await getDatabase();
  
  await database.run(`
    INSERT OR REPLACE INTO site_config (config_key, config_value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
  `, [`${category}.${key}`, JSON.stringify(value)]);
}

export async function updateThemeConfig(themeConfig: Partial<ThemeConfig>): Promise<void> {
  const database = await getDatabase();
  
  await database.run('BEGIN TRANSACTION');
  
  try {
    for (const [category, categoryData] of Object.entries(themeConfig)) {
      if (typeof categoryData === 'object' && categoryData !== null) {
        for (const [key, value] of Object.entries(categoryData)) {
          await database.run(`
            INSERT OR REPLACE INTO site_config (config_key, config_value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
          `, [`theme.${category}.${key}`, JSON.stringify(value)]);
        }
      }
    }
    
    await database.run('COMMIT');
  } catch (error) {
    await database.run('ROLLBACK');
    throw error;
  }
}

export async function updateHomepageConfig(homepageConfig: Partial<HomepageConfig>): Promise<void> {
  const database = await getDatabase();
  
  await database.run('BEGIN TRANSACTION');
  
  try {
    for (const [category, categoryData] of Object.entries(homepageConfig)) {
      if (typeof categoryData === 'object' && categoryData !== null) {
        for (const [key, value] of Object.entries(categoryData)) {
          await database.run(`
            INSERT OR REPLACE INTO site_config (config_key, config_value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
          `, [`homepage.${category}.${key}`, JSON.stringify(value)]);
        }
      }
    }
    
    await database.run('COMMIT');
  } catch (error) {
    await database.run('ROLLBACK');
    throw error;
  }
}

// CSS generation utilities
export function generateCSSVariables(themeConfig: ThemeConfig): string {
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

// Validation utilities
export function validateThemeConfig(config: any): config is ThemeConfig {
  const requiredColors = ['primary', 'secondary', 'background', 'foreground', 'mustard', 'clay', 'offwhite', 'black'];
  const requiredTypography = ['primaryFont', 'secondaryFont', 'sansFont', 'baseSize', 'scale'];
  const requiredSpacing = ['unit', 'scale'];
  const requiredEffects = ['transitionSpeed', 'borderRadius'];
  
  if (!config.colors || typeof config.colors !== 'object') return false;
  if (!config.typography || typeof config.typography !== 'object') return false;
  if (!config.spacing || typeof config.spacing !== 'object') return false;
  if (!config.effects || typeof config.effects !== 'object') return false;
  
  for (const color of requiredColors) {
    if (!config.colors[color] || typeof config.colors[color] !== 'string') return false;
  }
  
  for (const typography of requiredTypography) {
    if (config.typography[typography] === undefined) return false;
  }
  
  for (const spacing of requiredSpacing) {
    if (typeof config.spacing[spacing] !== 'number') return false;
  }
  
  for (const effect of requiredEffects) {
    if (typeof config.effects[effect] !== 'number') return false;
  }
  
  return true;
}

export function validateHomepageConfig(config: any): config is HomepageConfig {
  if (!config.hero || typeof config.hero !== 'object') return false;
  
  const requiredHero = ['title', 'subtitle', 'location', 'showLocation', 'carouselSpeed'];
  for (const field of requiredHero) {
    if (config.hero[field] === undefined) return false;
  }
  
  return true;
}

// Cache utilities (server-side only)
const configCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getCachedSiteConfig(category?: string): Promise<any> {
  const cacheKey = category || 'all';
  const cached = configCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  
  const data = await getSiteConfig(category);
  configCache.set(cacheKey, { data, timestamp: Date.now() });
  
  return data;
}

export function clearConfigCache(): void {
  configCache.clear();
}

export function invalidateConfigCache(category?: string): void {
  if (category) {
    configCache.delete(category);
    configCache.delete('all'); // Also invalidate all cache
  } else {
    configCache.clear();
  }
} 
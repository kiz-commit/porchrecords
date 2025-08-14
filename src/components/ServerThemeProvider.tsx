import { getThemeConfig, generateCSSVariables } from '@/lib/config-utils';

export async function ServerThemeProvider() {
  try {
    // Fetch theme configuration on the server
    const themeConfig = await getThemeConfig();
    
    // Generate CSS variables
    const cssVariables = generateCSSVariables(themeConfig);
    
    // Return a style tag with the CSS variables
    return (
      <style
        dangerouslySetInnerHTML={{
          __html: cssVariables
        }}
      />
    );
  } catch (error) {
    console.error('Failed to load theme on server:', error);
    
    // Fallback to default theme if server loading fails
    const fallbackTheme = {
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
    
    const fallbackCSS = generateCSSVariables(fallbackTheme);
    
    return (
      <style
        dangerouslySetInnerHTML={{
          __html: fallbackCSS
        }}
      />
    );
  }
} 
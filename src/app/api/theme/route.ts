import { NextRequest, NextResponse } from 'next/server';
import { getThemeConfig, generateCSSVariables } from '@/lib/config-utils';

// GET - Retrieve current theme configuration
export async function GET(request: NextRequest) {
  try {
    const themeConfig = await getThemeConfig();
    
    // Generate CSS variables for the theme
    const cssVariables = generateCSSVariables(themeConfig);
    
    return NextResponse.json({
      theme: themeConfig,
      cssVariables,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching theme configuration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch theme configuration' },
      { status: 500 }
    );
  }
} 
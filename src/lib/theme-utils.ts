import { useTheme } from '@/contexts/ThemeContext';

export interface SectionTheme {
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
}

export function getThemeColor(colorKey: string, theme: any): string {
  if (!theme) return '';
  
  switch (colorKey) {
    case 'primary':
      return theme.colors?.primary || '#FFB800';
    case 'secondary':
      return theme.colors?.secondary || '#FF6B35';
    case 'mustard':
      return theme.colors?.mustard || '#FFB800';
    case 'clay':
      return theme.colors?.clay || '#FF6B35';
    case 'offwhite':
      return theme.colors?.offwhite || '#F8F6F2';
    case 'black':
      return theme.colors?.black || '#181818';
    case 'white':
      return '#FFFFFF';
    case 'gray-50':
      return '#F9FAFB';
    case 'gray-100':
      return '#F3F4F6';
    case 'gray-500':
      return '#6B7280';
    case 'gray-600':
      return '#4B5563';
    default:
      return '';
  }
}

export function getThemeClasses(sectionTheme: SectionTheme, theme: any): {
  backgroundClass: string;
  textClass: string;
  accentClass: string;
} {
  const getBackgroundClass = () => {
    if (!sectionTheme?.backgroundColor || sectionTheme.backgroundColor === 'default') {
      return 'bg-gray-50'; // Default background
    }
    
    const color = getThemeColor(sectionTheme.backgroundColor, theme);
    if (color) {
      return `bg-[${color}]`;
    }
    
    // Fallback to Tailwind classes
    switch (sectionTheme.backgroundColor) {
      case 'primary':
      case 'mustard':
        return 'bg-mustard';
      case 'secondary':
      case 'clay':
        return 'bg-clay';
      case 'offwhite':
        return 'bg-offwhite';
      case 'black':
        return 'bg-black';
      case 'white':
        return 'bg-white';
      case 'gray-50':
        return 'bg-gray-50';
      case 'gray-100':
        return 'bg-gray-100';
      default:
        return 'bg-gray-50';
    }
  };

  const getTextClass = () => {
    if (!sectionTheme?.textColor || sectionTheme.textColor === 'default') {
      return 'text-gray-900'; // Default text color
    }
    
    const color = getThemeColor(sectionTheme.textColor, theme);
    if (color) {
      return `text-[${color}]`;
    }
    
    // Fallback to Tailwind classes
    switch (sectionTheme.textColor) {
      case 'primary':
      case 'mustard':
        return 'text-mustard';
      case 'secondary':
      case 'clay':
        return 'text-clay';
      case 'offwhite':
        return 'text-offwhite';
      case 'black':
        return 'text-black';
      case 'white':
        return 'text-white';
      case 'gray-500':
        return 'text-gray-500';
      case 'gray-600':
        return 'text-gray-600';
      default:
        return 'text-gray-900';
    }
  };

  const getAccentClass = () => {
    if (!sectionTheme?.accentColor || sectionTheme.accentColor === 'default') {
      return 'text-mustard'; // Default accent color
    }
    
    const color = getThemeColor(sectionTheme.accentColor, theme);
    if (color) {
      return `text-[${color}]`;
    }
    
    // Fallback to Tailwind classes
    switch (sectionTheme.accentColor) {
      case 'primary':
      case 'mustard':
        return 'text-mustard';
      case 'secondary':
      case 'clay':
        return 'text-clay';
      case 'offwhite':
        return 'text-offwhite';
      case 'black':
        return 'text-black';
      case 'white':
        return 'text-white';
      default:
        return 'text-mustard';
    }
  };

  return {
    backgroundClass: getBackgroundClass(),
    textClass: getTextClass(),
    accentClass: getAccentClass()
  };
}

export function useSectionTheme(sectionTheme?: SectionTheme) {
  const { theme } = useTheme();
  return getThemeClasses(sectionTheme || {}, theme);
} 
// Types for configuration data (shared between client and server)

export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    foreground: string;
    mustard: string;
    clay: string;
    offwhite: string;
    black: string;
  };
  typography: {
    primaryFont: string;
    secondaryFont: string;
    sansFont: string;
    baseSize: number;
    scale: number;
  };
  spacing: {
    unit: number;
    scale: number;
  };
  effects: {
    transitionSpeed: number;
    borderRadius: number;
  };
}

export interface HomepageConfig {
  hero: {
    title: string;
    subtitle: string;
    location: string;
    showLocation: boolean;
    carouselSpeed: number;
    bannerOpacity?: number;
  };
}

export interface HomepageSection {
  id: number;
  section_type: string;
  section_data: any;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Page Builder Types
export type PageSectionType = 
  | 'hero'
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'gallery'
  | 'contact'
  | 'testimonials'
  | 'cta'
  | 'story'
  | 'hours-location'
  | 'grid'
  | 'shows'
  | 'music-elements'
  | 'divider'
  | 'social-feed'
  | 'studio-overview'
  | 'community-spotlight'


export interface PageSection {
  id: string;
  type: PageSectionType;
  content: any;
  settings?: any;
  order: number;
  isVisible: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SectionComponentProps {
  section: PageSection;
  onUpdate?: (updates: Partial<PageSection>) => void;
  onEdit?: (section: PageSection) => void;
}

export interface ThemePreset {
  id: number;
  name: string;
  description: string;
  config_data: ThemeConfig;
  is_default: boolean;
  created_at: string;
}

export interface ProductVariation {
  id: string;
  name: string;
  price: number;
  size?: string;
  color?: string;
  stockQuantity: number;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  isAvailable: boolean;
}

export interface StoreProduct {
  id: string;
  title: string;
  artist: string;
  price: number;
  description: string;
  genre: string;
  label?: string;
  year?: string;
  format?: string;
  createdAt?: string;
  image: string;
  images: { id: string; url: string }[];
  imageIds: string[];
  isVisible: boolean;
  isPreorder: boolean;
  preorderReleaseDate: string;
  preorderQuantity: number;
  preorderMaxQuantity: number;
  productType: 'record' | 'merch' | 'accessory' | 'voucher';
  merchCategory: string;
  size: string;
  color: string;
  mood: string;
  inStock: boolean;
  stockQuantity: number;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  isVariablePricing?: boolean;
  minPrice?: number;
  maxPrice?: number;
  slug?: string;
  squareId?: string;
  // New fields for variations
  variations?: ProductVariation[];
  hasVariations?: boolean;
  selectedVariationId?: string;
}

export interface PageContent {
  id: string;
  slug: string;
  title: string;
  description?: string;
  metaTitle?: string;
  metaDescription?: string;
  tags?: string[];
  sections: PageSection[];
  isPublished: boolean;
  isDraft?: boolean;
  template?: string;
  clonedFrom?: string;
  published_at?: string;
  publishAt?: string;
  unpublish_at?: string;
  unpublishAt?: string;
  lastModified?: string;
  createdAt: string;
  updatedAt: string;
  versions?: PageVersion[];
}

export const MERCH_CATEGORIES = [
  'T-Shirts',
  'Hoodies',
  'Caps',
  'Stickers',
  'Posters',
  'Tote Bags',
  'Accessories',
  'Other'
] as const;

export interface MediaItem {
  id: string;
  filename: string;
  originalName: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
  alt?: string;
  altText?: string;
  caption?: string;
  thumbnail?: string;
  tags?: string[];
  category?: string;
  dimensions?: { width: number; height: number };
}

export interface PageVersion {
  id: string;
  version: number;
  title: string;
  description?: string;
  sections: PageSection[];
  createdAt: string;
  comment?: string;
} 
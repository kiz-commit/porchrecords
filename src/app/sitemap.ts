import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';
import { PageContent } from '@/lib/types';
import { isPageScheduled } from '@/lib/page-utils';

// Load pages data
const loadPages = (): PageContent[] => {
  try {
    const pagesFile = path.join(process.cwd(), 'src', 'data', 'pages.json');
    if (fs.existsSync(pagesFile)) {
      const data = fs.readFileSync(pagesFile, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error loading pages for sitemap:', error);
    return [];
  }
};

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://porchrecords.com.au';
  
  // Static routes
  const staticRoutes = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/store`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/shows`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/cart`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
    {
      url: `${baseUrl}/checkout`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ];

  // Dynamic pages
  const pages = loadPages();
  const publishedPages = pages.filter(page => 
    page.isPublished && 
    !isPageScheduled(page) &&
    page.slug !== 'home' // Exclude home page as it's already in static routes
  );

  const dynamicRoutes = publishedPages.map(page => ({
    url: `${baseUrl}/${page.slug}`,
    lastModified: new Date(page.lastModified || page.createdAt || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...dynamicRoutes];
} 
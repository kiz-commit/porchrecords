import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PageContent } from '@/lib/types';
import { isPageScheduled } from '@/lib/page-utils';
import SectionRenderer from '@/components/PageBuilder/SectionRenderer';
import Navigation from '@/components/Navigation';
import { getDatabase, initializeDatabase } from '@/lib/database';

// Initialize database on first request
let isInitialized = false;

async function ensureDatabase() {
  if (!isInitialized) {
    await initializeDatabase();
    isInitialized = true;
  }
}

// Load pages data from database
const loadPages = async (): Promise<PageContent[]> => {
  try {
    await ensureDatabase();
    const database = await getDatabase();
    
    const pages = await database.all('SELECT * FROM pages WHERE is_published = 1');
    
    return pages.map((row: any) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      description: row.description || '',
      metaTitle: row.meta_title,
      metaDescription: row.meta_description,
      isPublished: Boolean(row.is_published),
      lastModified: row.last_modified,
      createdAt: row.created_at,
      updatedAt: row.last_modified || row.created_at,
      sections: JSON.parse(row.sections || '[]'),
      tags: JSON.parse(row.tags || '[]'),
      published_at: row.publish_at,
      unpublish_at: row.unpublish_at
    }));
  } catch (error) {
    console.error('Error loading pages:', error);
    return [];
  }
};

// Generate metadata for the page
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const pages = await loadPages();
  const page = pages.find(p => p.slug === slug && p.isPublished && !isPageScheduled(p));

  if (!page) {
    return {
      title: 'Page Not Found | Porch Records',
      description: 'The requested page could not be found.',
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://porchrecords.com.au';
  const pageUrl = `${baseUrl}/${page.slug}`;

  return {
    title: page.metaTitle || `${page.title} | Porch Records`,
    description: page.metaDescription || page.description,
    keywords: page.tags?.join(', ') || 'music, vinyl, records, Adelaide, Porch Records',
    authors: [{ name: 'Porch Records' }],
    creator: 'Porch Records',
    publisher: 'Porch Records',
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: page.metaTitle || page.title,
      description: page.metaDescription || page.description,
      url: pageUrl,
      siteName: 'Porch Records',
      locale: 'en_AU',
      type: 'website',
      images: [
        {
          url: '/logo.png',
          width: 1200,
          height: 630,
          alt: 'Porch Records',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.metaTitle || page.title,
      description: page.metaDescription || page.description,
      images: ['/logo.png'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

// Generate static params for all published pages
export async function generateStaticParams() {
  const pages = await loadPages();
  const publishedPages = pages.filter(page => 
    page.isPublished && 
    !isPageScheduled(page)
  );
  
  return publishedPages.map((page) => ({
    slug: page.slug,
  }));
}

// Revalidate pages every hour
export const revalidate = 3600;

export default async function DynamicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pages = await loadPages();
  const page = pages.find(p => p.slug === slug && p.isPublished && !isPageScheduled(p));

  if (!page) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-orange-100 text-black">
      <Navigation />
      {/* Page Content */}
      {page.sections
        .filter(section => section.isVisible)
        .sort((a, b) => a.order - b.order)
        .map(section => (
          ["hero", "fullWidthContent"].includes(section.type) ? (
            <SectionRenderer
              key={section.id}
              section={section}
              isPreview={false}
            />
          ) : null
        ))}
      <div className="max-w-7xl mx-auto">
        {page.sections
          .filter(section => section.isVisible)
          .sort((a, b) => a.order - b.order)
          .map(section => (
            ["hero", "fullWidthContent"].includes(section.type) ? null : (
              <SectionRenderer
                key={section.id}
                section={section}
                isPreview={false}
              />
            )
          ))}
      </div>
    </div>
  );
} 
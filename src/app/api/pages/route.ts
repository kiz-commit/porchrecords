import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, initializeDatabase } from '@/lib/database';
import { PageContent } from '@/lib/types';
import { createSuccessResponse, createErrorResponse, checkRateLimit } from '@/lib/api-validation';

// Initialize database on first request
let isInitialized = false;

async function ensureDatabase() {
  if (!isInitialized) {
    await initializeDatabase();
    isInitialized = true;
  }
}

// GET - Fetch pages (public endpoint)
export async function GET(request: NextRequest) {
  try {
    await ensureDatabase();
    
    // Check rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIp, 1000, 60000)) {
      return createErrorResponse('Rate limit exceeded', 429);
    }

    const database = await getDatabase();
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const published = searchParams.get('published') || 'true'; // Default to published only
    
    let query = 'SELECT * FROM pages WHERE is_published = 1';
    const params: any[] = [];
    
    // Add slug filter if provided
    if (slug) {
      query += ' AND slug = ?';
      params.push(slug);
    }
    
    // Add ordering
    query += ' ORDER BY last_modified DESC';
    
    const pages = await database.all(query, params);
    
    // Transform database rows to PageContent format
    const transformedPages: PageContent[] = pages.map((row: any) => ({
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
    
    // If slug was provided, return single page or null
    if (slug) {
      return createSuccessResponse(transformedPages[0] || null);
    }
    
    // Otherwise return all published pages
    return createSuccessResponse(transformedPages);
  } catch (error) {
    console.error('Error fetching pages:', error);
    return createErrorResponse('Failed to fetch pages');
  }
} 
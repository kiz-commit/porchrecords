import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, initializeDatabase } from '@/lib/database';
import { 
  validatePage, 
  createValidationErrorResponse, 
  createSuccessResponse, 
  createErrorResponse,
  sanitizeForDatabase,
  checkRateLimit
} from '@/lib/api-validation';
import { PageContent } from '@/lib/types';
import { withAdminAuth } from '@/lib/route-protection';

// Initialize database on first request
let isInitialized = false;

async function ensureDatabase() {
  if (!isInitialized) {
    await initializeDatabase();
    isInitialized = true;
  }
}

// GET - Fetch all pages
async function getHandler(request: NextRequest) {
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
    const published = searchParams.get('published');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');
    
    let query = 'SELECT * FROM pages';
    const params: any[] = [];
    const conditions: string[] = [];
    
    // Add filters
    if (published !== null) {
      conditions.push('is_published = ?');
      params.push(published === 'true' ? 1 : 0);
    }
    
    if (search) {
      conditions.push('(title LIKE ? OR description LIKE ? OR slug LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    // Add ordering and pagination
    query += ' ORDER BY last_modified DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const pages = await database.all(query, params);
    
    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM pages';
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    const [{ total }] = await database.all(countQuery, params.slice(0, -2));
    
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
    
    return createSuccessResponse({
      pages: transformedPages,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    });
  } catch (error) {
    console.error('Error fetching pages:', error);
    return createErrorResponse('Failed to fetch pages');
  }
}

// POST - Create or update a page
async function postHandler(request: NextRequest) {
  try {
    await ensureDatabase();
    
    // Check rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIp, 100, 60000)) {
      return createErrorResponse('Rate limit exceeded', 429);
    }

    const pageData = await request.json();
    
    // Validate page data
    const validation = validatePage(pageData);
    if (!validation.isValid) {
      return createValidationErrorResponse(validation.errors);
    }
    
    // Sanitize data for database
    const sanitizedData = sanitizeForDatabase(pageData);
    
    const database = await getDatabase();
    
    // Check if page already exists
    const existingPage = await database.get(
      'SELECT id FROM pages WHERE id = ?',
      [sanitizedData.id]
    );
    
    const now = new Date().toISOString();
    const isUpdate = !!existingPage;
    
    if (isUpdate) {
      // Update existing page
      await database.run(`
        UPDATE pages SET
          title = ?,
          slug = ?,
          description = ?,
          meta_title = ?,
          meta_description = ?,
          is_published = ?,
          is_draft = ?,
          sections = ?,
          versions = ?,
          template = ?,
          tags = ?,
          publish_at = ?,
          unpublish_at = ?,
          cloned_from = ?,
          last_modified = ?
        WHERE id = ?
      `, [
        sanitizedData.title,
        sanitizedData.slug,
        sanitizedData.description || '',
        sanitizedData.metaTitle || '',
        sanitizedData.metaDescription || '',
        sanitizedData.isPublished ? 1 : 0,
        sanitizedData.isDraft ? 1 : 0,
        JSON.stringify(sanitizedData.sections || []),
        JSON.stringify(sanitizedData.versions || []),
        sanitizedData.template || '',
        JSON.stringify(sanitizedData.tags || []),
        sanitizedData.publishAt || null,
        sanitizedData.unpublishAt || null,
        sanitizedData.clonedFrom || null,
        now,
        sanitizedData.id
      ]);
    } else {
      // Create new page
      await database.run(`
        INSERT INTO pages (
          id, title, slug, description, meta_title, meta_description,
          is_published, is_draft, sections, versions, template, tags,
          publish_at, unpublish_at, cloned_from, created_at, last_modified
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        sanitizedData.id,
        sanitizedData.title,
        sanitizedData.slug,
        sanitizedData.description || '',
        sanitizedData.metaTitle || '',
        sanitizedData.metaDescription || '',
        sanitizedData.isPublished ? 1 : 0,
        sanitizedData.isDraft ? 1 : 0,
        JSON.stringify(sanitizedData.sections || []),
        JSON.stringify(sanitizedData.versions || []),
        sanitizedData.template || '',
        JSON.stringify(sanitizedData.tags || []),
        sanitizedData.publishAt || null,
        sanitizedData.unpublishAt || null,
        sanitizedData.clonedFrom || null,
        sanitizedData.createdAt || now,
        now
      ]);
    }
    
    return createSuccessResponse(
      { id: sanitizedData.id },
      isUpdate ? 'Page updated successfully' : 'Page created successfully'
    );
  } catch (error) {
    console.error('Error saving page:', error);
    
    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('UNIQUE constraint failed')) {
        return createErrorResponse('A page with this slug already exists', 409);
      }
      if (error.message.includes('FOREIGN KEY constraint failed')) {
        return createErrorResponse('Referenced data not found', 400);
      }
    }
    
    return createErrorResponse('Failed to save page');
  }
}

// DELETE - Delete a page
async function deleteHandler(request: NextRequest) {
  try {
    await ensureDatabase();
    
    // Check rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIp, 50, 60000)) {
      return createErrorResponse('Rate limit exceeded', 429);
    }

    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('id');
    
    if (!pageId) {
      return createErrorResponse('Page ID is required', 400);
    }
    
    const database = await getDatabase();
    
    // Check if page exists
    const existingPage = await database.get(
      'SELECT id FROM pages WHERE id = ?',
      [pageId]
    );
    
    if (!existingPage) {
      return createErrorResponse('Page not found', 404);
    }
    
    // Delete the page
    await database.run('DELETE FROM pages WHERE id = ?', [pageId]);
    
    return createSuccessResponse(
      { id: pageId },
      'Page deleted successfully'
    );
  } catch (error) {
    console.error('Error deleting page:', error);
    return createErrorResponse('Failed to delete page');
  }
}

// PATCH - Update specific page fields
async function patchHandler(request: NextRequest) {
  try {
    await ensureDatabase();
    
    // Check rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(clientIp, 200, 60000)) {
      return createErrorResponse('Rate limit exceeded', 429);
    }

    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('id');
    
    if (!pageId) {
      return createErrorResponse('Page ID is required', 400);
    }
    
    const updates = await request.json();
    
    if (!updates || typeof updates !== 'object') {
      return createErrorResponse('Invalid update data', 400);
    }
    
    const database = await getDatabase();
    
    // Check if page exists
    const existingPage = await database.get(
      'SELECT id FROM pages WHERE id = ?',
      [pageId]
    );
    
    if (!existingPage) {
      return createErrorResponse('Page not found', 404);
    }
    
    // Build dynamic update query
    const allowedFields = [
      'title', 'slug', 'description', 'meta_title', 'meta_description',
      'is_published', 'is_draft', 'sections', 'versions', 'template',
      'tags', 'publish_at', 'unpublish_at', 'cloned_from'
    ];
    
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    
    for (const [key, value] of Object.entries(updates)) {
      const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowedFields.includes(dbField)) {
        updateFields.push(`${dbField} = ?`);
        
        // Handle special field types
        if (dbField === 'sections' || dbField === 'versions' || dbField === 'tags') {
          updateValues.push(JSON.stringify(value));
        } else if (dbField === 'is_published' || dbField === 'is_draft') {
          updateValues.push(value ? 1 : 0);
        } else {
          updateValues.push(value);
        }
      }
    }
    
    if (updateFields.length === 0) {
      return createErrorResponse('No valid fields to update', 400);
    }
    
    // Add last_modified timestamp
    updateFields.push('last_modified = ?');
    updateValues.push(new Date().toISOString());
    
    // Add page ID for WHERE clause
    updateValues.push(pageId);
    
    const query = `UPDATE pages SET ${updateFields.join(', ')} WHERE id = ?`;
    await database.run(query, updateValues);
    
    return createSuccessResponse(
      { id: pageId },
      'Page updated successfully'
    );
  } catch (error) {
    console.error('Error updating page:', error);
    
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return createErrorResponse('A page with this slug already exists', 409);
    }
    
    return createErrorResponse('Failed to update page');
  }
}

// Export with admin authentication
export const GET = withAdminAuth(getHandler);
export const POST = withAdminAuth(postHandler, true);
export const DELETE = withAdminAuth(deleteHandler, true);
export const PATCH = withAdminAuth(patchHandler, true); 
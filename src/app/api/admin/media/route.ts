import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { MediaItem } from '@/lib/types';
import { withAdminAuth } from '@/lib/route-protection';

const MEDIA_DIR = path.join(process.cwd(), 'public', 'media');
const MEDIA_DATA_FILE = path.join(process.cwd(), 'src', 'data', 'media.json');

// Ensure media directory exists
async function ensureMediaDir() {
  try {
    await fs.access(MEDIA_DIR);
  } catch {
    await fs.mkdir(MEDIA_DIR, { recursive: true });
  }
}

// Load media data from JSON file
async function loadMediaData(): Promise<MediaItem[]> {
  try {
    const data = await fs.readFile(MEDIA_DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save media data to JSON file
async function saveMediaData(media: MediaItem[]) {
  await fs.writeFile(MEDIA_DATA_FILE, JSON.stringify(media, null, 2));
}

// GET /api/admin/media - List all media items
async function getHandler() {
  try {
    await ensureMediaDir();
    const media = await loadMediaData();
    
    return NextResponse.json({ 
      success: true, 
      media,
      total: media.length 
    });
  } catch (error) {
    console.error('Error loading media:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load media' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/media - Delete media items
async function deleteHandler(request: NextRequest) {
  try {
    const { ids } = await request.json();
    
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid media IDs' },
        { status: 400 }
      );
    }

    const media = await loadMediaData();
    const itemsToDelete = media.filter(item => ids.includes(item.id));
    const remainingMedia = media.filter(item => !ids.includes(item.id));

    // Delete files from filesystem
    for (const item of itemsToDelete) {
      try {
        const filePath = path.join(MEDIA_DIR, item.name);
        await fs.unlink(filePath);
        
        // Delete thumbnail if it exists
        if (item.thumbnail) {
          const thumbnailPath = path.join(MEDIA_DIR, 'thumbnails', item.name);
          await fs.unlink(thumbnailPath).catch(() => {}); // Ignore errors for thumbnails
        }
      } catch (error) {
        console.warn(`Failed to delete file ${item.name}:`, error);
      }
    }

    // Save updated media data
    await saveMediaData(remainingMedia);

    return NextResponse.json({ 
      success: true, 
      deleted: itemsToDelete.length,
      remaining: remainingMedia.length 
    });
  } catch (error) {
    console.error('Error deleting media:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete media' },
      { status: 500 }
    );
  }
}

// Export with admin authentication
export const GET = withAdminAuth(getHandler);
export const DELETE = withAdminAuth(deleteHandler, true); 
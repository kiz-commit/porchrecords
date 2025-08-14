import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { nanoid } from 'nanoid';
import { MediaItem } from '@/lib/types';
import { withAdminAuth } from '@/lib/route-protection';

const MEDIA_DIR = path.join(process.cwd(), 'public', 'media');
const THUMBNAIL_DIR = path.join(MEDIA_DIR, 'thumbnails');

// Ensure directories exist
async function ensureDirectories() {
  await mkdir(MEDIA_DIR, { recursive: true });
  await mkdir(THUMBNAIL_DIR, { recursive: true });
}

// Get file type based on MIME type
function getFileType(mimeType: string): 'image' | 'video' | 'audio' | 'document' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
}

// Get file category based on type
function getFileCategory(type: string): string {
  switch (type) {
    case 'image': return 'images';
    case 'video': return 'videos';
    case 'audio': return 'audio';
    case 'document': return 'documents';
    default: return 'documents';
  }
}

// Generate tags from filename
function generateTags(filename: string): string[] {
  const name = path.parse(filename).name.toLowerCase();
  const tags = new Set<string>();
  
  // Add common tags based on filename patterns
  if (name.includes('logo')) tags.add('logo');
  if (name.includes('hero')) tags.add('hero');
  if (name.includes('banner')) tags.add('banner');
  if (name.includes('product')) tags.add('product');
  if (name.includes('event')) tags.add('event');
  if (name.includes('show')) tags.add('show');
  if (name.includes('album')) tags.add('album');
  if (name.includes('cover')) tags.add('cover');
  if (name.includes('artwork')) tags.add('artwork');
  
  // Add file extension as tag
  const ext = path.extname(filename).toLowerCase().slice(1);
  if (ext) tags.add(ext);
  
  return Array.from(tags);
}

// Create thumbnail for images (simplified version)
async function createThumbnail(filePath: string, filename: string): Promise<string | undefined> {
  try {
    // For now, we'll just return the original image path
    // In a production environment, you'd want to use a library like sharp to create actual thumbnails
    return `/media/${filename}`;
  } catch (error) {
    console.warn('Failed to create thumbnail:', error);
    return undefined;
  }
}

// Load existing media data
async function loadMediaData(): Promise<MediaItem[]> {
  try {
    const dataPath = path.join(process.cwd(), 'src', 'data', 'media.json');
    const data = await import('fs/promises').then(fs => fs.readFile(dataPath, 'utf-8'));
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Save media data
async function saveMediaData(media: MediaItem[]) {
  const dataPath = path.join(process.cwd(), 'src', 'data', 'media.json');
  await import('fs/promises').then(fs => fs.writeFile(dataPath, JSON.stringify(media, null, 2)));
}

// POST /api/admin/media/upload - Upload media files
async function postHandler(request: NextRequest) {
  try {
    await ensureDirectories();
    
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      );
    }

    const uploadedMedia: MediaItem[] = [];
    const existingMedia = await loadMediaData();

    for (const file of files) {
      try {
        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File ${file.name} is too large (max 10MB)`);
        }

        // Generate unique filename
        const ext = path.extname(file.name);
        const baseName = path.parse(file.name).name;
        const uniqueName = `${baseName}-${nanoid(8)}${ext}`;
        
        // Save file to filesystem
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filePath = path.join(MEDIA_DIR, uniqueName);
        await writeFile(filePath, buffer);

        // Determine file type and category
        const type = getFileType(file.type);
        const category = getFileCategory(type);

        // Create thumbnail for images
        const thumbnail = type === 'image' ? await createThumbnail(filePath, uniqueName) : undefined;

        // Generate tags
        const tags = generateTags(file.name);

        // Create media item
        const mediaItem: MediaItem = {
          id: nanoid(),
          filename: uniqueName,
          originalName: file.name,
          name: uniqueName,
          type,
          url: `/media/${uniqueName}`,
          thumbnail,
          size: file.size,
          uploadedAt: new Date().toISOString(),
          tags,
          category,
        };

        // Add dimensions for images (simplified)
        if (type === 'image') {
          // In a real implementation, you'd extract actual dimensions
          mediaItem.dimensions = { width: 800, height: 600 };
        }

        uploadedMedia.push(mediaItem);
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        // Continue with other files even if one fails
      }
    }

    // Save updated media data
    const updatedMedia = [...existingMedia, ...uploadedMedia];
    await saveMediaData(updatedMedia);

    return NextResponse.json({
      success: true,
      uploadedMedia,
      total: uploadedMedia.length,
      message: `Successfully uploaded ${uploadedMedia.length} file(s)`
    });

  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload files' },
      { status: 500 }
    );
  }
}

// Export with admin authentication
export const POST = withAdminAuth(postHandler, true); 
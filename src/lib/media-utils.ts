import { MediaItem } from '@/lib/types';

// Media validation functions
export const validateFile = (file: File): { valid: boolean; error?: string } => {
  // Check file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }

  // Check file type
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'video/ogg',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not supported' };
  }

  return { valid: true };
};

// Get file type category
export const getFileCategory = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'images';
  if (mimeType.startsWith('video/')) return 'videos';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'documents';
};

// Generate unique filename
export const generateUniqueFilename = (originalName: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = originalName.split('.').pop();
  const name = originalName.split('.').slice(0, -1).join('.');
  
  return `${name}-${timestamp}-${random}.${ext}`;
};

// Extract image dimensions (placeholder - would use sharp in production)
export const getImageDimensions = async (file: File): Promise<{ width: number; height: number } | null> => {
  if (!file.type.startsWith('image/')) return null;

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = URL.createObjectURL(file);
  });
};

// Generate tags from filename and content
export const generateTags = (filename: string, content?: string): string[] => {
  const tags = new Set<string>();
  const name = filename.toLowerCase();
  
  // Common patterns
  const patterns = [
    { pattern: /logo/i, tag: 'logo' },
    { pattern: /hero/i, tag: 'hero' },
    { pattern: /banner/i, tag: 'banner' },
    { pattern: /product/i, tag: 'product' },
    { pattern: /event/i, tag: 'event' },
    { pattern: /show/i, tag: 'show' },
    { pattern: /album/i, tag: 'album' },
    { pattern: /cover/i, tag: 'cover' },
    { pattern: /artwork/i, tag: 'artwork' },
    { pattern: /background/i, tag: 'background' },
    { pattern: /icon/i, tag: 'icon' },
    { pattern: /thumbnail/i, tag: 'thumbnail' },
  ];

  patterns.forEach(({ pattern, tag }) => {
    if (pattern.test(name)) tags.add(tag);
  });

  // Add file extension
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext) tags.add(ext);

  // Add content-based tags if available
  if (content) {
    const contentLower = content.toLowerCase();
    if (contentLower.includes('vinyl')) tags.add('vinyl');
    if (contentLower.includes('record')) tags.add('record');
    if (contentLower.includes('music')) tags.add('music');
    if (contentLower.includes('jazz')) tags.add('jazz');
    if (contentLower.includes('funk')) tags.add('funk');
    if (contentLower.includes('soul')) tags.add('soul');
  }

  return Array.from(tags);
};

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get file icon based on type
export const getFileIcon = (type: string): string => {
  switch (type) {
    case 'image': return '🖼️';
    case 'video': return '🎥';
    case 'audio': return '🎵';
    case 'document': return '📄';
    default: return '📁';
  }
};

// Filter media items
export const filterMedia = (
  items: MediaItem[],
  searchTerm: string,
  category: string,
  tags: string[] = []
): MediaItem[] => {
  let filtered = items;

  // Filter by category
  if (category !== 'all') {
    filtered = filtered.filter(item => item.category === category);
  }

  // Filter by search term
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(item =>
      item.name.toLowerCase().includes(term) ||
      (item.tags && item.tags.some(tag => tag.toLowerCase().includes(term)))
    );
  }

  // Filter by tags
  if (tags.length > 0) {
    filtered = filtered.filter(item =>
      tags.some(tag => item.tags && item.tags.includes(tag))
    );
  }

  return filtered;
};

// Sort media items
export const sortMedia = (items: MediaItem[], sortBy: string, sortOrder: 'asc' | 'desc' = 'desc'): MediaItem[] => {
  const sorted = [...items];

  switch (sortBy) {
    case 'name':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'size':
      sorted.sort((a, b) => a.size - b.size);
      break;
    case 'date':
      sorted.sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime());
      break;
    case 'type':
      sorted.sort((a, b) => a.type.localeCompare(b.type));
      break;
    default:
      sorted.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  return sortOrder === 'desc' ? sorted.reverse() : sorted;
};

// Create media item from file
export const createMediaItem = async (
  file: File,
  url: string,
  thumbnail?: string
): Promise<MediaItem> => {
  const type = getFileType(file.type);
  const category = getFileCategory(file.type);
  const tags = generateTags(file.name);
  const dimensions = await getImageDimensions(file) || undefined;

  return {
    id: crypto.randomUUID(),
    name: file.name,
    filename: file.name,
    originalName: file.name,
    type,
    url,
    thumbnail,
    size: file.size,
    dimensions,
    uploadedAt: new Date().toISOString(),
    tags,
    category,
  };
};

// Get file type from MIME type
export const getFileType = (mimeType: string): 'image' | 'video' | 'audio' | 'document' => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
};

// Validate media item
export const validateMediaItem = (item: MediaItem): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!item.id) errors.push('Missing ID');
  if (!item.name) errors.push('Missing name');
  if (!item.url) errors.push('Missing URL');
  if (!item.type) errors.push('Missing type');
  if (!item.category) errors.push('Missing category');
  if (item.size <= 0) errors.push('Invalid file size');
  if (!item.uploadedAt) errors.push('Missing upload date');
  if (!Array.isArray(item.tags)) errors.push('Tags must be an array');

  return {
    valid: errors.length === 0,
    errors
  };
};

// Get media statistics
export const getMediaStats = (items: MediaItem[]) => {
  const stats = {
    total: items.length,
    byType: {
      image: 0,
      video: 0,
      audio: 0,
      document: 0,
    },
    byCategory: {
      images: 0,
      videos: 0,
      audio: 0,
      documents: 0,
    },
    totalSize: 0,
    averageSize: 0,
  };

  items.forEach(item => {
    stats.byType[item.type as keyof typeof stats.byType]++;
    if (item.category && item.category in stats.byCategory) {
      stats.byCategory[item.category as keyof typeof stats.byCategory]++;
    }
    stats.totalSize += item.size;
  });

  stats.averageSize = stats.total > 0 ? stats.totalSize / stats.total : 0;

  return stats;
}; 
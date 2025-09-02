/**
 * Utility functions for generating and handling SEO-friendly slugs
 */

export function generateSlug(title: string, artist?: string): string {
  // Combine title and artist if available
  let text = title;
  if (artist && artist !== 'Unknown Artist') {
    text = `${title} ${artist}`;
  }
  
  return text
    .toLowerCase()
    .trim()
    // Replace special characters and spaces with hyphens
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    // Remove multiple consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading and trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Limit length to 60 characters
    .substring(0, 60);
}

export function generateUniqueSlug(title: string, artist?: string, existingSlugs: string[] = []): string {
  const baseSlug = generateSlug(title, artist);
  
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }
  
  // If slug exists, append a number
  let counter = 1;
  let uniqueSlug = `${baseSlug}-${counter}`;
  
  while (existingSlugs.includes(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }
  
  return uniqueSlug;
}

export function isValidSlug(slug: string): boolean {
  // Check if the slug matches the expected format
  return /^[a-z0-9-]+$/.test(slug) && slug.length > 0 && slug.length <= 60;
}





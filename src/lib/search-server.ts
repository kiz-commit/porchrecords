import { readFileSync } from 'fs';
import { join } from 'path';
import Database from 'better-sqlite3';
import { SearchResult } from './search-utils';

export interface SearchOptions {
  query: string;
  limit?: number;
  offset?: number;
  types?: ('product' | 'show' | 'page')[];
}

// Load data primarily from SQLite database; fall back to JSON files if DB unavailable
const loadData = () => {
  // Attempt to read from database first for freshest data
  try {
    const db = new Database('data/porchrecords.db', { readonly: true });

    // Products
    const productRows = db.prepare(`
      SELECT 
        id,
        title,
        description,
        image,
        artist,
        genre,
        product_type AS productType,
        slug
      FROM products
      WHERE 1 = 1
    `).all() as any[];

    // Shows (only published or with sensible flags; search will re-filter)
    const showRows = db.prepare(`
      SELECT 
        id,
        title,
        description,
        date,
        location,
        image,
        is_published AS isPublished,
        is_past AS isPast
      FROM shows
    `).all() as any[];

    // Pages (only published pages are searched later)
    const pageRows = db.prepare(`
      SELECT 
        id,
        title,
        slug,
        description,
        sections,
        is_published AS isPublished
      FROM pages
    `).all() as any[];

    db.close();

    // Normalize minimal fields used by search helpers
    const products = productRows.map((p) => ({
      id: p.id,
      title: p.title || 'No title',
      description: p.description || '',
      image: p.image || '/store.webp',
      artist: p.artist || 'Unknown Artist',
      genre: p.genre || 'Uncategorized',
      productType: p.productType || 'record',
      slug: p.slug || ''
    }));

    const shows = showRows.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description || '',
      date: s.date || null,
      location: s.location || '',
      image: s.image || '',
      isPublished: Boolean(s.isPublished),
      isPast: Boolean(s.isPast)
    }));

    const pages = pageRows.map((pg) => ({
      id: pg.id,
      title: pg.title,
      slug: pg.slug,
      description: pg.description || '',
      sections: (() => {
        try { return JSON.parse(pg.sections || '[]'); } catch { return []; }
      })(),
      isPublished: Boolean(pg.isPublished)
    }));

    return { products, shows, pages };
  } catch (dbError) {
    // Fallback to JSON files (dev or first-run scenarios)
    try {
      const products = JSON.parse(readFileSync(join(process.cwd(), 'src/data/products.json'), 'utf8'));
      const shows = JSON.parse(readFileSync(join(process.cwd(), 'src/data/shows.json'), 'utf8'));
      const pages = JSON.parse(readFileSync(join(process.cwd(), 'src/data/pages.json'), 'utf8'));
      return { products, shows, pages };
    } catch (jsonError) {
      console.error('Error loading search data (DB and JSON failed):', jsonError);
      return { products: [], shows: [], pages: [] };
    }
  }
};

// Calculate relevance score based on match quality
const calculateRelevance = (query: string, text: string, fieldType: 'title' | 'content' | 'metadata'): number => {
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  
  // Exact title match gets highest score
  if (fieldType === 'title' && textLower === queryLower) {
    return 100;
  }
  
  // Title starts with query
  if (fieldType === 'title' && textLower.startsWith(queryLower)) {
    return 90;
  }
  
  // Title contains query
  if (fieldType === 'title' && textLower.includes(queryLower)) {
    return 80;
  }
  
  // Content contains query
  if (fieldType === 'content' && textLower.includes(queryLower)) {
    return 60;
  }
  
  // Metadata contains query
  if (fieldType === 'metadata' && textLower.includes(queryLower)) {
    return 40;
  }
  
  // Partial word matches
  const queryWords = queryLower.split(/\s+/);
  const textWords = textLower.split(/\s+/);
  
  let wordMatches = 0;
  queryWords.forEach(word => {
    if (textWords.some(textWord => textWord.includes(word))) {
      wordMatches++;
    }
  });
  
  if (wordMatches > 0) {
    const matchRatio = wordMatches / queryWords.length;
    return Math.floor(matchRatio * 50) + (fieldType === 'title' ? 20 : 0);
  }
  
  return 0;
};

// Search products
const searchProducts = (products: any[], query: string): SearchResult[] => {
  return products
    .map(product => {
      const titleScore = calculateRelevance(query, product.title, 'title');
      const artistScore = calculateRelevance(query, product.artist || '', 'metadata');
      const genreScore = calculateRelevance(query, product.genre || '', 'metadata');
      const descriptionScore = calculateRelevance(query, product.description || '', 'content');
      
      const totalScore = Math.max(titleScore, artistScore, genreScore, descriptionScore);
      const matchedFields = [];
      
      if (titleScore > 0) matchedFields.push('title');
      if (artistScore > 0) matchedFields.push('artist');
      if (genreScore > 0) matchedFields.push('genre');
      if (descriptionScore > 0) matchedFields.push('description');
      
      return {
        id: product.id,
        type: 'product' as const,
        title: product.title,
        description: product.description,
        url: product.productType === 'voucher' ? `/store/voucher-product/${product.id}` : `/store/${product.slug || product.id}`,
        relevance: totalScore,
        matchedFields,
        image: product.image,
        artist: product.artist,
        genre: product.genre
      };
    })
    .filter(result => result.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance);
};

// Search shows
const searchShows = (shows: any[], query: string): SearchResult[] => {
  return shows
    .filter(show => show.isPublished !== false) // Only search published shows
    .map(show => {
      const titleScore = calculateRelevance(query, show.title, 'title');
      const descriptionScore = calculateRelevance(query, show.description || '', 'content');
      const locationScore = calculateRelevance(query, show.location || '', 'metadata');
      
      const totalScore = Math.max(titleScore, descriptionScore, locationScore);
      const matchedFields = [];
      
      if (titleScore > 0) matchedFields.push('title');
      if (descriptionScore > 0) matchedFields.push('description');
      if (locationScore > 0) matchedFields.push('location');
      
      return {
        id: show.id,
        type: 'show' as const,
        title: show.title,
        description: show.description,
        url: `/shows/${show.id}`,
        relevance: totalScore,
        matchedFields,
        image: show.image,
        date: show.date
      };
    })
    .filter(result => result.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance);
};

// Search pages
const searchPages = (pages: any[], query: string): SearchResult[] => {
  return pages
    .filter(page => page.isPublished !== false) // Only search published pages
    .map(page => {
      const titleScore = calculateRelevance(query, page.title, 'title');
      const slugScore = calculateRelevance(query, page.slug || '', 'metadata');
      
      // Search through page content (sections)
      let contentScore = 0;
      const contentText = page.sections?.map((section: any) => {
        if (section.type === 'text') return section.content?.text || '';
        if (section.type === 'hero') return section.content?.title || '';
        if (section.type === 'gallery') return section.content?.title || '';
        return '';
      }).join(' ') || '';
      
      contentScore = calculateRelevance(query, contentText, 'content');
      
      const totalScore = Math.max(titleScore, slugScore, contentScore);
      const matchedFields = [];
      
      if (titleScore > 0) matchedFields.push('title');
      if (slugScore > 0) matchedFields.push('slug');
      if (contentScore > 0) matchedFields.push('content');
      
      return {
        id: page.id,
        type: 'page' as const,
        title: page.title,
        description: contentText.substring(0, 150) + (contentText.length > 150 ? '...' : ''),
        url: `/${page.slug}`,
        relevance: totalScore,
        matchedFields
      };
    })
    .filter(result => result.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance);
};

// Main search function
export const performSearch = (options: SearchOptions): SearchResult[] => {
  const { query, limit = 20, offset = 0, types = ['product', 'show', 'page'] } = options;
  
  if (!query.trim()) {
    return [];
  }
  
  const { products, shows, pages } = loadData();
  const results: SearchResult[] = [];
  
  // Search each type if specified
  if (types.includes('product')) {
    results.push(...searchProducts(products, query));
  }
  
  if (types.includes('show')) {
    results.push(...searchShows(shows, query));
  }
  
  if (types.includes('page')) {
    results.push(...searchPages(pages, query));
  }
  
  // Sort by relevance and apply pagination
  return results
    .sort((a, b) => b.relevance - a.relevance)
    .slice(offset, offset + limit);
};

// Get search suggestions for autocomplete
export const getSearchSuggestions = (query: string, limit = 5): string[] => {
  if (!query.trim()) return [];
  
  const { products, shows, pages } = loadData();
  const suggestions = new Set<string>();
  
  // Add product titles
  products.forEach((product: any) => {
    if (product.title.toLowerCase().includes(query.toLowerCase())) {
      suggestions.add(product.title);
    }
  });
  
  // Add show titles
  shows.filter((show: any) => show.isPublished !== false).forEach((show: any) => {
    if (show.title.toLowerCase().includes(query.toLowerCase())) {
      suggestions.add(show.title);
    }
  });
  
  // Add page titles
  pages.filter((page: any) => page.isPublished !== false).forEach((page: any) => {
    if (page.title.toLowerCase().includes(query.toLowerCase())) {
      suggestions.add(page.title);
    }
  });
  
  return Array.from(suggestions).slice(0, limit);
}; 
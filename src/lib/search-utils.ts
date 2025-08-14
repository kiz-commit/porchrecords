export interface SearchResult {
  id: string;
  type: 'product' | 'show' | 'page';
  title: string;
  description?: string;
  url: string;
  relevance: number;
  matchedFields: string[];
  image?: string;
  date?: string;
  artist?: string;
  genre?: string;
}

export interface SearchOptions {
  query: string;
  limit?: number;
  offset?: number;
  types?: ('product' | 'show' | 'page')[];
}

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

// Client-side utility functions only

// Highlight search terms in text
export const highlightSearchTerms = (text: string, query: string): string => {
  if (!query.trim()) return text;
  
  const queryWords = query.toLowerCase().split(/\s+/);
  let highlightedText = text;
  
  queryWords.forEach(word => {
    const regex = new RegExp(`(${word})`, 'gi');
    highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
  });
  
  return highlightedText;
}; 
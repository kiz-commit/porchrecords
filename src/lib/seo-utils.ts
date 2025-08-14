export interface SEOScore {
  overall: number;
  title: number;
  description: number;
  headings: number;
  content: number;
  images: number;
  links: number;
  mobile: number;
  speed: number;
  details: {
    title: {
      score: number;
      issues: string[];
      suggestions: string[];
    };
    description: {
      score: number;
      issues: string[];
      suggestions: string[];
    };
    headings: {
      score: number;
      issues: string[];
      suggestions: string[];
    };
    content: {
      score: number;
      issues: string[];
      suggestions: string[];
    };
    images: {
      score: number;
      issues: string[];
      suggestions: string[];
    };
    links: {
      score: number;
      issues: string[];
      suggestions: string[];
    };
    mobile: {
      score: number;
      issues: string[];
      suggestions: string[];
    };
    speed: {
      score: number;
      issues: string[];
      suggestions: string[];
    };
  };
}

export interface MetaTags {
  title: string;
  description: string;
  keywords: string[];
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogType: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  canonical: string;
  robots: string;
}

import { PageContent, PageSection } from './types';

// Re-export PageContent for use in components
export type { PageContent };

// SEO Analysis Functions
export function analyzeSEO(pageContent: PageContent): SEOScore {
  const title = pageContent.title || '';
  const description = pageContent.description || '';
  const slug = pageContent.slug || '';
  
  // Extract all text content from sections
  const allContent = pageContent.sections
    .map(section => {
      let content = '';
      if (section.content) content += JSON.stringify(section.content) + ' ';
      // Access settings properties safely
      const settings = section.settings as any;
      if (settings?.text) content += settings.text + ' ';
      if (settings?.heading) content += settings.heading + ' ';
      if (settings?.subheading) content += settings.subheading + ' ';
      return content;
    })
    .join(' ')
    .toLowerCase();

  // Extract headings
  const headings = pageContent.sections
    .filter(section => {
      const settings = section.settings as any;
      return section.type === 'text' || settings?.heading;
    })
    .map(section => {
      const settings = section.settings as any;
      return settings?.heading || '';
    })
    .filter(Boolean);

  // Extract images
  const images = pageContent.sections
    .filter(section => {
      const settings = section.settings as any;
      return settings?.image || settings?.backgroundImage;
    })
    .map(section => {
      const settings = section.settings as any;
      return {
        src: settings?.image || settings?.backgroundImage,
        alt: settings?.altText || '',
        title: settings?.imageTitle || ''
      };
    });

  // Extract links
  const links = pageContent.sections
    .filter(section => {
      const settings = section.settings as any;
      return settings?.url || settings?.link;
    })
    .map(section => {
      const settings = section.settings as any;
      return {
        url: settings?.url || settings?.link,
        text: settings?.linkText || ''
      };
    });

  // Calculate individual scores
  const titleScore = analyzeTitle(title, allContent);
  const descriptionScore = analyzeDescription(description);
  const headingsScore = analyzeHeadings(headings);
  const contentScore = analyzeContent(allContent);
  const imagesScore = analyzeImages(images);
  const linksScore = analyzeLinks(links);
  const mobileScore = analyzeMobile(pageContent);
  const speedScore = analyzeSpeed(pageContent);

  // Calculate overall score (weighted average)
  const overall = Math.round(
    (titleScore.score * 0.15 +
     descriptionScore.score * 0.15 +
     headingsScore.score * 0.10 +
     contentScore.score * 0.20 +
     imagesScore.score * 0.10 +
     linksScore.score * 0.05 +
     mobileScore.score * 0.15 +
     speedScore.score * 0.10)
  );

  return {
    overall,
    title: titleScore.score,
    description: descriptionScore.score,
    headings: headingsScore.score,
    content: contentScore.score,
    images: imagesScore.score,
    links: linksScore.score,
    mobile: mobileScore.score,
    speed: speedScore.score,
    details: {
      title: titleScore,
      description: descriptionScore,
      headings: headingsScore,
      content: contentScore,
      images: imagesScore,
      links: linksScore,
      mobile: mobileScore,
      speed: speedScore
    }
  };
}

function analyzeTitle(title: string, content: string): { score: number; issues: string[]; suggestions: string[] } {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  if (!title) {
    issues.push('Missing page title');
    suggestions.push('Add a descriptive page title');
    score = 0;
  } else {
    if (title.length < 30) {
      issues.push('Title is too short (less than 30 characters)');
      suggestions.push('Make title more descriptive (30-60 characters)');
      score -= 20;
    } else if (title.length > 60) {
      issues.push('Title is too long (more than 60 characters)');
      suggestions.push('Shorten title to 30-60 characters');
      score -= 15;
    }

    if (!content.toLowerCase().includes(title.toLowerCase())) {
      issues.push('Title not found in page content');
      suggestions.push('Include title keywords in page content');
      score -= 10;
    }

    if (title.includes('|') || title.includes('-')) {
      suggestions.push('Consider using a single, clear title without separators');
    }
  }

  return { score: Math.max(0, score), issues, suggestions };
}

function analyzeDescription(description: string): { score: number; issues: string[]; suggestions: string[] } {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  if (!description) {
    issues.push('Missing meta description');
    suggestions.push('Add a compelling meta description');
    score = 0;
  } else {
    if (description.length < 120) {
      issues.push('Description is too short (less than 120 characters)');
      suggestions.push('Make description more detailed (120-160 characters)');
      score -= 15;
    } else if (description.length > 160) {
      issues.push('Description is too long (more than 160 characters)');
      suggestions.push('Shorten description to 120-160 characters');
      score -= 10;
    }

    if (description.includes('...') || description.includes('…')) {
      suggestions.push('Avoid ellipsis in meta descriptions');
    }
  }

  return { score: Math.max(0, score), issues, suggestions };
}

function analyzeHeadings(headings: string[]): { score: number; issues: string[]; suggestions: string[] } {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  if (headings.length === 0) {
    issues.push('No headings found');
    suggestions.push('Add H1, H2, H3 headings to structure content');
    score = 0;
  } else {
    if (headings.length < 2) {
      issues.push('Too few headings');
      suggestions.push('Add more headings to improve content structure');
      score -= 20;
    }

    if (headings.length > 10) {
      issues.push('Too many headings');
      suggestions.push('Consider consolidating headings');
      score -= 10;
    }

    // Check for heading hierarchy
    suggestions.push('Ensure proper heading hierarchy (H1 → H2 → H3)');
  }

  return { score: Math.max(0, score), issues, suggestions };
}

function analyzeContent(content: string): { score: number; issues: string[]; suggestions: string[] } {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  if (!content || content.trim().length < 300) {
    issues.push('Content is too short (less than 300 characters)');
    suggestions.push('Add more relevant content to the page');
    score -= 30;
  }

  const wordCount = content.split(/\s+/).length;
  if (wordCount < 50) {
    issues.push('Too few words (less than 50)');
    suggestions.push('Add more content to improve SEO');
    score -= 20;
  }

  // Check for keyword density
  const words = content.toLowerCase().match(/\b\w+\b/g) || [];
  const wordFreq: { [key: string]: number } = {};
  words.forEach(word => {
    if (word.length > 3) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });

  const sortedWords = Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  if (sortedWords.length > 0) {
    suggestions.push(`Top keywords: ${sortedWords.map(([word]) => word).join(', ')}`);
  }

  return { score: Math.max(0, score), issues, suggestions };
}

function analyzeImages(images: Array<{ src: string; alt: string; title: string }>): { score: number; issues: string[]; suggestions: string[] } {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  if (images.length === 0) {
    issues.push('No images found');
    suggestions.push('Add relevant images to improve user experience');
    score -= 20;
  } else {
    const imagesWithoutAlt = images.filter(img => !img.alt);
    if (imagesWithoutAlt.length > 0) {
      issues.push(`${imagesWithoutAlt.length} image(s) missing alt text`);
      suggestions.push('Add descriptive alt text to all images');
      score -= 15;
    }

    if (images.length > 10) {
      suggestions.push('Consider optimizing image sizes for faster loading');
    }
  }

  return { score: Math.max(0, score), issues, suggestions };
}

function analyzeLinks(links: Array<{ url: string; text: string }>): { score: number; issues: string[]; suggestions: string[] } {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  if (links.length === 0) {
    suggestions.push('Consider adding relevant internal and external links');
  } else {
    const internalLinks = links.filter(link => 
      link.url.startsWith('/') || link.url.includes(window.location.hostname)
    );
    const externalLinks = links.filter(link => 
      !link.url.startsWith('/') && !link.url.includes(window.location.hostname)
    );

    if (internalLinks.length === 0) {
      suggestions.push('Add internal links to other pages on your site');
    }

    if (externalLinks.length === 0) {
      suggestions.push('Consider adding relevant external links');
    }
  }

  return { score: Math.max(0, score), issues, suggestions };
}

function analyzeMobile(pageContent: PageContent): { score: number; issues: string[]; suggestions: string[] } {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  // Basic mobile optimization checks
  const hasResponsiveImages = pageContent.sections.some(section => {
    const settings = section.settings as any;
    return settings?.responsive === true || settings?.mobileOptimized === true;
  });

  if (!hasResponsiveImages) {
    suggestions.push('Ensure images are responsive for mobile devices');
  }

  suggestions.push('Test page on mobile devices for optimal experience');
  suggestions.push('Ensure touch targets are large enough (44px minimum)');

  return { score: Math.max(0, score), issues, suggestions };
}

function analyzeSpeed(pageContent: PageContent): { score: number; issues: string[]; suggestions: string[] } {
  const issues: string[] = [];
  const suggestions: string[] = [];
  let score = 100;

  const imageCount = pageContent.sections.filter(section => {
    const settings = section.settings as any;
    return settings?.image || settings?.backgroundImage;
  }).length;

  if (imageCount > 5) {
    suggestions.push('Consider lazy loading images for better performance');
    score -= 10;
  }

  if (imageCount > 10) {
    suggestions.push('Optimize image sizes and formats (WebP, AVIF)');
    score -= 10;
  }

  suggestions.push('Minimize CSS and JavaScript for faster loading');
  suggestions.push('Use a CDN for static assets');

  return { score: Math.max(0, score), issues, suggestions };
}

// Meta Tag Generation
export function generateMetaTags(pageContent: PageContent, customMeta?: Partial<MetaTags>): MetaTags {
  const title = customMeta?.title || pageContent.title || 'Porch Records';
  const description = customMeta?.description || pageContent.description || '';
  
  // Extract keywords from content
  const allContent = pageContent.sections
    .map(section => {
      let content = '';
      // PageSection doesn't have a title property
      if (section.content) content += section.content + ' ';
      if (section.settings?.text) content += section.settings.text + ' ';
      return content;
    })
    .join(' ')
    .toLowerCase();

  const words = allContent.match(/\b\w+\b/g) || [];
  const wordFreq: { [key: string]: number } = {};
  words.forEach(word => {
    if (word.length > 3) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });

  const keywords = Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);

  // Get first image for social sharing
  const firstImage = pageContent.sections.find(section => {
    const settings = section.settings as any;
    return settings?.image || settings?.backgroundImage;
  });
  const ogImage = (() => {
    const settings = firstImage?.settings as any;
    return settings?.image || settings?.backgroundImage || '';
  })();

  return {
    title: title,
    description: description,
    keywords: customMeta?.keywords || keywords,
    ogTitle: customMeta?.ogTitle || title,
    ogDescription: customMeta?.ogDescription || description,
    ogImage: customMeta?.ogImage || ogImage,
    ogType: customMeta?.ogType || 'website',
    twitterCard: customMeta?.twitterCard || 'summary_large_image',
    twitterTitle: customMeta?.twitterTitle || title,
    twitterDescription: customMeta?.twitterDescription || description,
    twitterImage: customMeta?.twitterImage || ogImage,
    canonical: customMeta?.canonical || `https://porchrecords.com/${pageContent.slug}`,
    robots: customMeta?.robots || 'index, follow'
  };
}

// SEO Suggestions
export function getSEOSuggestions(score: SEOScore): string[] {
  const suggestions: string[] = [];
  
  if (score.overall < 70) {
    suggestions.push('Focus on improving page title and meta description first');
  }
  
  if (score.title < 70) {
    suggestions.push('Optimize your page title for better search visibility');
  }
  
  if (score.description < 70) {
    suggestions.push('Write a compelling meta description to improve click-through rates');
  }
  
  if (score.content < 70) {
    suggestions.push('Add more relevant, high-quality content to your page');
  }
  
  if (score.headings < 70) {
    suggestions.push('Improve content structure with proper heading hierarchy');
  }
  
  if (score.images < 70) {
    suggestions.push('Add alt text to images and optimize them for web');
  }
  
  if (score.mobile < 70) {
    suggestions.push('Ensure your page is mobile-friendly');
  }
  
  if (score.speed < 70) {
    suggestions.push('Optimize page loading speed');
  }
  
  return suggestions;
}

// Character count utilities
export function getCharacterCount(text: string): number {
  return text?.length || 0;
}

export function getWordCount(text: string): number {
  return text?.split(/\s+/).filter(word => word.length > 0).length || 0;
}

export function getReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const wordCount = getWordCount(text);
  return Math.ceil(wordCount / wordsPerMinute);
} 
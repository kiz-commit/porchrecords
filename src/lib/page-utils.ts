import { PageContent, PageVersion } from './types';

// Version management
export function createPageVersion(page: PageContent, comment?: string): PageVersion {
  const currentVersion = page.versions?.length || 0;
  
  return {
    id: `version_${Date.now()}`,
    version: currentVersion + 1,
    title: page.title,
    description: page.description,
    sections: [...page.sections],
    createdAt: new Date().toISOString(),
    comment: comment || `Version ${currentVersion + 1}`,
  };
}

export function addPageVersion(page: PageContent, comment?: string): PageContent {
  const newVersion = createPageVersion(page, comment);
  const versions = page.versions || [];
  
  return {
    ...page,
    versions: [...versions, newVersion],
    lastModified: new Date().toISOString(),
  };
}

export function restorePageVersion(page: PageContent, versionId: string): PageContent | null {
  const version = page.versions?.find(v => v.id === versionId);
  if (!version) return null;
  
  return {
    ...page,
    title: version.title,
    description: version.description,
    sections: [...version.sections],
    lastModified: new Date().toISOString(),
  };
}

// Scheduling
export function isPageScheduled(page: PageContent): boolean {
  const now = new Date();
  const publishAt = page.publishAt ? new Date(page.publishAt) : null;
  const unpublishAt = page.unpublishAt ? new Date(page.unpublishAt) : null;
  
  if (publishAt && now < publishAt) return true;
  if (unpublishAt && now > unpublishAt) return true;
  
  return false;
}

export function getPageStatus(page: PageContent): 'draft' | 'published' | 'scheduled' | 'unpublished' {
  if (!page.isPublished) return 'draft';
  if (isPageScheduled(page)) return 'scheduled';
  if (page.unpublishAt && new Date() > new Date(page.unpublishAt)) return 'unpublished';
  return 'published';
}

// Template management
export function createPageFromTemplate(templateId: string, pageData: Partial<PageContent>): PageContent {
  return {
    id: `page_${Date.now()}`,
    title: pageData.title || 'New Page',
    slug: pageData.slug || `page-${Date.now()}`,
    description: pageData.description || '',
    isPublished: false,
    isDraft: true,
    lastModified: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sections: [],
    template: templateId,
    ...pageData,
  };
}

export function clonePage(originalPage: PageContent, newTitle?: string): PageContent {
  return {
    ...originalPage,
    id: `page_${Date.now()}`,
    title: newTitle || `${originalPage.title} (Copy)`,
    slug: `${originalPage.slug}-copy-${Date.now()}`,
    isPublished: false,
    isDraft: true,
    lastModified: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    clonedFrom: originalPage.id,
  };
} 
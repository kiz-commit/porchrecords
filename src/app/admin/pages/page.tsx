"use client";

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { PageContent } from '@/lib/types';
import { clonePage, getPageStatus } from '@/lib/page-utils';
import { nanoid } from 'nanoid';
import { usePageCache } from '@/hooks/usePageCache';
import { getPagesListCacheKey, invalidatePageCache, clearCache } from '@/lib/cache-utils';

// Import PageBuilder components directly for now to fix chunk loading issues
import PageBuilder from '@/components/PageBuilder/PageBuilder';



// Helper function to safely format dates
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'Unknown';
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? 'Unknown' : date.toISOString().split('T')[0];
  } catch {
    return 'Unknown';
  }
};

const initialPage: PageContent = {
  id: 'test-page',
  title: 'Test Page',
  slug: 'test-page',
  description: 'A test page for the builder UI',
  isPublished: false,
  lastModified: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  sections: []
};

export default function AdminPages() {
  // Initialize cache hook
  const cache = usePageCache();
  
  const [pages, setPages] = useState<PageContent[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string>('');
  const [message, setMessage] = useState<string | null>(null);
  const [showNewPageForm, setShowNewPageForm] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');
  const [newPageDescription, setNewPageDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [pageToDelete, setPageToDelete] = useState<PageContent | null>(null);

  const selectedPage = pages.find(p => p.id === selectedPageId);
  
  // Debug log to see pages state
  useEffect(() => {
    console.log('Pages state updated:', pages);
  }, [pages]);
  




  // Debug loading state changes
  useEffect(() => {
    // console.log('Loading state changed:', loading);
  }, [loading]);

  // Load pages from API on mount with caching
  useEffect(() => {
    async function loadPages() {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/pages');
        if (response.ok) {
          const data = await response.json();
          console.log('API Response:', data); // Debug log
          const pages = data.data?.pages || data.pages || [];
          console.log('Extracted pages:', pages); // Debug log
          if (pages && pages.length > 0) {
            console.log('Setting pages:', pages); // Debug log
            setPages(pages);
            setSelectedPageId(pages[0].id);
            // Cache the pages list
            cache.set(getPagesListCacheKey(), pages);
          } else {
            // If no pages exist, create a default page
            const defaultPage = {
              ...initialPage,
              id: nanoid(),
              title: 'Welcome Page',
              slug: 'welcome',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            setPages([defaultPage]);
            setSelectedPageId(defaultPage.id);
            // Cache the default page
            cache.set(getPagesListCacheKey(), [defaultPage]);
          }
        } else {
        }
      } catch (error) {
        console.error('Error loading pages:', error);
        // Create a default page if API fails
        const defaultPage = {
          ...initialPage,
          id: nanoid(),
          title: 'Welcome Page',
          slug: 'welcome',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        setPages([defaultPage]);
        setSelectedPageId(defaultPage.id);
        // Cache the default page
        cache.set(getPagesListCacheKey(), [defaultPage]);
      } finally {
        setLoading(false);
      }
    }
    loadPages();
  }, []); // Only run on mount, not when cache changes

  const handleSave = async (updatedPage: PageContent) => {
    try {
      // console.log('Starting save for page:', updatedPage.id);
      
      const response = await fetch('/api/admin/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedPage),
      });

      // console.log('Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        // console.log('Save successful:', result);
        
        // Update the page in the list
        setPages(pages => pages.map(p => p.id === updatedPage.id ? updatedPage : p));
        
        // Invalidate cache after successful save
        invalidatePageCache(updatedPage.id);
        setMessage(result.message || 'Page saved successfully!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        // console.error('Save failed:', errorData);
        setMessage(`Failed to save page: ${errorData.message || errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      // console.error('Save error:', error);
      setMessage(`Error saving page: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setTimeout(() => setMessage(null), 2000);
  };



  const handleClonePage = async () => {
    if (!selectedPage) return;
    const clonedPage = clonePage(selectedPage);
    try {
      const response = await fetch('/api/admin/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(clonedPage),
      });

      if (response.ok) {
        setPages(pages => [clonedPage, ...pages]);
        setSelectedPageId(clonedPage.id);
        // Invalidate cache after successful clone
        invalidatePageCache(clonedPage.id);
        setMessage('Page cloned successfully!');
      } else {
        setMessage('Failed to clone page.');
      }
    } catch (error) {
      setMessage('Error cloning page.');
    }
    setTimeout(() => setMessage(null), 2000);
  };

  const handleUpdatePage = async (updates: Partial<PageContent>) => {
    if (!selectedPage) return;
    const updatedPage = { ...selectedPage, ...updates };
    await handleSave(updatedPage);
  };

  const handlePublish = async (updatedPage: PageContent) => {
    try {
      const publishedPage = { ...updatedPage, isPublished: true, isDraft: false };
      
      const response = await fetch('/api/admin/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(publishedPage),
      });

      if (response.ok) {
        // Update the page in the list
        setPages(pages => pages.map(p => p.id === updatedPage.id ? publishedPage : p));
        
        // Invalidate cache after successful publish
        invalidatePageCache(updatedPage.id);
        setMessage('Page published successfully!');
      } else {
        setMessage('Failed to publish page.');
      }
    } catch (error) {
      setMessage('Error publishing page.');
    }
    setTimeout(() => setMessage(null), 2000);
  };

  const handleAddNewPage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPageTitle.trim()) return;
    
    const slug = newPageSlug.trim() || newPageTitle.trim().toLowerCase().replace(/\s+/g, '-');
    const id = nanoid();
    const now = new Date().toISOString();
    const newPage: PageContent = {
      id,
      title: newPageTitle.trim(),
      slug,
      description: newPageDescription.trim(),
      isPublished: false,
      lastModified: now,
      createdAt: now,
      updatedAt: now,
      sections: []
    };
    
    try {
      // Save the new page to the API
      const response = await fetch('/api/admin/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPage),
      });

      if (response.ok) {
        const result = await response.json();
        
        // The API returns { success: true, data: { id: "..." }, message: "..." }
        // We need to use the newPage we created, not the response data
        setPages(pages => [newPage, ...pages]);
        setSelectedPageId(newPage.id);
        
        // Invalidate cache to force fresh data on next load
        invalidatePageCache(newPage.id);
        
        setNewPageTitle('');
        setNewPageSlug('');
        setNewPageDescription('');
        setShowNewPageForm(false);
        setMessage('New page created and saved!');
        setTimeout(() => setMessage(null), 2000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to save new page:', errorData);
        setMessage(`Failed to create page: ${errorData.message || errorData.error || 'Unknown error'}`);
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error) {
      console.error('Error creating new page:', error);
      setMessage(`Error creating page: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDeletePage = async () => {
    if (!pageToDelete) return;
    
    try {
      const response = await fetch(`/api/admin/pages?id=${pageToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove the page from the list
        setPages(pages => pages.filter(p => p.id !== pageToDelete.id));
        
        // If the deleted page was selected, select the first available page
        if (selectedPageId === pageToDelete.id) {
          const remainingPages = pages.filter(p => p.id !== pageToDelete.id);
          if (remainingPages.length > 0) {
            setSelectedPageId(remainingPages[0].id);
          } else {
            setSelectedPageId('');
          }
        }
        
        // Invalidate cache
        invalidatePageCache(pageToDelete.id);
        setMessage('Page deleted successfully!');
      } else {
        const errorData = await response.json().catch(() => ({}));
        setMessage(`Failed to delete page: ${errorData.message || errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      setMessage(`Error deleting page: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    setShowDeleteConfirm(false);
    setPageToDelete(null);
    setTimeout(() => setMessage(null), 3000);
  };

  const confirmDelete = (page: PageContent) => {
    setPageToDelete(page);
    setShowDeleteConfirm(true);
  };

  if (loading) {
    // console.log('Rendering loading state, loading =', loading);
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading pages...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!selectedPage) {
    // console.log('Rendering no pages state, selectedPage =', selectedPage);
    return (
      <AdminLayout>
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No pages available</h2>
            <p className="text-gray-600 mb-4">Create your first page to get started.</p>
            <button
              onClick={() => setShowNewPageForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Create First Page
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // console.log('Rendering main content, selectedPage =', selectedPage);

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {message && (
          <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-lg text-center">
            {message}
          </div>
        )}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-2xl font-bold">Pages</h1>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => setShowNewPageForm(f => !f)}
            >
              {showNewPageForm ? 'Cancel' : 'Add New Page'}
            </button>
          </div>
          {showNewPageForm && (
            <form onSubmit={handleAddNewPage} className="bg-white p-4 rounded shadow mb-4 flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  value={newPageTitle}
                  onChange={e => {
                    setNewPageTitle(e.target.value);
                    setNewPageSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                  }}
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  value={newPageSlug}
                  onChange={e => setNewPageSlug(e.target.value)}
                  placeholder="auto-generated from title"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  value={newPageDescription}
                  onChange={e => setNewPageDescription(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Create
              </button>
            </form>
          )}
          <div className="bg-white rounded shadow divide-y">
            {pages.length === 0 && (
              <div className="p-4 text-gray-500">No pages yet.</div>
            )}
            {(pages || []).map(p => (
              <div
                key={p.id}
                className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 ${selectedPageId === p.id ? 'bg-blue-50' : ''}`}
                onClick={() => setSelectedPageId(p.id)}
              >
                <div>
                  <div className="font-semibold">{p.title}</div>
                  <div className="text-xs text-gray-500">/{p.slug}</div>
                  <div className="text-xs text-gray-400">{(p.sections?.length || 0)} sections &middot; Last modified: {formatDate(p.lastModified)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-block px-2 py-1 text-xs rounded ${
                    getPageStatus(p) === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                    getPageStatus(p) === 'published' ? 'bg-green-100 text-green-800' :
                    getPageStatus(p) === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {getPageStatus(p).charAt(0).toUpperCase() + getPageStatus(p).slice(1)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmDelete(p);
                    }}
                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                    title="Delete page"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mb-4 flex gap-2">
          <button
            onClick={handleClonePage}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Clone Page
          </button>
        </div>
        
        {/* PageBuilder */}
        {selectedPage && (
          <PageBuilder
            key={selectedPage.id}
            page={selectedPage}
            onSave={handleSave}
            onPublish={handlePublish}
          />
        )}

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && pageToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{pageToDelete.title}"? This action cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setPageToDelete(null);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeletePage}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
} 
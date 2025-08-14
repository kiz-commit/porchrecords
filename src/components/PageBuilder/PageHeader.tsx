"use client";

import React from 'react';
import { PageContent } from '@/lib/types';
import AutoSaveIndicator from './AutoSaveIndicator';
import UndoRedoIndicator from './UndoRedoIndicator';

interface PageHeaderProps {
  page: PageContent;
  onUpdatePage: (page: PageContent) => void;
  onSave: () => Promise<void>;
  onPublish: () => Promise<void>;
  onPreview: () => void;
  onToggleSidebar: () => void;
  isPreviewMode: boolean;
  onTogglePreview: () => void;
  autoSaveEnabled?: boolean;
  onToggleAutoSave?: () => void;
  autoSaveState?: {
    isSaving: boolean;
    lastSaved: Date | null;
    lastError: string | null;
    hasUnsavedChanges: boolean;
    getLastSavedText: () => string;
    saveNow: () => Promise<void>;
  };
  undoRedoState?: {
    canUndo: boolean;
    canRedo: boolean;
    onUndo: () => void;
    onRedo: () => void;
    lastAction?: string;
  };
  // New props for published page editing
  isEditingPublishedPage?: boolean;
  hasUnsavedChanges?: boolean;
  onSaveChanges?: () => Promise<void>;
  onPublishChanges?: () => Promise<void>;
  onDiscardChanges?: () => void;
}

export default function PageHeader({
  page,
  onUpdatePage,
  onSave,
  onPublish,
  onPreview,
  onToggleSidebar,
  isPreviewMode,
  onTogglePreview,
  autoSaveEnabled = true,
  onToggleAutoSave,
  autoSaveState,
  undoRedoState,
  isEditingPublishedPage = false,
  hasUnsavedChanges = false,
  onSaveChanges,
  onPublishChanges,
  onDiscardChanges
}: PageHeaderProps) {
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdatePage({ ...page, title: e.target.value });
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdatePage({ ...page, slug: e.target.value });
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Page info */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 bg-white"
            title="Toggle Sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <div className="flex flex-col">
            <input
              type="text"
              value={page.title}
              onChange={handleTitleChange}
              placeholder="Page title..."
              className="text-xl font-semibold bg-transparent border-none outline-none focus:ring-0 text-gray-900"
            />
            <input
              type="text"
              value={page.slug}
              onChange={handleSlugChange}
              placeholder="page-slug..."
              className="text-sm bg-transparent border-none outline-none focus:ring-0 text-gray-500"
            />
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-3">
          {/* Undo/Redo */}
          {undoRedoState && (
            <UndoRedoIndicator
              canUndo={undoRedoState.canUndo}
              canRedo={undoRedoState.canRedo}
              onUndo={undoRedoState.onUndo}
              onRedo={undoRedoState.onRedo}
              lastAction={undoRedoState.lastAction}
              showShortcuts={true}
            />
          )}

          {/* Auto-save indicator - only show for drafts */}
          {!isEditingPublishedPage && autoSaveState && (
            <div className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium bg-green-50 text-green-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Auto-saving</span>
            </div>
          )}

          {/* Unsaved changes indicator - only show for published pages */}
          {isEditingPublishedPage && hasUnsavedChanges && (
            <div className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium bg-yellow-50 text-yellow-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span>Unsaved changes</span>
            </div>
          )}

          {/* Preview toggle */}
          <button
            onClick={onTogglePreview}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isPreviewMode
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isPreviewMode ? '← Edit Mode' : 'Preview'}
          </button>

          {/* Action buttons - different for published vs draft pages */}
          {isEditingPublishedPage ? (
            // Published page editing workflow
            <div className="flex items-center space-x-2">
              {hasUnsavedChanges && onDiscardChanges && (
                <button
                  onClick={onDiscardChanges}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                >
                  Discard
                </button>
              )}
              {hasUnsavedChanges && onSaveChanges && (
                <button
                  onClick={onSaveChanges}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Save Changes
                </button>
              )}
              <button
                onClick={onPublishChanges || onPublish}
                disabled={page.isPublished && !hasUnsavedChanges}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                  page.isPublished && !hasUnsavedChanges
                    ? 'bg-green-100 text-green-700 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {page.isPublished && !hasUnsavedChanges ? 'Published' : 'Publish Changes'}
              </button>
            </div>
          ) : (
            // Draft page workflow
            <button
              onClick={onPublish}
              disabled={page.isPublished}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                page.isPublished
                  ? 'bg-green-100 text-green-700 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {page.isPublished ? 'Published' : 'Publish'}
            </button>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            page.isPublished
              ? 'bg-green-100 text-green-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {page.isPublished ? 'Published' : 'Draft'}
          </span>
          {isEditingPublishedPage && hasUnsavedChanges && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Editing
            </span>
          )}
          <span>{page.sections.length} sections</span>
          <span>
            Last modified: {page.lastModified ? new Date(page.lastModified).toISOString().split('T')[0] : 'Never'}
          </span>
        </div>
        
        {/* Auto-save status - only show for drafts */}
        {!isEditingPublishedPage && autoSaveState && (
          <AutoSaveIndicator
            isSaving={autoSaveState.isSaving}
            lastSaved={autoSaveState.lastSaved}
            lastError={autoSaveState.lastError}
            hasUnsavedChanges={autoSaveState.hasUnsavedChanges}
            getLastSavedText={autoSaveState.getLastSavedText}
            onSaveNow={autoSaveState.saveNow}
          />
        )}
      </div>
    </div>
  );
} 
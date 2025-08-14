"use client";

import React, { useCallback, useEffect } from 'react';
import { PageContent, HomepageSection, PageSection, PageSectionType, SectionComponentProps } from '@/lib/types';
import { nanoid } from 'nanoid';
import SectionToolbar from './SectionToolbar';
import SectionEditor from './SectionEditor';
import SectionRenderer from './SectionRenderer';
import PageHeader from './PageHeader';
import Sidebar from './Sidebar';
import PageBuilderErrorBoundary from './ErrorBoundary';
import AutoSaveIndicator from './AutoSaveIndicator';
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning';
import UndoRedoIndicator from './UndoRedoIndicator';
import PreviewMode from './PreviewMode';
import DeviceFrame from './DeviceFrame';
import { usePageCache } from '@/hooks/usePageCache';
import { getPageCacheKey, invalidatePageCache } from '@/lib/cache-utils';
import { 
  usePageBuilderCurrentPage,
  usePageBuilderPreviewPage,
  usePageBuilderSelectedSection,
  usePageBuilderSectionsList,
  usePageBuilderIsEditing,
  usePageBuilderIsPreviewMode,
  usePageBuilderSidebarOpen,
  usePageBuilderShowRealTimePreview,
  usePageBuilderAutoSaveEnabled,
  usePageBuilderPreviewDevice,
  usePageBuilderIsEditingPublishedPage,
  usePageBuilderHasUnsavedChanges,
  usePageBuilderErrors,
  usePageBuilderIsSaving,
  usePageBuilderIsPublishing,
  usePageBuilderCanUndo,
  usePageBuilderCanRedo,
  useSetCurrentPage,
  useSetPreviewPage,
  useUpdatePage,
  useAddSection,
  useUpdateSection,
  useDeleteSection,
  useMoveSection,
  useDuplicateSection,
  useSelectSection,
  useSetEditing,
  useSetPreviewMode,
  useSetSidebarOpen,
  useSetShowRealTimePreview,
  useSetAutoSaveEnabled,
  useSetPreviewDevice,
  useStartEditingPublishedPage,
  useDiscardChanges,
  useSaveChanges,
  useAddError,
  useClearErrors,
  useUndo,
  useRedo,
  useSavePage,
  usePublishPage
} from '@/hooks/usePageBuilderStore';
import { getDeviceConfig } from '@/stores/pageBuilderStore';

interface PageBuilderProps {
  page?: PageContent;
  onSave?: (page: PageContent) => Promise<void>;
  onPublish?: (page: PageContent) => Promise<void>;
  onPreview?: (page: PageContent) => void;
}

export default function PageBuilder({ page, onSave, onPublish, onPreview }: PageBuilderProps) {
  // Initialize cache hook
  const cache = usePageCache();
  
  // Zustand store hooks
  const currentPage = usePageBuilderCurrentPage();
  const previewPage = usePageBuilderPreviewPage();
  const selectedSection = usePageBuilderSelectedSection();
  const sections = usePageBuilderSectionsList();
  const isEditing = usePageBuilderIsEditing();
  const isPreviewMode = usePageBuilderIsPreviewMode();
  const sidebarOpen = usePageBuilderSidebarOpen();
  const showRealTimePreview = usePageBuilderShowRealTimePreview();
  const autoSaveEnabled = usePageBuilderAutoSaveEnabled();
  const previewDevice = usePageBuilderPreviewDevice();
  const isEditingPublishedPage = usePageBuilderIsEditingPublishedPage();
  const hasUnsavedChanges = usePageBuilderHasUnsavedChanges();
  const errors = usePageBuilderErrors();
  const isSaving = usePageBuilderIsSaving();
  const isPublishing = usePageBuilderIsPublishing();
  const canUndo = usePageBuilderCanUndo();
  const canRedo = usePageBuilderCanRedo();
  const setCurrentPage = useSetCurrentPage();
  const setPreviewPage = useSetPreviewPage();
  const updatePage = useUpdatePage();
  const addSection = useAddSection();
  const updateSection = useUpdateSection();
  const deleteSection = useDeleteSection();
  const moveSection = useMoveSection();
  const duplicateSection = useDuplicateSection();
  const selectSection = useSelectSection();
  const setEditing = useSetEditing();
  const setPreviewMode = useSetPreviewMode();
  const setSidebarOpen = useSetSidebarOpen();
  const setShowRealTimePreview = useSetShowRealTimePreview();
  const setAutoSaveEnabled = useSetAutoSaveEnabled();
  const setPreviewDevice = useSetPreviewDevice();
  const startEditingPublishedPage = useStartEditingPublishedPage();
  const discardChanges = useDiscardChanges();
  const saveChanges = useSaveChanges();
  const addError = useAddError();
  const clearErrors = useClearErrors();
  const undo = useUndo();
  const redo = useRedo();
  const savePage = useSavePage();
  const publishPage = usePublishPage();
  
  // Warn about unsaved changes (simplified for now)
  useUnsavedChangesWarning(false);

  // Debug selected section changes
  useEffect(() => {
    console.log('PageBuilder: selectedSection changed:', selectedSection?.id, selectedSection?.type);
  }, [selectedSection]);

  // Helper function to determine action description
  const getActionDescription = useCallback((newPage: PageContent, oldPage: PageContent): string => {
    // Compare sections
    if (newPage.sections.length > oldPage.sections.length) {
      return 'Added section';
    }
    if (newPage.sections.length < oldPage.sections.length) {
      return 'Deleted section';
    }
    
    // Compare section content
    for (let i = 0; i < newPage.sections.length; i++) {
      const newSection = newPage.sections[i];
      const oldSection = oldPage.sections[i];
      
      if (!oldSection) continue;
      
      if (JSON.stringify(newSection.content) !== JSON.stringify(oldSection.content)) {
        return 'Edited content';
      }
      if (newSection.type !== oldSection.type) {
        return 'Changed section type';
      }
    }
    
    // Compare page properties
    if (newPage.title !== oldPage.title) {
      return 'Changed page title';
    }
    if (newPage.slug !== oldPage.slug) {
      return 'Changed page slug';
    }
    
    return 'Modified page';
  }, []);

  // Sync store with page prop when it changes
  useEffect(() => {
    if (page) {
      // Always sync when page prop changes, regardless of current state
      setCurrentPage(page);
    }
  }, [page, setCurrentPage]);

  // Update preview page when current page changes
  useEffect(() => {
    setPreviewPage(currentPage);
  }, [currentPage, setPreviewPage]);

  // Real-time update function for immediate preview
  const updateSectionPreview = useCallback((sectionId: string, updates: Partial<PageSection>) => {
    // Update the section in the store directly
    updateSection(sectionId, updates);
  }, [updateSection]);

  const handleSave = async () => {
    try {
      await savePage(onSave);
      // Invalidate cache after successful save to ensure fresh data
      invalidatePageCache(currentPage.id);
    } catch (error) {
      console.error('PageBuilder save error:', error);
      // The error will be handled by the parent component
      throw error;
    }
  };

  const handleSaveAsDraft = async () => {
    try {
      // Save current changes as draft (overwrites the current page)
      const draftPage = { 
        ...currentPage, 
        isDraft: true,
        isPublished: false, // Ensure it's not published
        lastModified: new Date().toISOString()
      };
      
      if (onSave) {
        await onSave(draftPage);
      }
      // Invalidate cache after successful save to ensure fresh data
      invalidatePageCache(currentPage.id);
    } catch (error) {
      console.error('PageBuilder save as draft error:', error);
      // The error will be handled by the parent component
      throw error;
    }
  };

  const handlePublish = async () => {
    try {
      await publishPage(onPublish);
      // Invalidate cache after successful publish to ensure fresh data
      invalidatePageCache(currentPage.id);
    } catch (error) {
      console.error('PageBuilder publish error:', error);
      // The error will be handled by the parent component
      throw error;
    }
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview(currentPage);
    }
    setPreviewMode(true);
  };

  const handleTogglePreview = () => {
    setPreviewMode(!isPreviewMode);
  };

  const handleToggleRealTimePreview = () => {
    setShowRealTimePreview(!showRealTimePreview);
  };

  const handleSectionSelect = (section: PageSection) => {
    console.log('PageBuilder: Selecting section:', section.id, section.type);
    selectSection(section);
  };

  const handleSectionEdit = (section: PageSection) => {
    console.log('PageBuilder: Editing section:', section.id, section.type);
    selectSection(section);
    setSidebarOpen(true);
  };

  const handleSectionMove = (sectionId: string, direction: 'up' | 'down') => {
    console.log('PageBuilder: Moving section:', sectionId, direction);
    moveSection(sectionId, direction);
  };

  const handleSectionDelete = (sectionId: string) => {
    console.log('PageBuilder: Deleting section:', sectionId);
    if (confirm('Are you sure you want to delete this section?')) {
      deleteSection(sectionId);
    }
  };

  const handleSectionDuplicate = (sectionId: string) => {
    console.log('PageBuilder: Duplicating section:', sectionId);
    duplicateSection(sectionId);
  };

  return (
    <div className="flex h-screen bg-gray-50" role="application" aria-label="Page Builder">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onAddSection={addSection}
        page={currentPage}
        onUpdatePage={setCurrentPage}
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <PageHeader
          page={currentPage}
          onUpdatePage={setCurrentPage}
          onSave={handleSave}
          onPublish={handlePublish}
          onPreview={handlePreview}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          isPreviewMode={isPreviewMode}
          onTogglePreview={handleTogglePreview}
          autoSaveEnabled={true}
          onToggleAutoSave={undefined}
          autoSaveState={{
            isSaving: isSaving,
            lastSaved: null,
            lastError: null,
            hasUnsavedChanges: false,
            getLastSavedText: () => 'Last saved: Never',
            saveNow: () => handleSave()
          }}
          undoRedoState={{
            canUndo: canUndo,
            canRedo: canRedo,
            onUndo: undo,
            onRedo: redo,
            lastAction: undefined
          }}
          isEditingPublishedPage={isEditingPublishedPage}
          hasUnsavedChanges={hasUnsavedChanges}
          onSaveChanges={async () => {
            try {
              await handleSaveAsDraft();
            } catch (error) {
              console.error('Failed to save changes:', error);
            }
          }}
          onPublishChanges={async () => {
            try {
              await handlePublish();
            } catch (error) {
              console.error('Failed to publish changes:', error);
            }
          }}
          onDiscardChanges={discardChanges}
        />

        {/* Preview Device Controls - only show in edit mode */}
        {!isPreviewMode && (
          <div className="bg-white border-b border-gray-200 px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Preview device:</span>
                <PreviewMode
                  currentDevice={previewDevice}
                  onDeviceChange={setPreviewDevice}
                />
              </div>
              
              <div className="text-xs text-gray-500">
                Changes are saved automatically as you edit
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {errors.length > 0 && (
          <div className="bg-red-50 border-b border-red-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium text-red-800">
                  {errors.length} error{errors.length !== 1 ? 's' : ''} found
                </span>
              </div>
              <button
                onClick={() => clearErrors()}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Dismiss
              </button>
            </div>
            <div className="mt-2">
              {errors.map((error, index) => (
                <p key={index} className="text-sm text-red-700">{error}</p>
              ))}
            </div>
          </div>
        )}

        {/* Page Content */}
        <PageBuilderErrorBoundary
          onError={(error) => {
            addError(error.message);
          }}
        >
          <div className="flex-1 overflow-auto">
            {isPreviewMode ? (
              // Full Preview Mode
              <div className="w-full">
                {/* Preview Device Controls */}
                <div className="bg-white border-b border-gray-200 px-6 py-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-700">Preview Mode</h3>
                    <div className="flex items-center space-x-3">
                      <span className="text-xs text-gray-500">Preview on:</span>
                      <PreviewMode
                        currentDevice={previewDevice}
                        onDeviceChange={setPreviewDevice}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="p-4">
                  <DeviceFrame device={previewDevice}>
                    {currentPage.sections
                      .filter(section => section.isVisible)
                      .sort((a, b) => a.order - b.order)
                      .map((section, index) => {
                        const isFirst = index === 0;
                        const isLast = index === currentPage.sections.filter(s => s.isVisible).length - 1;
                        
                        return ["hero", "fullWidthContent"].includes(section.type) ? (
                          <SectionRenderer
                            key={section.id}
                            section={section}
                            isPreview={true}
                            onSelect={() => handleSectionSelect(section)}
                            isSelected={selectedSection?.id === section.id.toString()}
                            onEdit={section => handleSectionEdit(section as PageSection)}
                            onMove={handleSectionMove}
                            onDelete={handleSectionDelete}
                            onDuplicate={handleSectionDuplicate}
                            isFirst={isFirst}
                            isLast={isLast}
                          />
                        ) : (
                          <div key={section.id} className="max-w-4xl mx-auto p-6">
                            <div className="bg-white rounded-lg shadow-sm">
                              <SectionRenderer
                                section={section}
                                isPreview={true}
                                onSelect={() => handleSectionSelect(section)}
                                isSelected={selectedSection?.id === section.id.toString()}
                                onEdit={section => handleSectionEdit(section as PageSection)}
                                onMove={handleSectionMove}
                                onDelete={handleSectionDelete}
                                onDuplicate={handleSectionDuplicate}
                                isFirst={isFirst}
                                isLast={isLast}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </DeviceFrame>
                </div>
              </div>
            ) : showRealTimePreview ? (
              // Real-time Preview Mode with Device Controls
              <div className="w-full">
                <div className="p-4">
                  <DeviceFrame device={previewDevice}>
                    {sections
                      .filter(section => section.isVisible)
                      .sort((a, b) => a.order - b.order)
                                          .map((section, index) => {
                      const isFirst = index === 0;
                      const isLast = index === sections.filter(s => s.isVisible).length - 1;
                      
                      return ["hero", "fullWidthContent"].includes(section.type) ? (
                        <SectionRenderer
                          key={section.id}
                          section={section}
                          isPreview={true}
                          onSelect={() => handleSectionSelect(section)}
                          isSelected={selectedSection?.id === section.id.toString()}
                          onEdit={section => handleSectionEdit(section as PageSection)}
                          onMove={handleSectionMove}
                          onDelete={handleSectionDelete}
                          onDuplicate={handleSectionDuplicate}
                          isFirst={isFirst}
                          isLast={isLast}
                        />
                      ) : (
                        <div key={section.id} className="max-w-4xl mx-auto p-6">
                          <div className="bg-white rounded-lg shadow-sm">
                            <SectionRenderer
                              section={section}
                              isPreview={true}
                              onSelect={() => handleSectionSelect(section)}
                              isSelected={selectedSection?.id === section.id.toString()}
                              onEdit={section => handleSectionEdit(section as PageSection)}
                              onMove={handleSectionMove}
                              onDelete={handleSectionDelete}
                              onDuplicate={handleSectionDuplicate}
                              isFirst={isFirst}
                              isLast={isLast}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </DeviceFrame>
                </div>
              </div>
            ) : (
              // Edit Mode Only
              <div className="w-full">
                {sections
                  .sort((a, b) => a.order - b.order)
                  .map((section, index) => {
                    const isFirst = index === 0;
                    const isLast = index === sections.length - 1;
                    
                    return ["hero", "fullWidthContent"].includes(section.type) ? (
                      <SectionRenderer
                        key={section.id}
                        section={section}
                        isPreview={false}
                        onSelect={() => handleSectionSelect(section)}
                        isSelected={selectedSection?.id === section.id.toString()}
                        onEdit={section => handleSectionEdit(section as PageSection)}
                        onMove={handleSectionMove}
                        onDelete={handleSectionDelete}
                        onDuplicate={handleSectionDuplicate}
                        isFirst={isFirst}
                        isLast={isLast}
                      />
                    ) : (
                      <div key={section.id} className="max-w-4xl mx-auto p-6 relative">
                        <SectionRenderer
                          section={section}
                          isPreview={false}
                          onSelect={() => handleSectionSelect(section)}
                          isSelected={selectedSection?.id === section.id.toString()}
                          onEdit={section => handleSectionEdit(section as PageSection)}
                          onMove={handleSectionMove}
                          onDelete={handleSectionDelete}
                          onDuplicate={handleSectionDuplicate}
                          isFirst={isFirst}
                          isLast={isLast}
                        />
                        {selectedSection?.id === section.id.toString() && (
                          <SectionToolbar
                            section={section}
                            onUpdate={updateSection}
                            onDelete={deleteSection}
                            onMove={moveSection}
                            onDuplicate={duplicateSection}
                            onClose={() => selectSection(null)}
                          />
                        )}
                      </div>
                    );
                  })}
                {sections.length === 0 && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No sections yet</h3>
                    <p className="text-gray-600 mb-4">Start building your page by adding sections from the sidebar.</p>
                    <button
                      onClick={() => setSidebarOpen(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add Section
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </PageBuilderErrorBoundary>
      </main>

      {/* Section Editor Sidebar */}
      {selectedSection && (
        <SectionEditor
          section={selectedSection}
          onClose={() => selectSection(null)}
        />
      )}
    </div>
  );
} 
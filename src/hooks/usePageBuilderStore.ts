import { usePageBuilderStore } from '@/stores/pageBuilderStore';
import { PageContent, PageSection, PageSectionType } from '@/lib/types';
import { PreviewDevice, getDeviceConfig } from '@/stores/pageBuilderStore';
import { shallow } from 'zustand/shallow';

// Hook for accessing the entire store (use sparingly)
export const usePageBuilderStoreFull = () => usePageBuilderStore();

// Individual selectors for state
export const usePageBuilderCurrentPage = () => usePageBuilderStore(state => state.currentPage);
export const usePageBuilderPreviewPage = () => usePageBuilderStore(state => state.previewPage);
export const usePageBuilderSelectedSection = () => usePageBuilderStore(state => state.selectedSection);
export const usePageBuilderSectionsList = () => usePageBuilderStore(state => state.currentPage.sections);
export const usePageBuilderIsEditing = () => usePageBuilderStore(state => state.isEditing);
export const usePageBuilderIsPreviewMode = () => usePageBuilderStore(state => state.isPreviewMode);
export const usePageBuilderSidebarOpen = () => usePageBuilderStore(state => state.sidebarOpen);
export const usePageBuilderShowRealTimePreview = () => usePageBuilderStore(state => state.showRealTimePreview);
export const usePageBuilderAutoSaveEnabled = () => usePageBuilderStore(state => state.autoSaveEnabled);
export const usePageBuilderPreviewDevice = () => usePageBuilderStore(state => state.previewDevice);
export const usePageBuilderIsEditingPublishedPage = () => usePageBuilderStore(state => state.isEditingPublishedPage);
export const usePageBuilderHasUnsavedChanges = () => usePageBuilderStore(state => state.hasUnsavedChanges);
export const usePageBuilderErrors = () => usePageBuilderStore(state => state.errors);
export const usePageBuilderIsSaving = () => usePageBuilderStore(state => state.isSaving);
export const usePageBuilderIsPublishing = () => usePageBuilderStore(state => state.isPublishing);
export const usePageBuilderIsLoading = () => usePageBuilderStore(state => state.isLoading);
export const usePageBuilderCanUndo = () => usePageBuilderStore(state => state.canUndo);
export const usePageBuilderCanRedo = () => usePageBuilderStore(state => state.canRedo);
export const usePageBuilderHistoryIndex = () => usePageBuilderStore(state => state.historyIndex);
export const usePageBuilderHistory = () => usePageBuilderStore(state => state.history);

// Individual hooks for actions
export const useSetCurrentPage = () => usePageBuilderStore(state => state.setCurrentPage);
export const useSetPreviewPage = () => usePageBuilderStore(state => state.setPreviewPage);
export const useUpdatePage = () => usePageBuilderStore(state => state.updatePage);
export const useAddSection = () => usePageBuilderStore(state => state.addSection);
export const useUpdateSection = () => usePageBuilderStore(state => state.updateSection);
export const useDeleteSection = () => usePageBuilderStore(state => state.deleteSection);
export const useMoveSection = () => usePageBuilderStore(state => state.moveSection);
export const useDuplicateSection = () => usePageBuilderStore(state => state.duplicateSection);
export const useSelectSection = () => usePageBuilderStore(state => state.selectSection);
export const useSetEditing = () => usePageBuilderStore(state => state.setEditing);
export const useSetPreviewMode = () => usePageBuilderStore(state => state.setPreviewMode);
export const useSetSidebarOpen = () => usePageBuilderStore(state => state.setSidebarOpen);
export const useSetShowRealTimePreview = () => usePageBuilderStore(state => state.setShowRealTimePreview);
export const useSetAutoSaveEnabled = () => usePageBuilderStore(state => state.setAutoSaveEnabled);
export const useSetPreviewDevice = () => usePageBuilderStore(state => state.setPreviewDevice);
export const useStartEditingPublishedPage = () => usePageBuilderStore(state => state.startEditingPublishedPage);
export const useDiscardChanges = () => usePageBuilderStore(state => state.discardChanges);
export const useSaveChanges = () => usePageBuilderStore(state => state.saveChanges);
export const useAddError = () => usePageBuilderStore(state => state.addError);
export const useClearErrors = () => usePageBuilderStore(state => state.clearErrors);
export const useRemoveError = () => usePageBuilderStore(state => state.removeError);
export const useSetSaving = () => usePageBuilderStore(state => state.setSaving);
export const useSetPublishing = () => usePageBuilderStore(state => state.setPublishing);
export const useSetLoading = () => usePageBuilderStore(state => state.setLoading);
export const useAddToHistory = () => usePageBuilderStore(state => state.addToHistory);
export const useUndo = () => usePageBuilderStore(state => state.undo);
export const useRedo = () => usePageBuilderStore(state => state.redo);
export const useSavePage = () => usePageBuilderStore(state => state.savePage);
export const usePublishPage = () => usePageBuilderStore(state => state.publishPage);
export const useResetPageBuilder = () => usePageBuilderStore(state => state.reset);

// Hook for auto-save functionality
export const usePageBuilderAutoSave = (onSave?: (page: PageContent) => Promise<void>) => {
  const { currentPage, autoSaveEnabled, addToHistory } = usePageBuilderStore((state) => ({
    currentPage: state.currentPage,
    autoSaveEnabled: state.autoSaveEnabled,
    addToHistory: state.addToHistory
  }));

  const autoSave = async () => {
    if (autoSaveEnabled && onSave) {
      try {
        await onSave(currentPage);
        addToHistory(currentPage, 'Auto-saved');
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    }
  };

  return { autoSave, autoSaveEnabled };
};

// Hook for real-time preview updates
export const usePageBuilderRealTimePreview = () => {
  const { showRealTimePreview, setPreviewPage } = usePageBuilderStore((state) => ({
    showRealTimePreview: state.showRealTimePreview,
    setPreviewPage: state.setPreviewPage
  }));

  const updatePreview = (updates: Partial<PageContent>) => {
    if (showRealTimePreview) {
      // This would be called with the current preview page and updates
      // The actual implementation depends on how you want to handle preview updates
    }
  };

  return { updatePreview, showRealTimePreview };
};

// Hook for section-specific operations
export const usePageBuilderSection = (sectionId: string) => {
  const section = usePageBuilderStore((state) => 
    state.currentPage.sections.find(s => String(s.id) === sectionId)
  );
  const { updateSection, deleteSection, moveSection, duplicateSection } = usePageBuilderStore((state) => ({
    updateSection: state.updateSection,
    deleteSection: state.deleteSection,
    moveSection: state.moveSection,
    duplicateSection: state.duplicateSection
  }));

  return {
    section,
    updateSection: (updates: Partial<PageSection>) => updateSection(sectionId, updates),
    deleteSection: () => deleteSection(sectionId),
    moveUp: () => moveSection(sectionId, 'up'),
    moveDown: () => moveSection(sectionId, 'down'),
    duplicate: () => duplicateSection(sectionId)
  };
}; 
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { PageContent, PageSection, PageSectionType } from '@/lib/types';
import { createPageBuilderError, logPageBuilderError } from '@/lib/error-handling';

// Generate unique section IDs to prevent React key duplication
let sectionIdCounter = 0;
const generateUniqueSectionId = (): string => {
  sectionIdCounter += 1;
  return `section-${Date.now()}-${sectionIdCounter}`;
};

export type PreviewDevice = 'desktop' | 'tablet' | 'mobile';

export interface PreviewDeviceConfig {
  type: PreviewDevice;
  width: number;
  height: number;
}

export interface PageBuilderState {
  // Page Data
  currentPage: PageContent;
  previewPage: PageContent;
  originalPage: PageContent; // Store the original published page
  
  // UI State
  selectedSection: PageSection | null;
  isEditing: boolean;
  isPreviewMode: boolean;
  sidebarOpen: boolean;
  showRealTimePreview: boolean;
  autoSaveEnabled: boolean;
  previewDevice: PreviewDevice;
  
  // Edit Mode State
  isEditingPublishedPage: boolean; // True when editing a published page
  hasUnsavedChanges: boolean; // Track if there are unsaved changes
  
  // Error State
  errors: string[];
  
  // Loading States
  isSaving: boolean;
  isPublishing: boolean;
  isLoading: boolean;
  
  // History State
  canUndo: boolean;
  canRedo: boolean;
  historyIndex: number;
  history: PageContent[];
  
  // Actions
  // Page Management
  setCurrentPage: (page: PageContent) => void;
  setPreviewPage: (page: PageContent) => void;
  updatePage: (updates: Partial<PageContent>) => void;
  
  // Section Management
  addSection: (type: PageSectionType, template?: Partial<PageSection>) => void;
  updateSection: (sectionId: string, updates: Partial<PageSection>) => void;
  deleteSection: (sectionId: string) => void;
  moveSection: (sectionId: string, direction: 'up' | 'down') => void;
  duplicateSection: (sectionId: string) => void;
  selectSection: (section: PageSection | null) => void;
  
  // UI Actions
  setEditing: (editing: boolean) => void;
  setPreviewMode: (preview: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setShowRealTimePreview: (show: boolean) => void;
  setAutoSaveEnabled: (enabled: boolean) => void;
  setPreviewDevice: (device: PreviewDevice) => void;
  
  // Edit Mode Actions
  startEditingPublishedPage: () => void;
  discardChanges: () => void;
  saveChanges: (onSave?: (page: PageContent) => Promise<void>) => Promise<void>;
  
  // Error Management
  addError: (error: string) => void;
  clearErrors: () => void;
  removeError: (index: number) => void;
  
  // Loading States
  setSaving: (saving: boolean) => void;
  setPublishing: (publishing: boolean) => void;
  setLoading: (loading: boolean) => void;
  
  // History Management
  addToHistory: (page: PageContent, description?: string) => void;
  undo: () => void;
  redo: () => void;
  canUndoAction: () => boolean;
  canRedoAction: () => boolean;
  
  // Save/Publish Actions
  savePage: (onSave?: (page: PageContent) => Promise<void>) => Promise<void>;
  publishPage: (onPublish?: (page: PageContent) => Promise<void>) => Promise<void>;
  
  // Reset
  reset: () => void;
}

const initialPage: PageContent = {
  id: '',
  title: '',
  slug: '',
  description: '',
  isPublished: false,
  isDraft: true,
  lastModified: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  sections: []
};

const initialPreviewDevice: PreviewDevice = 'desktop';

// Helper function to get device config
export function getDeviceConfig(device: PreviewDevice): PreviewDeviceConfig {
  const configs: Record<PreviewDevice, PreviewDeviceConfig> = {
    desktop: { type: 'desktop', width: 1200, height: 800 },
    tablet: { type: 'tablet', width: 768, height: 1024 },
    mobile: { type: 'mobile', width: 375, height: 667 }
  };
  return configs[device];
}

export const usePageBuilderStore = create<PageBuilderState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        currentPage: initialPage,
        previewPage: initialPage,
        originalPage: initialPage,
        selectedSection: null,
        isEditing: true,
        isPreviewMode: false,
        sidebarOpen: true,
        showRealTimePreview: true,
        autoSaveEnabled: true,
        previewDevice: initialPreviewDevice,
        isEditingPublishedPage: false,
        hasUnsavedChanges: false,
        errors: [],
        isSaving: false,
        isPublishing: false,
        isLoading: false,
        canUndo: false,
        canRedo: false,
        historyIndex: 0,
        history: [initialPage],

        // Page Management Actions
        setCurrentPage: (page: PageContent) => {
          set((state) => {
            const isPublished = page.isPublished;
            return {
              currentPage: page,
              previewPage: page,
              originalPage: isPublished ? page : state.originalPage,
              isEditingPublishedPage: isPublished,
              hasUnsavedChanges: false,
              history: [page],
              historyIndex: 0,
              canUndo: false,
              canRedo: false
            };
          });
        },

        setPreviewPage: (page: PageContent) => {
          set({ previewPage: page });
        },

        updatePage: (updates: Partial<PageContent>) => {
          set((state) => {
            const updatedPage = { ...state.currentPage, ...updates };
            const hasChanges = state.isEditingPublishedPage && 
              JSON.stringify(updatedPage) !== JSON.stringify(state.originalPage);
            
            return {
              currentPage: updatedPage,
              previewPage: updatedPage,
              hasUnsavedChanges: hasChanges
            };
          });
        },

        // Section Management Actions
        addSection: (type: PageSectionType, template?: Partial<PageSection>) => {
          set((state) => {
            const newSection: PageSection = {
              id: generateUniqueSectionId(),
              type,
              content: '',
              order: state.currentPage.sections.length + 1,
              isVisible: true,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              ...template
            };

            const updatedPage = {
              ...state.currentPage,
              sections: [...state.currentPage.sections, newSection]
            };

            const hasChanges = state.isEditingPublishedPage && 
              JSON.stringify(updatedPage) !== JSON.stringify(state.originalPage);

            return {
              currentPage: updatedPage,
              previewPage: updatedPage,
              hasUnsavedChanges: hasChanges
            };
          });
        },

        updateSection: (sectionId: string, updates: Partial<PageSection>) => {
          set((state) => {
            const updatedPage = {
              ...state.currentPage,
              sections: state.currentPage.sections.map(section =>
                section.id === sectionId
                  ? { ...section, ...updates, updatedAt: new Date().toISOString() }
                  : section
              )
            };

            const hasChanges = state.isEditingPublishedPage && 
              JSON.stringify(updatedPage) !== JSON.stringify(state.originalPage);

            return {
              currentPage: updatedPage,
              previewPage: updatedPage,
              hasUnsavedChanges: hasChanges
            };
          });
        },

        deleteSection: (sectionId: string) => {
          set((state) => {
            const updatedPage = {
              ...state.currentPage,
              sections: state.currentPage.sections.filter(section => section.id !== sectionId)
            };

            return {
              currentPage: updatedPage,
              previewPage: updatedPage,
              selectedSection: state.selectedSection?.id === sectionId ? null : state.selectedSection
            };
          });
        },

        moveSection: (sectionId: string, direction: 'up' | 'down') => {
          set((state) => {
            const sections = [...state.currentPage.sections];
            const index = sections.findIndex(s => s.id === sectionId);
            
            if (direction === 'up' && index > 0) {
              // Swap sections
              [sections[index], sections[index - 1]] = [sections[index - 1], sections[index]];
              // Update order properties
              sections[index].order = index + 1;
              sections[index - 1].order = index;
            } else if (direction === 'down' && index < sections.length - 1) {
              // Swap sections
              [sections[index], sections[index + 1]] = [sections[index + 1], sections[index]];
              // Update order properties
              sections[index].order = index + 1;
              sections[index + 1].order = index + 2;
            }
            
            const updatedPage = { ...state.currentPage, sections };
            return {
              currentPage: updatedPage,
              previewPage: updatedPage
            };
          });
        },

        duplicateSection: (sectionId: string) => {
          set((state) => {
            const section = state.currentPage.sections.find(s => s.id === sectionId);
            if (!section) return state;

            const newSection: PageSection = {
              ...section,
              id: generateUniqueSectionId(),
              order: section.order + 1,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            const updatedSections = [...state.currentPage.sections];
            const insertIndex = updatedSections.findIndex(s => s.id === sectionId) + 1;
            updatedSections.splice(insertIndex, 0, newSection);

            // Update order for subsequent sections
            updatedSections.forEach((s, index) => {
              if (index >= insertIndex) {
                s.order = index + 1;
              }
            });

            const updatedPage = { ...state.currentPage, sections: updatedSections };
            return {
              currentPage: updatedPage,
              previewPage: updatedPage
            };
          });
        },

        selectSection: (section: PageSection | null) => {
          set({ selectedSection: section });
        },

        // UI Actions
        setEditing: (editing: boolean) => set({ isEditing: editing }),
        setPreviewMode: (preview: boolean) => set({ isPreviewMode: preview }),
        setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
        setShowRealTimePreview: (show: boolean) => set({ showRealTimePreview: show }),
        setAutoSaveEnabled: (enabled: boolean) => set({ autoSaveEnabled: enabled }),
        setPreviewDevice: (device: PreviewDevice) => set({ previewDevice: device }),

        // Edit Mode Actions
        startEditingPublishedPage: () => set({ isEditingPublishedPage: true, hasUnsavedChanges: false }),
        discardChanges: () => {
          set({ currentPage: get().originalPage, hasUnsavedChanges: false });
          get().addToHistory(get().originalPage, 'Discarded changes');
        },
        saveChanges: async (onSave?: (page: PageContent) => Promise<void>) => {
          const state = get();
          if (!onSave) return;

          try {
            set({ isSaving: true });
            // Save current state as draft (overwrites the current page)
            const draftPage = { 
              ...state.currentPage, 
              isDraft: true, 
              isPublished: false,
              lastModified: new Date().toISOString()
            };
            await onSave(draftPage);
            get().addToHistory(draftPage, 'Saved as draft');
            set({ hasUnsavedChanges: false });
          } catch (error) {
            const pageBuilderError = createPageBuilderError(
              error instanceof Error ? error : new Error('Save failed'),
              'save',
              { component: 'PageBuilder', recoverable: true }
            );
            logPageBuilderError(pageBuilderError);
            get().addError('Failed to save changes. Please try again.');
            throw error;
          } finally {
            set({ isSaving: false });
          }
        },

        // Error Management
        addError: (error: string) => {
          set((state) => ({
            errors: [...state.errors, error]
          }));
        },

        clearErrors: () => set({ errors: [] }),

        removeError: (index: number) => {
          set((state) => ({
            errors: state.errors.filter((_, i) => i !== index)
          }));
        },

        // Loading States
        setSaving: (saving: boolean) => set({ isSaving: saving }),
        setPublishing: (publishing: boolean) => set({ isPublishing: publishing }),
        setLoading: (loading: boolean) => set({ isLoading: loading }),

        // History Management
        addToHistory: (page: PageContent, description?: string) => {
          set((state) => {
            const newHistory = state.history.slice(0, state.historyIndex + 1);
            newHistory.push(page);
            
            // Limit history size to 50 entries
            if (newHistory.length > 50) {
              newHistory.shift();
            }

            return {
              history: newHistory,
              historyIndex: newHistory.length - 1,
              canUndo: newHistory.length > 1,
              canRedo: false
            };
          });
        },

        undo: () => {
          set((state) => {
            if (state.historyIndex > 0) {
              const newIndex = state.historyIndex - 1;
              const page = state.history[newIndex];
              return {
                currentPage: page,
                previewPage: page,
                historyIndex: newIndex,
                canUndo: newIndex > 0,
                canRedo: newIndex < state.history.length - 1
              };
            }
            return state;
          });
        },

        redo: () => {
          set((state) => {
            if (state.historyIndex < state.history.length - 1) {
              const newIndex = state.historyIndex + 1;
              const page = state.history[newIndex];
              return {
                currentPage: page,
                previewPage: page,
                historyIndex: newIndex,
                canUndo: newIndex > 0,
                canRedo: newIndex < state.history.length - 1
              };
            }
            return state;
          });
        },

        canUndoAction: () => get().canUndo,
        canRedoAction: () => get().canRedo,

        // Save/Publish Actions
        savePage: async (onSave?: (page: PageContent) => Promise<void>) => {
          const state = get();
          if (!onSave) return;

          try {
            set({ isSaving: true });
            await onSave(state.currentPage);
            get().addToHistory(state.currentPage, 'Saved');
          } catch (error) {
            const pageBuilderError = createPageBuilderError(
              error instanceof Error ? error : new Error('Save failed'),
              'save',
              { component: 'PageBuilder', recoverable: true }
            );
            logPageBuilderError(pageBuilderError);
            get().addError('Failed to save page. Please try again.');
            throw error;
          } finally {
            set({ isSaving: false });
          }
        },

        publishPage: async (onPublish?: (page: PageContent) => Promise<void>) => {
          const state = get();
          if (!onPublish) return;

          try {
            set({ isPublishing: true });
            const publishedPage = { ...state.currentPage, isPublished: true, isDraft: false };
            await onPublish(publishedPage);
            set({ 
              currentPage: publishedPage, 
              previewPage: publishedPage, 
              originalPage: publishedPage,
              isEditingPublishedPage: true,
              hasUnsavedChanges: false
            });
            get().addToHistory(publishedPage, 'Published');
          } catch (error) {
            const pageBuilderError = createPageBuilderError(
              error instanceof Error ? error : new Error('Publish failed'),
              'save',
              { component: 'PageBuilder', recoverable: true }
            );
            logPageBuilderError(pageBuilderError);
            get().addError('Failed to publish page. Please try again.');
            throw error;
          } finally {
            set({ isPublishing: false });
          }
        },

        // Reset
        reset: () => {
          set({
            currentPage: initialPage,
            previewPage: initialPage,
            selectedSection: null,
            isEditing: true,
            isPreviewMode: false,
            sidebarOpen: true,
            showRealTimePreview: true,
            autoSaveEnabled: true,
            previewDevice: initialPreviewDevice,
            errors: [],
            isSaving: false,
            isPublishing: false,
            isLoading: false,
            canUndo: false,
            canRedo: false,
            historyIndex: 0,
            history: [initialPage],
            isEditingPublishedPage: false,
            hasUnsavedChanges: false,
            originalPage: initialPage
          });
        }
      }),
      {
        name: 'page-builder-storage',
        partialize: (state) => ({
          // Only persist UI preferences, not page data
          sidebarOpen: state.sidebarOpen,
          showRealTimePreview: state.showRealTimePreview,
          autoSaveEnabled: state.autoSaveEnabled,
          previewDevice: state.previewDevice
        })
      }
    ),
    {
      name: 'page-builder-store'
    }
  )
); 
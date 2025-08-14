import { useState, useEffect, useCallback, useRef } from 'react';
import { PageContent } from '@/lib/types';

interface UseAutoSaveProps {
  data: PageContent;
  onSave: (data: PageContent) => Promise<void>;
  debounceMs?: number;
  enabled?: boolean;
}

interface AutoSaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  lastError: string | null;
  hasUnsavedChanges: boolean;
}

export function useAutoSave({
  data,
  onSave,
  debounceMs = 30000, // 30 seconds default
  enabled = true
}: UseAutoSaveProps) {
  const [state, setState] = useState<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    lastError: null,
    hasUnsavedChanges: false
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef<string>('');

  // Serialize data for comparison
  const serializeData = useCallback((data: PageContent) => {
    return JSON.stringify(data, null, 2);
  }, []);

  // Check if data has changed
  const hasDataChanged = useCallback((currentData: PageContent) => {
    const currentSerialized = serializeData(currentData);
    const hasChanged = currentSerialized !== lastDataRef.current;
    
    if (hasChanged) {
      lastDataRef.current = currentSerialized;
    }
    
    return hasChanged;
  }, [serializeData]);

  // Perform the actual save
  const performSave = useCallback(async (dataToSave: PageContent) => {
    if (!enabled) return;

    setState(prev => ({ ...prev, isSaving: true, lastError: null }));

    try {
      await onSave(dataToSave);
      setState(prev => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
        hasUnsavedChanges: false
      }));
    } catch (error) {
      console.error('Auto-save failed:', error);
      setState(prev => ({
        ...prev,
        isSaving: false,
        lastError: error instanceof Error ? error.message : 'Save failed',
        hasUnsavedChanges: true
      }));
    }
  }, [onSave, enabled]);

  // Debounced save function
  const debouncedSave = useCallback((dataToSave: PageContent) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      performSave(dataToSave);
    }, debounceMs);
  }, [performSave, debounceMs]);

  // Manual save function
  const saveNow = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    await performSave(data);
  }, [performSave, data]);

  // Effect to trigger auto-save when data changes
  useEffect(() => {
    if (!enabled) return;

    const hasChanged = hasDataChanged(data);
    
    if (hasChanged) {
      setState(prev => ({ ...prev, hasUnsavedChanges: true }));
      debouncedSave(data);
    }
  }, [data, hasDataChanged, debouncedSave, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Initialize lastDataRef on mount
  useEffect(() => {
    lastDataRef.current = serializeData(data);
  }, [serializeData, data]);

  return {
    ...state,
    saveNow,
    // Helper function to format last saved time
    getLastSavedText: () => {
      if (!state.lastSaved) return 'Never saved';
      const now = new Date();
      const diff = now.getTime() - state.lastSaved.getTime();
      const minutes = Math.floor(diff / 60000);
      
      if (minutes < 1) return 'Just now';
      if (minutes === 1) return '1 minute ago';
      if (minutes < 60) return `${minutes} minutes ago`;
      
      const hours = Math.floor(minutes / 60);
      if (hours === 1) return '1 hour ago';
      if (hours < 24) return `${hours} hours ago`;
      
      const days = Math.floor(hours / 24);
      if (days === 1) return '1 day ago';
      return `${days} days ago`;
    }
  };
} 
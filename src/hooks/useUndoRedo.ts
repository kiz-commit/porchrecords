import { useState, useCallback, useEffect, useRef } from 'react';
import { PageContent } from '@/lib/types';

interface UseUndoRedoProps {
  initialData: PageContent;
  maxHistorySize?: number;
}

interface HistoryEntry {
  data: PageContent;
  timestamp: number;
  description: string;
}

export function useUndoRedo({ initialData, maxHistorySize = 50 }: UseUndoRedoProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([
    {
      data: initialData,
      timestamp: Date.now(),
      description: 'Initial state'
    }
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isUndoRedoAction, setIsUndoRedoAction] = useState(false);

  // Track if we're currently performing an undo/redo to avoid adding to history
  const isUndoRedoRef = useRef(false);

  // Get current data
  const currentData = history[currentIndex]?.data || initialData;

  // Check if undo is available
  const canUndo = currentIndex > 0;

  // Check if redo is available
  const canRedo = currentIndex < history.length - 1;

  // Add new state to history
  const addToHistory = useCallback((newData: PageContent, description: string) => {
    if (isUndoRedoRef.current) {
      isUndoRedoRef.current = false;
      return;
    }

    setHistory(prevHistory => {
      // Remove any future history if we're not at the end
      const trimmedHistory = prevHistory.slice(0, currentIndex + 1);
      
      // Add new entry
      const newEntry: HistoryEntry = {
        data: newData,
        timestamp: Date.now(),
        description
      };

      const updatedHistory = [...trimmedHistory, newEntry];

      // Limit history size
      if (updatedHistory.length > maxHistorySize) {
        return updatedHistory.slice(-maxHistorySize);
      }

      return updatedHistory;
    });

    setCurrentIndex(prev => prev + 1);
  }, [currentIndex, maxHistorySize]);

  // Undo function
  const undo = useCallback(() => {
    if (!canUndo) return;

    isUndoRedoRef.current = true;
    setIsUndoRedoAction(true);
    
    setCurrentIndex(prev => {
      const newIndex = prev - 1;
      return newIndex;
    });

    // Reset the flag after a short delay
    setTimeout(() => {
      setIsUndoRedoAction(false);
    }, 100);
  }, [canUndo]);

  // Redo function
  const redo = useCallback(() => {
    if (!canRedo) return;

    isUndoRedoRef.current = true;
    setIsUndoRedoAction(true);
    
    setCurrentIndex(prev => {
      const newIndex = prev + 1;
      return newIndex;
    });

    // Reset the flag after a short delay
    setTimeout(() => {
      setIsUndoRedoAction(false);
    }, 100);
  }, [canRedo]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if we're in an input field
      const target = event.target as HTMLElement;
      const isInputField = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.contentEditable === 'true';

      // Only handle shortcuts if not in an input field (unless it's Ctrl+Z/Y)
      if (isInputField && !event.ctrlKey) return;

      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'z':
            if (event.shiftKey) {
              // Ctrl+Shift+Z or Cmd+Shift+Z (redo)
              event.preventDefault();
              redo();
            } else {
              // Ctrl+Z or Cmd+Z (undo)
              event.preventDefault();
              undo();
            }
            break;
          case 'y':
            // Ctrl+Y or Cmd+Y (redo)
            event.preventDefault();
            redo();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Get history information
  const getHistoryInfo = useCallback(() => {
    return {
      canUndo,
      canRedo,
      currentIndex,
      totalHistory: history.length,
      currentDescription: history[currentIndex]?.description || 'Unknown',
      lastAction: currentIndex > 0 ? history[currentIndex - 1]?.description : null
    };
  }, [canUndo, canRedo, currentIndex, history]);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([{
      data: currentData,
      timestamp: Date.now(),
      description: 'History cleared'
    }]);
    setCurrentIndex(0);
  }, [currentData]);

  return {
    currentData,
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    isUndoRedoAction,
    getHistoryInfo,
    clearHistory
  };
} 
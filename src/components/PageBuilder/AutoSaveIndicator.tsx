import React from 'react';

interface AutoSaveIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
  lastError: string | null;
  hasUnsavedChanges: boolean;
  getLastSavedText: () => string;
  onSaveNow?: () => void;
}

export default function AutoSaveIndicator({
  isSaving,
  lastSaved,
  lastError,
  hasUnsavedChanges,
  getLastSavedText,
  onSaveNow
}: AutoSaveIndicatorProps) {
  const getStatusColor = () => {
    if (lastError) return 'text-red-600';
    if (isSaving) return 'text-blue-600';
    if (hasUnsavedChanges) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusIcon = () => {
    if (lastError) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    
    if (isSaving) {
      return (
        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      );
    }
    
    if (hasUnsavedChanges) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    }
    
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    );
  };

  const getStatusText = () => {
    if (lastError) return 'Save failed';
    if (isSaving) return 'Saving...';
    if (hasUnsavedChanges) return 'Unsaved changes';
    return 'All changes saved';
  };

  return (
    <div className="flex items-center space-x-2 text-sm">
      <div className={`flex items-center space-x-1 ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="font-medium">{getStatusText()}</span>
      </div>
      
      {!isSaving && !lastError && (
        <span className="text-gray-500 text-xs">
          {getLastSavedText()}
        </span>
      )}
      
      {lastError && (
        <div className="flex items-center space-x-2">
          <span className="text-red-600 text-xs">{lastError}</span>
          {onSaveNow && (
            <button
              onClick={onSaveNow}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Retry
            </button>
          )}
        </div>
      )}
      
      {hasUnsavedChanges && !isSaving && onSaveNow && (
        <button
          onClick={onSaveNow}
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Save now
        </button>
      )}
    </div>
  );
} 
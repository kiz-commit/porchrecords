import React from 'react';

interface UndoRedoIndicatorProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  lastAction?: string;
  showShortcuts?: boolean;
}

export default function UndoRedoIndicator({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  lastAction,
  showShortcuts = true
}: UndoRedoIndicatorProps) {
  return (
    <div className="flex items-center space-x-2 text-sm">
      {/* Undo Button */}
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
          canUndo
            ? 'text-gray-700 hover:bg-gray-100'
            : 'text-gray-400 cursor-not-allowed'
        }`}
        title={canUndo ? `Undo${lastAction ? `: ${lastAction}` : ''}` : 'Nothing to undo'}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
        <span>Undo</span>
        {showShortcuts && (
          <span className="text-xs text-gray-500">Ctrl+Z</span>
        )}
      </button>

      {/* Divider */}
      <div className="w-px h-4 bg-gray-300"></div>

      {/* Redo Button */}
      <button
        onClick={onRedo}
        disabled={!canRedo}
        className={`flex items-center space-x-1 px-2 py-1 rounded transition-colors ${
          canRedo
            ? 'text-gray-700 hover:bg-gray-100'
            : 'text-gray-400 cursor-not-allowed'
        }`}
        title={canRedo ? 'Redo' : 'Nothing to redo'}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
        </svg>
        <span>Redo</span>
        {showShortcuts && (
          <span className="text-xs text-gray-500">Ctrl+Y</span>
        )}
      </button>

      {/* Last Action Display */}
      {lastAction && (
        <div className="ml-2 text-xs text-gray-500">
          Last: {lastAction}
        </div>
      )}
    </div>
  );
} 
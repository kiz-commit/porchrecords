"use client";

import React from 'react';
import { PageSection } from '@/lib/types';

interface SectionControlsProps {
  section: PageSection;
  isFirst: boolean;
  isLast: boolean;
  onEdit: (section: PageSection) => void;
  onMove: (sectionId: string, direction: 'up' | 'down') => void;
  onDelete: (sectionId: string) => void;
  onDuplicate: (sectionId: string) => void;
}

export default function SectionControls({
  section,
  isFirst,
  isLast,
  onEdit,
  onMove,
  onDelete,
  onDuplicate
}: SectionControlsProps) {
  return (
    <div className="absolute top-4 right-4 flex items-center space-x-1 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      {/* Edit Button */}
      <button
        onClick={() => onEdit(section)}
        className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
        title="Edit Section"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>

      {/* Move Up Button */}
      <button
        onClick={() => onMove(section.id, 'up')}
        disabled={isFirst}
        className={`p-2 rounded transition-colors ${
          isFirst
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`}
        title="Move Up"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {/* Move Down Button */}
      <button
        onClick={() => onMove(section.id, 'down')}
        disabled={isLast}
        className={`p-2 rounded transition-colors ${
          isLast
            ? 'text-gray-300 cursor-not-allowed'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`}
        title="Move Down"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Duplicate Button */}
      <button
        onClick={() => onDuplicate(section.id)}
        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
        title="Duplicate Section"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>

      {/* Delete Button */}
      <button
        onClick={() => onDelete(section.id)}
        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
        title="Delete Section"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
} 
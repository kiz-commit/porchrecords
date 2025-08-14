"use client";

import React, { useState } from 'react';
import { PageContent } from '@/lib/types';

// Define a local Version type based on usage
interface Version {
  id: string;
  version: number;
  title: string;
  description?: string;
  sections: any[];
  createdAt: string;
  comment?: string;
}

interface VersionHistoryProps {
  page: PageContent;
  onRestore: (version: Version) => void;
  onClose: () => void;
}

export default function VersionHistory({ page, onRestore, onClose }: VersionHistoryProps) {
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);

  // Only show version history if page.versions exists and is an array
  const versions = (page as any).versions as Version[] | undefined;

  if (!Array.isArray(versions) || versions.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">Version History</h3>
          <p className="text-gray-600 mb-4">No versions available for this page.</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Version History</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-3">
          {versions.map((version) => (
            <div
              key={version.id}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedVersion?.id === version.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedVersion(version)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Version {version.version}</h4>
                  <p className="text-sm text-gray-600">{version.title}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(version.createdAt).toISOString().split('T')[0]}
                  </p>
                  {version.comment && (
                    <p className="text-sm text-gray-600 mt-1">{version.comment}</p>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {version.sections.length} sections
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedVersion && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h4 className="font-medium mb-2">Version Details</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Title:</span> {selectedVersion.title}
              </div>
              <div>
                <span className="font-medium">Description:</span> {selectedVersion.description}
              </div>
              <div>
                <span className="font-medium">Sections:</span> {selectedVersion.sections.length}
              </div>
              <div>
                <span className="font-medium">Created:</span>{' '}
                {new Date(selectedVersion.createdAt).toISOString().split('T')[0]}
              </div>
            </div>
            <button
              onClick={() => {
                onRestore(selectedVersion);
                onClose();
              }}
              className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Restore This Version
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 
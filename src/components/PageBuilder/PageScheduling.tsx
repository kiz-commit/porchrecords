"use client";

import React, { useState } from 'react';
import { PageContent } from '@/lib/types';

interface PageSchedulingProps {
  page: PageContent;
  onUpdate: (updates: Partial<PageContent>) => void;
  onClose: () => void;
}

export default function PageScheduling({ page, onUpdate, onClose }: PageSchedulingProps) {
  const [publishAt, setPublishAt] = useState(page.published_at ? page.published_at.slice(0, 16) : '');
  const [unpublishAt, setUnpublishAt] = useState(page.unpublish_at ? page.unpublish_at.slice(0, 16) : '');

  const handleSave = () => {
    const updates: Partial<PageContent> = {};
    
    if (publishAt) {
      updates.published_at = new Date(publishAt).toISOString();
    } else {
      updates.published_at = undefined;
    }
    
    if (unpublishAt) {
      updates.unpublish_at = new Date(unpublishAt).toISOString();
    } else {
      updates.unpublish_at = undefined;
    }
    
    onUpdate(updates);
    onClose();
  };

  const handleClearSchedule = () => {
    onUpdate({
      published_at: undefined,
      unpublish_at: undefined,
    });
    setPublishAt('');
    setUnpublishAt('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Page Scheduling</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Publish At
            </label>
            <input
              type="datetime-local"
              value={publishAt}
              onChange={(e) => setPublishAt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to publish immediately
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Unpublish At
            </label>
            <input
              type="datetime-local"
              value={unpublishAt}
              onChange={(e) => setUnpublishAt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to keep published indefinitely
            </p>
          </div>

          {page.published_at && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Current Schedule:</strong><br />
                Publish: {new Date(page.published_at).toISOString().split('T')[0]}
              </p>
            </div>
          )}

          {page.unpublish_at && (
            <div className="p-3 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Unpublish:</strong> {new Date(page.unpublish_at).toISOString().split('T')[0]}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <button
            onClick={handleClearSchedule}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Clear Schedule
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Schedule
          </button>
        </div>
      </div>
    </div>
  );
} 
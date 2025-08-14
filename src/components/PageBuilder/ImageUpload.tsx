"use client";

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { ImageIcon, Upload, FolderOpen } from 'lucide-react';
import MediaLibrary from './MediaLibrary';
import { MediaItem } from '@/lib/types';

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  altText?: string;
  onAltTextChange?: (altText: string) => void;
  showAltText?: boolean;
}

export default function ImageUpload({ 
  value, 
  onChange, 
  placeholder = "Enter image URL or upload a file", 
  className = '',
  altText = '',
  onAltTextChange,
  showAltText = true
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setPreview(dataUrl);
        onChange(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlChange = (url: string) => {
    setPreview(url);
    onChange(url);
  };

  const handleRemoveImage = () => {
    setPreview(null);
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleMediaSelect = (media: MediaItem) => {
    setPreview(media.url);
    onChange(media.url);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* URL Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Image URL
        </label>
        <input
          type="text"
          value={value}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Alt Text Input */}
      {showAltText && onAltTextChange && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Alt Text <span className="text-gray-500">(for accessibility)</span>
          </label>
          <input
            type="text"
            value={altText}
            onChange={(e) => onAltTextChange(e.target.value)}
            placeholder="Describe the image for screen readers"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Alt text helps users with screen readers understand the image content.
          </p>
        </div>
      )}

      {/* File Upload */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Upload Image
        </label>
        <div className="flex flex-col space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            type="button"
            onClick={() => setShowMediaLibrary(true)}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
          >
            <FolderOpen className="w-4 h-4" />
            <span>Media Library</span>
          </button>
        </div>
      </div>

      {/* Preview */}
      {preview && (
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preview
          </label>
          <div className="relative inline-block">
            <div className="relative max-w-full h-32 rounded-lg border border-gray-200 overflow-hidden">
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 300px"
                onError={() => setPreview(null)}
              />
            </div>
            <button
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
              title="Remove image"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Media Library Modal */}
      {showMediaLibrary && (
        <MediaLibrary
          onClose={() => setShowMediaLibrary(false)}
          onSelect={handleMediaSelect}
        />
      )}
    </div>
  );
} 
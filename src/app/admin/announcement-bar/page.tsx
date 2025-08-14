"use client";

import AdminLayout from '@/components/AdminLayout';
import { useState, useEffect } from 'react';
import { useAnnouncementBar } from '@/contexts/AnnouncementBarContext';

export default function AnnouncementBarPage() {
  const { settings, updateSettings } = useAnnouncementBar();
  const [announcementSettings, setAnnouncementSettings] = useState({
    isEnabled: false,
    text: "",
    backgroundColor: "#1f2937",
    textColor: "#ffffff",
    speed: 20
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Initialize announcement settings from context
    setAnnouncementSettings({
      isEnabled: settings.isEnabled,
      text: settings.text,
      backgroundColor: settings.backgroundColor,
      textColor: settings.textColor,
      speed: settings.speed
    });
    setLoading(false);
  }, [settings]);

  const handleAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const response = await fetch('/api/admin/announcement-bar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(announcementSettings),
      });

      if (response.ok) {
        const result = await response.json();
        updateSettings(result.settings);
        alert('Announcement bar settings updated successfully!');
      } else {
        alert('Failed to update announcement bar settings');
      }
    } catch (error) {
      console.error('Error updating announcement bar:', error);
      alert('Error updating announcement bar settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setAnnouncementSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Announcement Bar</h1>
          <p className="mt-2 text-gray-600">
            Configure the announcement bar that appears at the top of your store.
          </p>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Settings</h2>
          </div>
          
          <form onSubmit={handleAnnouncementSubmit} className="p-6 space-y-6">
            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Enable Announcement Bar
                </label>
                <p className="text-sm text-gray-500">
                  Show or hide the announcement bar on your store
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleInputChange('isEnabled', !announcementSettings.isEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  announcementSettings.isEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    announcementSettings.isEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Announcement Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Announcement Text
              </label>
              <textarea
                value={announcementSettings.text}
                onChange={(e) => handleInputChange('text', e.target.value)}
                placeholder="Enter your announcement message..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
            </div>

            {/* Color Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Background Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={announcementSettings.backgroundColor}
                    onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                    className="h-10 w-16 border border-gray-300 rounded-md"
                  />
                  <input
                    type="text"
                    value={announcementSettings.backgroundColor}
                    onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="#1f2937"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Text Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={announcementSettings.textColor}
                    onChange={(e) => handleInputChange('textColor', e.target.value)}
                    className="h-10 w-16 border border-gray-300 rounded-md"
                  />
                  <input
                    type="text"
                    value={announcementSettings.textColor}
                    onChange={(e) => handleInputChange('textColor', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            </div>

            {/* Speed Setting */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scroll Speed (pixels per second)
              </label>
              <input
                type="range"
                min="5"
                max="50"
                value={announcementSettings.speed}
                onChange={(e) => handleInputChange('speed', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>Slow</span>
                <span>{announcementSettings.speed} px/s</span>
                <span>Fast</span>
              </div>
            </div>

            {/* Preview */}
            {announcementSettings.isEnabled && announcementSettings.text && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Preview</h3>
                <div
                  className="relative overflow-hidden h-8 bg-gray-100 rounded"
                  style={{ backgroundColor: announcementSettings.backgroundColor }}
                >
                  <div
                    className="absolute whitespace-nowrap text-sm font-medium"
                    style={{
                      color: announcementSettings.textColor,
                      animation: `scroll ${100 / announcementSettings.speed}s linear infinite`,
                    }}
                  >
                    {announcementSettings.text}
                  </div>
                </div>
                <style jsx>{`
                  @keyframes scroll {
                    0% { transform: translateX(100%); }
                    100% { transform: translateX(-100%); }
                  }
                `}</style>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
} 
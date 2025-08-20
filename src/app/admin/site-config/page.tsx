'use client';

import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { useHomepage } from '@/contexts/HomepageContext';
import AdminLayout from '@/components/AdminLayout';
import ThemeEditor from '@/components/admin/ThemeEditor';
import HomepageConfigEditor from '@/components/admin/HomepageConfigEditor';

import HomepageSectionBuilder from '@/components/admin/HomepageSectionBuilder';
import { ThemePerformanceMonitor } from '@/components/admin/ThemePerformanceMonitor';

export default function SiteConfigPage() {
  const { theme, isLoading: themeLoading, error: themeError } = useTheme();
  const { config: homepageConfig, isLoading: homepageLoading, error: homepageError } = useHomepage();
  const [activeTab, setActiveTab] = useState<'theme' | 'homepage' | 'sections' | 'performance'>('theme');

  const tabs = [
    { id: 'theme', label: 'Theme Configuration', icon: '🎨' },
    { id: 'homepage', label: 'Homepage Settings', icon: '🏠' },
    { id: 'sections', label: 'Homepage Sections', icon: '📄' },
    { id: 'performance', label: 'Performance', icon: '⚡' },
  ];

  if (themeLoading || homepageLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-mustard mx-auto mb-4"></div>
            <p className="text-gray-600">Loading configuration...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (themeError || homepageError) {
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold mb-2">Configuration Error</h3>
            <p className="text-red-700">
              {themeError || homepageError}
            </p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Site Configuration</h1>
          <p className="text-gray-600">
            Customize your site&apos;s appearance and homepage layout. Changes are applied in real-time.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-mustard text-mustard'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {activeTab === 'theme' && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Theme Configuration</h2>
                <p className="text-gray-600">
                  Customize colors, typography, spacing, and effects. Changes are applied immediately.
                </p>
              </div>
              {theme && <ThemeEditor theme={theme} />}
            </div>
          )}

          {activeTab === 'homepage' && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Homepage Settings</h2>
                <p className="text-gray-600">
                  Configure your homepage hero section and manage additional content sections.
                </p>
              </div>
              {homepageConfig && <HomepageConfigEditor config={homepageConfig} />}
            </div>
          )}

          {activeTab === 'sections' && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Homepage Sections</h2>
                <p className="text-gray-600">
                  Manage the sections that appear below your homepage hero. Add, edit, reorder, and configure each section.
                </p>
              </div>
              <HomepageSectionBuilder />
            </div>
          )}



          {activeTab === 'performance' && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Theme Performance</h2>
                <p className="text-gray-600">
                  Monitor theme loading performance, cache efficiency, and CSS update times.
                </p>
              </div>
              <ThemePerformanceMonitor />
            </div>
          )}
        </div>

        {/* Save Status */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            💡 All changes are automatically saved and applied in real-time
          </p>
        </div>
      </div>
    </AdminLayout>
  );
} 
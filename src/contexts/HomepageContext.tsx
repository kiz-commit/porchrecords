'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { HomepageConfig, HomepageSection } from '@/lib/types';
import { fetchHomepageConfig, fetchHomepageSections, updateHomepageConfigClient } from '@/lib/client-config-utils';

interface HomepageContextType {
  config: HomepageConfig | null;
  sections: HomepageSection[];
  homepageData: {
    highlightProducts: any[];
    latestProducts: any[];
    shows: any[];
  } | null;
  isLoading: boolean;
  error: string | null;
  updateConfig: (newConfig: Partial<HomepageConfig>) => Promise<void>;
  refreshConfig: () => Promise<void>;
  refreshSections: () => Promise<void>;
}

const HomepageContext = createContext<HomepageContextType | undefined>(undefined);

interface HomepageProviderProps {
  children: ReactNode;
}

export function HomepageProvider({ children }: HomepageProviderProps) {
  const [config, setConfig] = useState<HomepageConfig | null>(null);
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [homepageData, setHomepageData] = useState<{
    highlightProducts: any[];
    latestProducts: any[];
    shows: any[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load homepage configuration
  const loadConfig = async () => {
    try {
      setError(null);
      
      const homepageConfig = await fetchHomepageConfig();
      setConfig(homepageConfig);
    } catch (err) {
      console.error('Failed to load homepage config:', err);
      setError(err instanceof Error ? err.message : 'Failed to load homepage configuration');
    }
  };

  // Load homepage sections
  const loadSections = async () => {
    try {
      setError(null);
      
      const homepageSections = await fetchHomepageSections();
      setSections(homepageSections);
    } catch (err) {
      console.error('Failed to load homepage sections:', err);
      setError(err instanceof Error ? err.message : 'Failed to load homepage sections');
    }
  };

  // Load all homepage data in one optimized request
  const loadHomepageData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load config and optimized homepage data in parallel
      const [configResult, homepageResult] = await Promise.all([
        loadConfig(),
        fetch('/api/homepage/data').then(res => res.json())
      ]);
      
      if (homepageResult.success) {
        setSections(homepageResult.sections);
        setHomepageData(homepageResult.data);
        console.log('🚀 Homepage data loaded in optimized single request');
      } else {
        throw new Error(homepageResult.error || 'Failed to load homepage data');
      }
    } catch (err) {
      console.error('Failed to load homepage data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load homepage data');
      // Fallback to individual API calls
      await Promise.all([loadConfig(), loadSections()]);
    } finally {
      setIsLoading(false);
    }
  };

  // Update homepage configuration
  const updateConfig = async (newConfig: Partial<HomepageConfig>) => {
    try {
      setError(null);
      
      // Update in database
      await updateHomepageConfigClient(newConfig);
      
      // Reload config
      await loadConfig();
    } catch (err) {
      console.error('Failed to update homepage config:', err);
      setError(err instanceof Error ? err.message : 'Failed to update homepage configuration');
      throw err;
    }
  };

  // Refresh configuration from server
  const refreshConfig = async () => {
    await loadConfig();
  };

  // Refresh sections from server
  const refreshSections = async () => {
    await loadSections();
  };

  // Load data on mount
  useEffect(() => {
    loadHomepageData();
  }, []);

  const value: HomepageContextType = {
    config,
    sections,
    homepageData,
    isLoading,
    error,
    updateConfig,
    refreshConfig,
    refreshSections,
  };

  return (
    <HomepageContext.Provider value={value}>
      {children}
    </HomepageContext.Provider>
  );
}

export function useHomepage() {
  const context = useContext(HomepageContext);
  if (context === undefined) {
    throw new Error('useHomepage must be used within a HomepageProvider');
  }
  return context;
}

// Hook for homepage section management
export function useHomepageSections() {
  const { sections, refreshSections } = useHomepage();

  const createSection = async (sectionData: Omit<HomepageSection, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch('/api/admin/homepage-sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sectionData),
      });

      if (!response.ok) {
        throw new Error('Failed to create homepage section');
      }

      await refreshSections();
    } catch (err) {
      console.error('Failed to create section:', err);
      throw err;
    }
  };

  const updateSection = async (id: number, updates: Partial<HomepageSection>) => {
    try {
      const response = await fetch('/api/admin/homepage-sections', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to update homepage section');
      }

      await refreshSections();
    } catch (err) {
      console.error('Failed to update section:', err);
      throw err;
    }
  };

  const deleteSection = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/homepage-sections?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete homepage section');
      }

      await refreshSections();
    } catch (err) {
      console.error('Failed to delete section:', err);
      throw err;
    }
  };

  const reorderSections = async (newOrder: { id: number; order_index: number }[]) => {
    try {
      const response = await fetch('/api/admin/homepage-sections', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sections: newOrder }),
      });

      if (!response.ok) {
        throw new Error('Failed to reorder homepage sections');
      }

      await refreshSections();
    } catch (err) {
      console.error('Failed to reorder sections:', err);
      throw err;
    }
  };

  return {
    sections,
    createSection,
    updateSection,
    deleteSection,
    reorderSections,
    refreshSections,
  };
} 
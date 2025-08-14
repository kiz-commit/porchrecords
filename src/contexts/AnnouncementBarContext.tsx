"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AnnouncementBarSettings {
  isEnabled: boolean;
  text: string;
  backgroundColor: string;
  textColor: string;
  speed: number;
  updatedAt: string | null;
}

interface AnnouncementBarContextType {
  settings: AnnouncementBarSettings;
  loading: boolean;
  updateSettings: (newSettings: Partial<AnnouncementBarSettings>) => Promise<void>;
}

const AnnouncementBarContext = createContext<AnnouncementBarContextType | undefined>(undefined);

export function AnnouncementBarProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AnnouncementBarSettings>({
    isEnabled: false,
    text: "",
    backgroundColor: "#1f2937",
    textColor: "#ffffff",
    speed: 20,
    updatedAt: null
  });
  const [loading, setLoading] = useState(true);

  // Fetch announcement bar settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/announcement-bar');
        if (response.ok) {
          const data = await response.json();
          setSettings(data);
        }
      } catch (error) {
        console.error('Error fetching announcement bar settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const updateSettings = async (newSettings: Partial<AnnouncementBarSettings>) => {
    try {
      const response = await fetch('/api/admin/announcement-bar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...settings, ...newSettings }),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error updating announcement bar settings:', error);
    }
  };

  return (
    <AnnouncementBarContext.Provider value={{ settings, loading, updateSettings }}>
      {children}
    </AnnouncementBarContext.Provider>
  );
}

export function useAnnouncementBar() {
  const context = useContext(AnnouncementBarContext);
  if (context === undefined) {
    throw new Error('useAnnouncementBar must be used within an AnnouncementBarProvider');
  }
  return context;
} 
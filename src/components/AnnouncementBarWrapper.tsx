"use client";

import { useAnnouncementBar } from '@/contexts/AnnouncementBarContext';
import AnnouncementBar from './AnnouncementBar';
import { useEffect } from 'react';

export default function AnnouncementBarWrapper() {
  const { settings, loading } = useAnnouncementBar();

  // Add padding to body when announcement bar is visible
  useEffect(() => {
    if (settings.isEnabled && settings.text) {
      document.body.style.paddingTop = '40px';
    } else {
      document.body.style.paddingTop = '0px';
    }

    return () => {
      document.body.style.paddingTop = '0px';
    };
  }, [settings.isEnabled, settings.text]);

  if (loading || !settings.isEnabled || !settings.text) {
    return null;
  }

  return (
    <AnnouncementBar
      text={settings.text}
      backgroundColor={settings.backgroundColor}
      textColor={settings.textColor}
      speed={settings.speed}
      isVisible={settings.isEnabled}
    />
  );
} 
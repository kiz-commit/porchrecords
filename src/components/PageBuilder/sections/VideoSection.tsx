"use client";

import React, { useState } from 'react';
import { PageSection } from '@/lib/types';
import ImageFallback from '../ImageFallback';

interface VideoSectionProps {
  section: PageSection;
  isPreview: boolean;
}

export default function VideoSection({ section, isPreview }: VideoSectionProps) {
  const config = section.settings?.video;
  const [isPlaying, setIsPlaying] = useState(false);

  const getPaddingClass = () => {
    switch (config?.padding) {
      case 'small':
        return 'p-space-unit-2';
      case 'medium':
        return 'p-space-unit-3';
      case 'large':
        return 'p-space-unit-4';
      case 'xl':
        return 'py-20 px-space-unit-3';
      case '2xl':
        return 'py-24 px-space-unit-3';
      default:
        return 'p-space-unit-4';
    }
  };

  const getMaxWidthClass = () => {
    switch (config?.maxWidth) {
      case 'sm':
        return 'max-w-sm';
      case 'md':
        return 'max-w-md';
      case 'lg':
        return 'max-w-lg';
      case 'xl':
        return 'max-w-xl';
      case '2xl':
        return 'max-w-2xl';
      case '3xl':
        return 'max-w-3xl';
      case '4xl':
        return 'max-w-4xl';
      case '5xl':
        return 'max-w-5xl';
      case '6xl':
        return 'max-w-6xl';
      case 'full':
        return 'max-w-full';
      default:
        return 'max-w-4xl';
    }
  };

  const getAspectRatioClass = () => {
    switch (config?.aspectRatio) {
      case '16:9':
        return 'aspect-video';
      case '4:3':
        return 'aspect-4/3';
      case '1:1':
        return 'aspect-square';
      case '21:9':
        return 'aspect-[21/9]';
      case '3:2':
        return 'aspect-3/2';
      default:
        return 'aspect-video';
    }
  };

  const getAlignmentClass = () => {
    switch (config?.alignment) {
      case 'left':
        return 'text-left';
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-center';
    }
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1];
    if (!videoId) return null;
    
    const params = new URLSearchParams();
    if (config?.autoplay) params.append('autoplay', '1');
    if (config?.muted) params.append('muted', '1');
    if (config?.loop) params.append('loop', '1');
    if (config?.controls === false) params.append('controls', '0');
    if (config?.showInfo === false) params.append('showinfo', '0');
    if (config?.rel === false) params.append('rel', '0');
    
    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  };

  const getVimeoEmbedUrl = (url: string) => {
    const videoId = url.match(/vimeo\.com\/(?:video\/)?(\d+)/i)?.[1];
    if (!videoId) return null;
    
    const params = new URLSearchParams();
    if (config?.autoplay) params.append('autoplay', '1');
    if (config?.muted) params.append('muted', '1');
    if (config?.loop) params.append('loop', '1');
    if (config?.controls === false) params.append('controls', '0');
    if (config?.showTitle === false) params.append('title', '0');
    if (config?.showByline === false) params.append('byline', '0');
    if (config?.showPortrait === false) params.append('portrait', '0');
    
    return `https://player.vimeo.com/video/${videoId}?${params.toString()}`;
  };

  const renderVideo = () => {
    if (!config?.videoUrl) {
      return (
        <div className={`${getAspectRatioClass()} bg-gray-200 rounded-theme flex items-center justify-center`}>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="font-sans text-gray-500">No video URL provided</p>
          </div>
        </div>
      );
    }

    // YouTube
    if (config.videoType === 'youtube' || config.videoUrl.includes('youtube.com') || config.videoUrl.includes('youtu.be')) {
      const embedUrl = getYouTubeEmbedUrl(config.videoUrl);
      if (!embedUrl) {
        return (
          <div className={`${getAspectRatioClass()} bg-gray-200 rounded-theme flex items-center justify-center`}>
            <p className="font-sans text-gray-500">Invalid YouTube URL</p>
          </div>
        );
      }

      return (
        <iframe
          src={embedUrl}
          className={`w-full ${getAspectRatioClass()} rounded-theme`}
          allowFullScreen
          title={config.caption || 'YouTube video'}
          loading="lazy"
        />
      );
    }

    // Vimeo
    if (config.videoType === 'vimeo' || config.videoUrl.includes('vimeo.com')) {
      const embedUrl = getVimeoEmbedUrl(config.videoUrl);
      if (!embedUrl) {
        return (
          <div className={`${getAspectRatioClass()} bg-gray-200 rounded-theme flex items-center justify-center`}>
            <p className="font-sans text-gray-500">Invalid Vimeo URL</p>
          </div>
        );
      }

      return (
        <iframe
          src={embedUrl}
          className={`w-full ${getAspectRatioClass()} rounded-theme`}
          allowFullScreen
          title={config.caption || 'Vimeo video'}
          loading="lazy"
        />
      );
    }

    // Local video
    if (config.videoType === 'local' || config.videoUrl.match(/\.(mp4|webm|ogg|mov)$/i)) {
      return (
        <video
          className={`w-full ${getAspectRatioClass()} rounded-theme`}
          controls={config?.controls !== false}
          autoPlay={config?.autoplay}
          muted={config?.muted}
          loop={config?.loop}
          poster={config?.poster}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        >
          <source src={config.videoUrl} type="video/mp4" />
          <source src={config.videoUrl} type="video/webm" />
          <source src={config.videoUrl} type="video/ogg" />
          Your browser does not support the video tag.
        </video>
      );
    }

    // Fallback
    return (
      <div className={`${getAspectRatioClass()} bg-gray-200 rounded-theme flex items-center justify-center`}>
        <p className="font-sans text-gray-500">Unsupported video format</p>
      </div>
    );
  };

  return (
    <section 
      className={`${getPaddingClass()} transition-theme`}
      style={{
        backgroundColor: config?.backgroundColor === 'primary' ? 'var(--color-primary)' :
          config?.backgroundColor === 'secondary' ? 'var(--color-secondary)' :
          config?.backgroundColor === 'background' ? 'var(--color-background)' :
          config?.backgroundColor === 'offwhite' ? 'var(--color-offwhite)' :
          'var(--color-background)'
      }}
    >
      <div className={`mx-auto ${getMaxWidthClass()}`}>
        <div className={getAlignmentClass()}>
          {/* Title */}
          {section.content && (
            <h2 
              className="font-serif text-scale-4 font-bold mb-6"
              style={{ 
                color: config?.textColor === 'primary' ? 'var(--color-primary)' :
                  config?.textColor === 'secondary' ? 'var(--color-secondary)' :
                  config?.textColor === 'background' ? 'var(--color-background)' :
                  config?.textColor === 'offwhite' ? 'var(--color-offwhite)' :
                  config?.textColor === 'black' ? 'var(--color-black)' :
                  'var(--color-foreground)'
              }}
            >
              {section.content}
            </h2>
          )}

          {/* Video */}
          <div className="relative">
            {renderVideo()}
            
            {/* Play Button Overlay for Local Videos */}
            {config?.videoType === 'local' && config?.poster && !isPlaying && (
              <button
                onClick={() => {
                  const video = document.querySelector('video');
                  if (video) video.play();
                }}
                className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-40 transition-theme rounded-theme"
              >
                <div className="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-black ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>
            )}
          </div>

          {/* Caption */}
          {config?.caption && (
            <p 
              className="font-sans text-scale-1 text-gray-600 mt-4"
              style={{ 
                color: config?.textColor === 'primary' ? 'var(--color-primary)' :
                  config?.textColor === 'secondary' ? 'var(--color-secondary)' :
                  config?.textColor === 'background' ? 'var(--color-background)' :
                  config?.textColor === 'offwhite' ? 'var(--color-offwhite)' :
                  config?.textColor === 'black' ? 'var(--color-black)' :
                  'var(--color-foreground)'
              }}
            >
              {config.caption}
            </p>
          )}

          {/* Description */}
          {config?.description && (
            <div 
              className="font-sans text-scale-1 mt-6 leading-relaxed"
              style={{ 
                color: config?.textColor === 'primary' ? 'var(--color-primary)' :
                  config?.textColor === 'secondary' ? 'var(--color-secondary)' :
                  config?.textColor === 'background' ? 'var(--color-background)' :
                  config?.textColor === 'offwhite' ? 'var(--color-offwhite)' :
                  config?.textColor === 'black' ? 'var(--color-black)' :
                  'var(--color-foreground)'
              }}
              dangerouslySetInnerHTML={{ __html: config.description }}
            />
          )}
        </div>
      </div>
    </section>
  );
}

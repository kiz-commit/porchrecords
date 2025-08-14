"use client";

import React, { useState, useRef, useEffect } from 'react';
import { PageSection } from '@/lib/types';
import ImageFallback from '../ImageFallback';

interface AudioSectionProps {
  section: PageSection;
  isPreview: boolean;
}

interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  audioUrl: string;
  albumArt?: string;
  duration?: number;
}

export default function AudioSection({ section, isPreview }: AudioSectionProps) {
  const config = section.settings?.audio;
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  // Default playlist if none provided
  const defaultPlaylist: AudioTrack[] = [
    {
      id: '1',
      title: 'Featured Track',
      artist: 'Porch Records',
      album: 'Demo Album',
      audioUrl: '/sample-audio.mp3',
      albumArt: '/placeholder-album.jpg',
      duration: 180
    }
  ];

  const playlist = config?.playlist?.length > 0 ? config.playlist : defaultPlaylist;
  const currentTrack = playlist[currentTrackIndex];

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
        return 'max-w-2xl';
    }
  };

  const getPlayerStyle = () => {
    switch (config?.playerStyle) {
      case 'minimal':
        return 'minimal-player';
      case 'compact':
        return 'compact-player';
      case 'full':
        return 'full-player';
      default:
        return 'default-player';
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  const handleNextTrack = () => {
    if (currentTrackIndex < playlist.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1);
    } else if (config?.loop) {
      setCurrentTrackIndex(0);
    }
  };

  const handlePrevTrack = () => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(currentTrackIndex - 1);
    }
  };

  const handleTrackSelect = (index: number) => {
    setCurrentTrackIndex(index);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      if (config?.loop) {
        audio.currentTime = 0;
        audio.play();
      } else {
        handleNextTrack();
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [config?.loop]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = currentTrack.audioUrl;
      audioRef.current.load();
      if (config?.autoplay) {
        audioRef.current.play();
      }
    }
  }, [currentTrackIndex, currentTrack.audioUrl, config?.autoplay]);

  const renderMinimalPlayer = () => (
    <div className="flex items-center space-x-4 p-4 bg-white rounded-theme shadow-sm">
      <button
        onClick={handlePlayPause}
        className="w-12 h-12 bg-primary rounded-full flex items-center justify-center hover:bg-primary/90 transition-theme"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        {isPlaying ? (
          <svg className="w-6 h-6 text-black" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-black ml-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        )}
      </button>
      
      <div className="flex-1 min-w-0">
        <p className="font-sans font-semibold text-scale-1 truncate">{currentTrack.title}</p>
        <p className="font-sans text-sm text-gray-600 truncate">{currentTrack.artist}</p>
      </div>
      
      <div className="text-sm text-gray-500">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>
    </div>
  );

  const renderFullPlayer = () => (
    <div className="bg-white rounded-theme shadow-sm overflow-hidden">
      {/* Album Art */}
      {currentTrack.albumArt && (
        <div className="aspect-square bg-gray-200">
          <ImageFallback
            src={currentTrack.albumArt}
            alt={`${currentTrack.album} cover`}
            width={400}
            height={400}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Player Controls */}
      <div className="p-6">
        {/* Track Info */}
        <div className="text-center mb-6">
          <h3 className="font-serif text-scale-2 font-bold mb-2">{currentTrack.title}</h3>
          <p className="font-sans text-scale-1 text-gray-600 mb-1">{currentTrack.artist}</p>
          {currentTrack.album && (
            <p className="font-sans text-sm text-gray-500">{currentTrack.album}</p>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-sm text-gray-500 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center space-x-4 mb-4">
          <button
            onClick={handlePrevTrack}
            disabled={currentTrackIndex === 0}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-theme"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 9H17a1 1 0 110 2h-5.586l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>

          <button
            onClick={handlePlayPause}
            className="w-16 h-16 bg-primary rounded-full flex items-center justify-center hover:bg-primary/90 transition-theme"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            {isPlaying ? (
              <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-black ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          <button
            onClick={handleNextTrack}
            disabled={currentTrackIndex === playlist.length - 1}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-theme"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.794L4.5 14H2a1 1 0 01-1-1V7a1 1 0 011-1h2.5l3.883-2.794a1 1 0 011.617.794zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </div>

      {/* Playlist */}
      {config?.showPlaylist && playlist.length > 1 && (
        <div className="border-t border-gray-200">
          <div className="p-4">
            <h4 className="font-sans font-semibold mb-3">Playlist</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {playlist.map((track: AudioTrack, index: number) => (
                <button
                  key={track.id}
                  onClick={() => handleTrackSelect(index)}
                  className={`w-full text-left p-2 rounded-theme transition-theme ${
                    index === currentTrackIndex
                      ? 'bg-primary text-black'
                      : 'hover:bg-gray-100'
                  }`}
                  style={{
                    backgroundColor: index === currentTrackIndex ? 'var(--color-primary)' : 'transparent',
                    color: index === currentTrackIndex ? 'var(--color-black)' : 'inherit'
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 flex items-center justify-center">
                      {index === currentTrackIndex && isPlaying ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <span className="text-sm font-mono">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-sans font-medium truncate">{track.title}</p>
                      <p className="font-sans text-sm text-gray-600 truncate">{track.artist}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

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
        {/* Title */}
        {section.content && (
          <div className="text-center mb-8">
            <h2 
              className="font-serif text-scale-4 font-bold mb-4"
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
            {config?.description && (
              <p 
                className="font-sans text-scale-1 text-gray-600"
                style={{ color: 'var(--color-foreground)' }}
              >
                {config.description}
              </p>
            )}
          </div>
        )}

        {/* Audio Player */}
        {config?.playerStyle === 'minimal' ? renderMinimalPlayer() : renderFullPlayer()}

        {/* Hidden audio element */}
        <audio
          ref={audioRef}
          preload="metadata"
          style={{ display: 'none' }}
        />
      </div>
    </section>
  );
}

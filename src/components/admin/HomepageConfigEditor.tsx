'use client';

import React, { useState, useEffect } from 'react';
import { HomepageConfig } from '@/lib/types';
import { useHomepage } from '@/contexts/HomepageContext';
import Image from 'next/image';

interface HomepageConfigEditorProps {
  config: HomepageConfig;
}

interface HeroImage {
  id: string;
  src: string;
  alt: string;
  order: number;
}

export default function HomepageConfigEditor({ config }: HomepageConfigEditorProps) {
  const { updateConfig } = useHomepage();
  
  // Provide default config structure if config or hero is undefined
  const defaultConfig: HomepageConfig = {
    hero: {
      title: 'PORCH RECORDS',
      subtitle: 'Record Store. Live Shows. Nice Times.',
      location: 'WORKING & CREATING ON KAURNA COUNTRY. SOUTH AUSTRALIA.',
      showLocation: true,
      carouselSpeed: 5,
      bannerOpacity: 1
    }
  };
  
  const safeConfig = config || defaultConfig;
  const safeHeroConfig = safeConfig.hero || defaultConfig.hero;
  
  const [localConfig, setLocalConfig] = useState<HomepageConfig>({
    ...safeConfig,
    hero: safeHeroConfig
  });
  const [heroImages, setHeroImages] = useState<HeroImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchHeroImages();
  }, []);

  const fetchHeroImages = async () => {
    try {
      const response = await fetch('/api/admin/site-config?key=homepage.hero.images');
      if (response.ok) {
        const data = await response.json();
        if (data.config_value) {
          // The API already returns parsed JSON, so no need to parse again
          setHeroImages(data.config_value);
        }
      }
    } catch (error) {
      console.error('Error fetching hero images:', error);
    }
  };

  const saveHeroImages = async (images: HeroImage[]) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/site-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config_key: 'homepage.hero.images',
          config_value: JSON.stringify(images),
        }),
      });

      if (response.ok) {
        setMessage('Hero images saved successfully!');
        setTimeout(() => setMessage(''), 3000);
        return true;
      } else {
        setMessage('Failed to save hero images');
        setTimeout(() => setMessage(''), 3000);
        return false;
      }
    } catch (error) {
      console.error('Error saving hero images:', error);
      setMessage('Error saving hero images');
      setTimeout(() => setMessage(''), 3000);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleHeroChange = (key: keyof HomepageConfig['hero'], value: string | boolean | number) => {
    const newConfig = {
      ...localConfig,
      hero: {
        ...localConfig.hero,
        [key]: value,
      },
    };
    setLocalConfig(newConfig);
    updateConfig({ hero: newConfig.hero });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const newImages = [...heroImages];
      newImages[index] = {
        ...newImages[index],
        src: e.target?.result as string,
        alt: file.name
      };
      setHeroImages(newImages);
      await saveHeroImages(newImages);
    };
    reader.readAsDataURL(file);
  };

  const handleReorder = async (fromIndex: number, toIndex: number) => {
    const newImages = [...heroImages];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    
    newImages.forEach((image, index) => {
      image.order = index + 1;
    });
    
    setHeroImages(newImages);
    await saveHeroImages(newImages);
  };

  const handleRemoveImage = async (index: number) => {
    if (heroImages.length <= 1) {
      setMessage('At least one image is required!');
      setTimeout(() => setMessage(''), 3000);
      return;
    }
    
    const newImages = heroImages.filter((_, i) => i !== index);
    newImages.forEach((image, index) => {
      image.order = index + 1;
    });
    setHeroImages(newImages);
    await saveHeroImages(newImages);
  };

  const handleAddImage = async () => {
    const newImage: HeroImage = {
      id: Date.now().toString(),
      src: '/hero-image.jpg',
      alt: `Porch Records Hero ${heroImages.length + 1}`,
      order: heroImages.length + 1
    };
    const newImages = [...heroImages, newImage];
    setHeroImages(newImages);
    await saveHeroImages(newImages);
  };

  return (
    <div className="space-y-8">
      {message && (
        <div className="p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Configuration Panel */}
        <div>
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Hero Section Settings</h3>
          
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hero Title
              </label>
              <input
                type="text"
                value={localConfig.hero.title}
                onChange={(e) => handleHeroChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mustard focus:border-transparent"
                placeholder="Enter hero title"
              />
            </div>

            {/* Subtitle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hero Subtitle
              </label>
              <textarea
                value={localConfig.hero.subtitle}
                onChange={(e) => handleHeroChange('subtitle', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mustard focus:border-transparent"
                placeholder="Enter hero subtitle"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={localConfig.hero.location}
                onChange={(e) => handleHeroChange('location', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mustard focus:border-transparent"
                placeholder="Enter location"
              />
            </div>

            {/* Show Location Toggle */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={localConfig.hero.showLocation}
                  onChange={(e) => handleHeroChange('showLocation', e.target.checked)}
                  className="h-4 w-4 text-mustard focus:ring-mustard border-gray-300 rounded"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Show location in hero section
                </span>
              </label>
            </div>

            {/* Carousel Speed */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Carousel Speed (seconds)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={localConfig.hero.carouselSpeed}
                onChange={(e) => handleHeroChange('carouselSpeed', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-mustard focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                How fast the hero images cycle through (1-10 seconds)
              </p>
            </div>

            {/* Banner Opacity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Banner Opacity
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={localConfig.hero.bannerOpacity ?? 1}
                onChange={(e) => handleHeroChange('bannerOpacity', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Transparent</span>
                <span>{Math.round((localConfig.hero.bannerOpacity ?? 1) * 100)}%</span>
                <span>Opaque</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Control the transparency of the subtitle banner background
              </p>
            </div>
          </div>
        </div>
      </div>


      </div>

      {/* Live Preview */}
      <div>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Hero Preview</h3>
          <div className="bg-gray-50 rounded-lg p-6 min-h-[300px]">
            <div className="text-center space-y-4">
              {/* Title Preview */}
              <h1 className="text-3xl font-bold text-gray-900">
                {localConfig.hero.title || 'Hero Title'}
              </h1>
              
              {/* Subtitle Preview */}
              {localConfig.hero.subtitle && (
                <p className="text-lg max-w-md mx-auto px-4 py-2 rounded"
                   style={{
                     backgroundColor: `rgba(225, 184, 75, ${localConfig.hero.bannerOpacity ?? 1})`,
                     color: '#181818'
                   }}>
                  {localConfig.hero.subtitle}
                </p>
              )}
              
              {/* Location Preview */}
              {localConfig.hero.showLocation && localConfig.hero.location && (
                <div className="flex items-center justify-center space-x-2 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{localConfig.hero.location}</span>
                </div>
              )}
              
              {/* Carousel Speed Indicator */}
              <div className="text-xs text-gray-400">
                Carousel speed: {localConfig.hero.carouselSpeed}s
              </div>
            </div>
          </div>
        </div>

        {/* Current Settings Summary */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Current Settings</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Title:</span>
              <span className="font-medium">{localConfig.hero.title || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Subtitle:</span>
              <span className="font-medium">
                {localConfig.hero.subtitle ? `${localConfig.hero.subtitle.substring(0, 30)}...` : 'Not set'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Location:</span>
              <span className="font-medium">{localConfig.hero.location || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Show Location:</span>
              <span className="font-medium">{localConfig.hero.showLocation ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Carousel Speed:</span>
              <span className="font-medium">{localConfig.hero.carouselSpeed}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Banner Opacity:</span>
              <span className="font-medium">{Math.round((localConfig.hero.bannerOpacity ?? 1) * 100)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Image Management */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Hero Images</h3>
          <button
            onClick={handleAddImage}
            disabled={isLoading}
            className="px-4 py-2 bg-mustard text-white rounded-md hover:bg-mustard/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Loading...' : 'Add Image'}
          </button>
        </div>

        <div className="space-y-4">
          {heroImages.map((image, index) => (
            <div key={image.id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
              <div className="flex-shrink-0">
                <div className="relative w-24 h-16 bg-gray-100 rounded overflow-hidden">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-gray-700">Order: {image.order}</span>
                  <span className="text-sm text-gray-500">•</span>
                  <span className="text-sm text-gray-500">{image.alt}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, index)}
                      className="hidden"
                    />
                    <span className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors">
                      Change Image
                    </span>
                  </label>
                  
                  {index > 0 && (
                    <button
                      onClick={() => handleReorder(index, index - 1)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      ↑ Move Up
                    </button>
                  )}
                  
                  {index < heroImages.length - 1 && (
                    <button
                      onClick={() => handleReorder(index, index + 1)}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      ↓ Move Down
                    </button>
                  )}
                  
                  {heroImages.length > 1 && (
                    <button
                      onClick={() => handleRemoveImage(index)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">Preview</h4>
          <p className="text-sm text-blue-700">
            Your home page currently displays {heroImages.length} hero image{heroImages.length !== 1 ? 's' : ''} in a carousel that rotates every {localConfig.hero.carouselSpeed} seconds.
          </p>
        </div>
      </div>
    </div>
  );
} 
"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useChunkErrorHandler } from '@/hooks/useChunkErrorHandler';

interface HeroImage {
  id: string;
  src: string;
  alt: string;
  order: number;
}

// Default images for immediate loading
const defaultImages: HeroImage[] = [
  { id: '1', src: '/hero-image.jpg', alt: 'Porch Records Hero 1', order: 1 },
  { id: '2', src: '/hero-image2.jpg', alt: 'Porch Records Hero 2', order: 2 },
  { id: '3', src: '/hero-image3.jpg', alt: 'Porch Records Hero 3', order: 3 },
];

interface HomepageClientProps {
  homepageData?: any;
  homepageConfig?: any;
}

export function HomepageClient({ homepageData, homepageConfig }: HomepageClientProps) {
  const [current, setCurrent] = useState(0);
  const [heroImages, setHeroImages] = useState<HeroImage[]>(defaultImages);
  const [isLoading, setIsLoading] = useState(false);
  
  // Add chunk error handling
  useChunkErrorHandler();

  // Use server-preloaded data if available
  useEffect(() => {
    if (homepageData?.sections) {
      console.log('🚀 Using server-preloaded homepage data');
    }
  }, [homepageData]);

  // Load hero images from configuration
  useEffect(() => {
    const loadHeroImages = async () => {
      try {
        const response = await fetch('/api/admin/site-config?key=homepage.hero.images');
        if (response.ok) {
          const data = await response.json();
          if (data.config_value) {
            const configImages = data.config_value;
            if (configImages.length > 0) {
              setHeroImages(configImages);
            }
          }
        }
      } catch (error) {
        console.error('Error loading hero images:', error);
      }
    };

    loadHeroImages();
  }, []);

  useEffect(() => {
    // Preload all images for smooth transitions
    heroImages.forEach(image => {
      const img = new window.Image();
      img.src = image.src;
    });

    // Fetch updated images from API in background
    fetchHeroImages();
  }, [heroImages]);

  // Preload next image for smoother transitions
  useEffect(() => {
    if (heroImages.length > 1) {
      const nextIndex = (current + 1) % heroImages.length;
      const nextImage = new window.Image();
      nextImage.src = heroImages[nextIndex].src;
    }
  }, [current, heroImages]);

  const fetchHeroImages = async () => {
    try {
      const response = await fetch('/api/admin/home');
      if (response.ok) {
        const data = await response.json();
        const sortedImages = data.images?.sort((a: HeroImage, b: HeroImage) => a.order - b.order) || [];
        if (sortedImages.length > 0) {
          setHeroImages(sortedImages);
        }
      }
    } catch (error) {
      console.error('Error fetching hero images:', error);
    }
  };

  useEffect(() => {
    if (heroImages.length > 0 && !isLoading) {
      const carouselSpeed = homepageConfig?.hero?.carouselSpeed || 5;
      const interval = setInterval(() => {
        setCurrent((prev) => (prev + 1) % heroImages.length);
      }, carouselSpeed * 1000);

      return () => clearInterval(interval);
    }
  }, [heroImages.length, isLoading, homepageConfig?.hero?.carouselSpeed]);

  return (
    <main className="h-screen relative flex items-center justify-center text-center bg-black">
      {/* Background Image Carousel */}
      {heroImages.length > 0 && (
        <Image
          src={heroImages[current].src}
          alt={heroImages[current].alt}
          fill
          className="object-cover transition-all duration-700"
          priority
          sizes="100vw"
          quality={90}
          placeholder="blur"
          blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
          onLoad={() => setIsLoading(false)}
        />
      )}
      {/* Grain Overlay */}
      <div className="grain-overlay" />
      
      {/* Loading Indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Centered Text Content */}
      <div className="relative z-10 flex flex-col items-center w-full px-4">
        <h1 className="text-5xl md:text-7xl font-serif flicker tracking-tight mb-4" style={{ color: 'white' }}>
          {homepageConfig?.hero?.title || 'PORCH RECORDS'}
        </h1>
        <p className="text-xl md:text-2xl font-mono px-4 py-2 rounded shadow flicker" 
           style={{ 
             animationDelay: '0.3s',
             backgroundColor: `rgba(var(--color-mustard-rgb), ${homepageConfig?.hero?.bannerOpacity ?? 1})`,
             color: 'var(--color-black)'
           }}>
          {homepageConfig?.hero?.subtitle || 'Record Store. Live Shows. Nice Times.'}
        </p>
        {/* Show location if enabled or if no config is available (default behavior) */}
        {(homepageConfig?.hero?.showLocation !== false) && (
          <span className="mt-6 text-base md:text-lg font-mono text-white flicker drop-shadow-lg" 
                style={{ animationDelay: '0.6s' }}>
            {homepageConfig?.hero?.location || 'WORKING & CREATING ON KAURNA COUNTRY. SOUTH AUSTRALIA.'}
          </span>
        )}
      </div>
    </main>
  );
}

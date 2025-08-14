'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface AboutPreviewProps {
  title?: string;
  subtitle?: string;
  content?: string;
  ctaText?: string;
  ctaLink?: string;
  image?: string;
}

export default function AboutPreview({
  title = "About Porch Records",
  subtitle = "Independent record label, physical record store, live-music promoter, and creative studio",
  content = "Based in Adelaide, we curate and showcase forward-thinking music across Jazz, Funk, Soul, Hip Hop, and international grooves.",
  ctaText = "Learn More",
  ctaLink = "/about",
  image = "/hero-image.jpg"
}: AboutPreviewProps) {
  return (
    <section className="py-16" style={{ backgroundColor: 'var(--color-offwhite)' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-6">
            <div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-mono uppercase tracking-wider mb-6" style={{ color: 'var(--color-black)' }}>
                {title}
              </h2>
              <p className="text-sm md:text-base font-mono uppercase tracking-wide opacity-70 mb-6 text-gray-700">
                {subtitle}
              </p>
              <p className="text-gray-600 leading-relaxed">
                {content}
              </p>
            </div>

            {/* CTA Button */}
            {ctaText && ctaLink && (
              <div>
                <Link
                  href={ctaLink}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md transition-colors"
                  style={{
                    backgroundColor: 'var(--color-mustard)',
                    color: 'var(--color-black)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-clay)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-mustard)';
                  }}
                >
                  {ctaText}
                  <svg className="ml-2 -mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            )}

            {/* Stats or Features */}
            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-gray-200">
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: 'var(--color-clay)' }}>
                  500+
                </div>
                <div className="text-sm text-gray-600">Vinyl Records</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: 'var(--color-clay)' }}>
                  50+
                </div>
                <div className="text-sm text-gray-600">Live Shows</div>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative">
            <div className="aspect-square rounded-lg overflow-hidden shadow-lg">
              <Image
                src={image}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            
            {/* Decorative Elements */}
            <div 
              className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-20"
              style={{ backgroundColor: 'var(--color-mustard)' }}
            ></div>
            <div 
              className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full opacity-30"
              style={{ backgroundColor: 'var(--color-clay)' }}
            ></div>
          </div>
        </div>
      </div>
    </section>
  );
} 
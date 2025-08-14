"use client";

import React, { useState, useEffect } from 'react';
import { PageSection } from '@/lib/types';
import ImageFallback from '../ImageFallback';

interface SocialFeedSectionProps {
  section: PageSection;
  isPreview: boolean;
}

interface SocialPost {
  id: string;
  platform: 'instagram' | 'facebook' | 'twitter' | 'youtube';
  content: string;
  image?: string;
  video?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  date: string;
  url: string;
  author: string;
  authorAvatar?: string;
}

export default function SocialFeedSection({ section, isPreview }: SocialFeedSectionProps) {
  const config = section.settings?.socialFeed;
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Default social posts if no API integration
  const defaultPosts: SocialPost[] = [
    {
      id: '1',
      platform: 'instagram',
      content: 'Check out this amazing vinyl we just got in! 🎵 #vinyl #music #porchrecords',
      image: '/placeholder-social.jpg',
      likes: 42,
      comments: 8,
      date: '2024-01-15T10:30:00Z',
      url: 'https://instagram.com/p/example',
      author: 'Porch Records',
      authorAvatar: '/placeholder-avatar.jpg'
    },
    {
      id: '2',
      platform: 'facebook',
      content: 'Join us this weekend for our monthly vinyl swap meet! Great deals and even better music.',
      image: '/placeholder-social.jpg',
      likes: 67,
      comments: 12,
      shares: 5,
      date: '2024-01-14T15:45:00Z',
      url: 'https://facebook.com/post/example',
      author: 'Porch Records',
      authorAvatar: '/placeholder-avatar.jpg'
    },
    {
      id: '3',
      platform: 'twitter',
      content: 'New arrivals this week include some rare jazz pressings and classic rock albums. DM us for details! 🎷🎸',
      likes: 23,
      comments: 4,
      date: '2024-01-13T09:15:00Z',
      url: 'https://twitter.com/status/example',
      author: '@porchrecords',
      authorAvatar: '/placeholder-avatar.jpg'
    },
    {
      id: '4',
      platform: 'youtube',
      content: 'Behind the scenes: How we curate our vinyl collection',
      video: '/placeholder-video.jpg',
      likes: 89,
      comments: 15,
      date: '2024-01-12T14:20:00Z',
      url: 'https://youtube.com/watch?v=example',
      author: 'Porch Records',
      authorAvatar: '/placeholder-avatar.jpg'
    },
    {
      id: '5',
      platform: 'instagram',
      content: 'Studio session vibes today 🎙️ #recording #music #studio',
      image: '/placeholder-social.jpg',
      likes: 34,
      comments: 6,
      date: '2024-01-11T16:30:00Z',
      url: 'https://instagram.com/p/example2',
      author: 'Porch Records',
      authorAvatar: '/placeholder-avatar.jpg'
    },
    {
      id: '6',
      platform: 'facebook',
      content: 'Happy to announce our partnership with local artists! Supporting the community one record at a time.',
      image: '/placeholder-social.jpg',
      likes: 45,
      comments: 9,
      shares: 3,
      date: '2024-01-10T11:00:00Z',
      url: 'https://facebook.com/post/example2',
      author: 'Porch Records',
      authorAvatar: '/placeholder-avatar.jpg'
    }
  ];

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

  const getLayoutClass = () => {
    switch (config?.layout) {
      case 'grid':
        return `grid gap-6 ${
          config?.columns === 1 ? 'grid-cols-1' :
          config?.columns === 2 ? 'grid-cols-1 md:grid-cols-2' :
          config?.columns === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
          config?.columns === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4' :
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
        }`;
      case 'carousel':
        return 'flex overflow-x-auto space-x-6 pb-4';
      case 'masonry':
        return 'columns-1 md:columns-2 lg:columns-3 gap-6';
      case 'list':
        return 'space-y-6';
      default:
        return 'grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        );
      case 'facebook':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        );
      case 'twitter':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
          </svg>
        );
      case 'youtube':
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'instagram':
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'facebook':
        return 'bg-blue-600';
      case 'twitter':
        return 'bg-blue-400';
      case 'youtube':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const renderPost = (post: SocialPost) => (
    <div 
      key={post.id}
      className="bg-white rounded-theme shadow-sm border border-gray-100 overflow-hidden transition-theme hover:shadow-md"
      style={{
        backgroundColor: config?.cardBackgroundColor === 'primary' ? 'var(--color-primary)' :
          config?.cardBackgroundColor === 'secondary' ? 'var(--color-secondary)' :
          config?.cardBackgroundColor === 'background' ? 'var(--color-background)' :
          config?.cardBackgroundColor === 'offwhite' ? 'var(--color-offwhite)' :
          'var(--color-offwhite)'
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          {post.authorAvatar && (
            <ImageFallback
              src={post.authorAvatar}
              alt={post.author}
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <p 
              className="font-sans font-semibold text-scale-1 truncate"
              style={{ 
                color: config?.textColor === 'primary' ? 'var(--color-primary)' :
                  config?.textColor === 'secondary' ? 'var(--color-secondary)' :
                  config?.textColor === 'background' ? 'var(--color-background)' :
                  config?.textColor === 'offwhite' ? 'var(--color-offwhite)' :
                  config?.textColor === 'black' ? 'var(--color-black)' :
                  'var(--color-foreground)'
              }}
            >
              {post.author}
            </p>
            <p className="font-sans text-sm text-gray-500">
              {formatDate(post.date)}
            </p>
          </div>
          <div className={`p-2 rounded-full text-white ${getPlatformColor(post.platform)}`}>
            {getPlatformIcon(post.platform)}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p 
          className="font-sans text-scale-1 mb-4 leading-relaxed"
          style={{ 
            color: config?.textColor === 'primary' ? 'var(--color-primary)' :
              config?.textColor === 'secondary' ? 'var(--color-secondary)' :
              config?.textColor === 'background' ? 'var(--color-background)' :
              config?.textColor === 'offwhite' ? 'var(--color-offwhite)' :
              config?.textColor === 'black' ? 'var(--color-black)' :
              'var(--color-foreground)'
          }}
        >
          {post.content}
        </p>

        {/* Media */}
        {(post.image || post.video) && (
          <div className="mb-4">
            <ImageFallback
              src={post.image || post.video || ''}
              alt="Social media post"
              width={400}
              height={300}
              className="w-full h-48 object-cover rounded-theme"
            />
          </div>
        )}

        {/* Engagement */}
        {(config?.showLikes || config?.showComments || config?.showShares) && (
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            {config?.showLikes && post.likes && (
              <span className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
                <span>{formatNumber(post.likes)}</span>
              </span>
            )}
            {config?.showComments && post.comments && (
              <span className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                </svg>
                <span>{formatNumber(post.comments)}</span>
              </span>
            )}
            {config?.showShares && post.shares && (
              <span className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                </svg>
                <span>{formatNumber(post.shares)}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      {config?.showViewButton && (
        <div className="px-4 py-3 border-t border-gray-100">
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center font-sans text-scale-1 font-medium hover:underline transition-theme"
            style={{
              color: 'var(--color-primary)'
            }}
          >
            View on {post.platform.charAt(0).toUpperCase() + post.platform.slice(1)}
            <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </a>
        </div>
      )}
    </div>
  );

  useEffect(() => {
    // Simulate loading social media data
    const loadPosts = async () => {
      setLoading(true);
      // In a real implementation, you would fetch from social media APIs here
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPosts(defaultPosts);
      setLoading(false);
    };

    loadPosts();
  }, []);

  // Filter posts by platform if specified
  const filteredPosts = config?.feedType && config.feedType !== 'all'
    ? posts.filter(post => post.platform === config.feedType)
    : posts;

  // Limit posts if specified
  const displayPosts = config?.postCount 
    ? filteredPosts.slice(0, config.postCount)
    : filteredPosts;

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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
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
            {config?.title || section.content || 'Follow Us'}
          </h2>
          
          {config?.description && (
            <p 
              className="font-sans text-scale-2 text-gray-600 max-w-2xl mx-auto"
              style={{ 
                color: config?.textColor === 'primary' ? 'var(--color-primary)' :
                  config?.textColor === 'secondary' ? 'var(--color-secondary)' :
                  config?.textColor === 'background' ? 'var(--color-background)' :
                  config?.textColor === 'offwhite' ? 'var(--color-offwhite)' :
                  config?.textColor === 'black' ? 'var(--color-black)' :
                  'var(--color-foreground)'
              }}
            >
              {config.description}
            </p>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 font-sans text-gray-600">Loading social feed...</p>
          </div>
        )}

        {/* Social Feed */}
        {!loading && (
          <>
            <div className={getLayoutClass()}>
              {displayPosts.map(renderPost)}
            </div>

            {/* Follow Button */}
            {config?.showFollowButton && (
              <div className="text-center mt-12">
                <a
                  href={config.followLink || '/social'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-8 py-4 bg-primary text-black font-mono font-semibold rounded-theme hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-theme"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: 'var(--color-black)'
                  }}
                >
                  {config.followButtonText || 'Follow Us'}
                  <svg className="w-5 h-5 ml-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

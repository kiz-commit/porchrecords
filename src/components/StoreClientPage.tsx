"use client";

import { useState, useEffect } from 'react';
import { type StoreProduct } from '@/lib/types';
import { useMood } from '@/contexts/MoodContext';
import Navigation from './Navigation';
import StoreClient from './StoreClient';
import { useAnalytics } from '@/hooks/useAnalytics';

interface StoreClientPageProps {
  initialProducts: StoreProduct[];
  allGenres: string[];
  allMerchCategories: string[];
  allMoods: string[];
  allProductTypes: string[];
}

export default function StoreClientPage({
  initialProducts,
  allGenres = [],
  allMerchCategories = [],
  allMoods = [],
  allProductTypes = []
}: StoreClientPageProps) {
  const [products, setProducts] = useState<StoreProduct[]>(initialProducts || []);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const { getMoodEmoji } = useMood();
  const { trackPageView, trackSearch } = useAnalytics();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductType, setSelectedProductType] = useState('All');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedMerchCategory, setSelectedMerchCategory] = useState('All');
  const [selectedMood, setSelectedMood] = useState('All');
  const [showPreOrdersOnly, setShowPreOrdersOnly] = useState(false);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Track page view on mount
  useEffect(() => {
    if (trackPageView) {
      trackPageView('/store', 'Store');
    }
  }, [trackPageView]);

  // Track search events
  useEffect(() => {
    if (searchTerm && trackSearch) {
      const timeoutId = setTimeout(() => {
        // Calculate filtered count in the effect
        const filtered = products.filter(product => {
          const matchesSearch = searchTerm === '' || 
            product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.artist && product.artist.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (product.genre && product.genre.toLowerCase().includes(searchTerm.toLowerCase()));
          return matchesSearch;
        });
        trackSearch(searchTerm, filtered.length);
      }, 500); // Debounce search tracking
      
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, products, trackSearch]);

  // Filter products based on search and filters
  const filteredProducts = products.filter(product => {
    const matchesSearch = searchTerm === '' || 
      product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.artist && product.artist.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.genre && product.genre.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesProductType = selectedProductType === 'All' || 
      product.productType?.toLowerCase() === selectedProductType.toLowerCase() ||
      (selectedProductType === 'Records' && product.productType === 'record') ||
      (selectedProductType === 'Merch' && product.productType === 'merch') ||
      (selectedProductType === 'Accessories' && product.productType === 'accessory');
    const matchesGenre = selectedGenre === 'All' || product.genre === selectedGenre;
    const matchesMerchCategory = selectedMerchCategory === 'All' || product.merchCategory === selectedMerchCategory;
    const matchesMood = selectedMood === 'All' || product.mood === selectedMood;
    const matchesPreOrder = !showPreOrdersOnly || product.isPreorder;

    return matchesSearch && matchesProductType && matchesGenre && matchesMerchCategory && matchesMood && matchesPreOrder;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let aValue: any, bValue: any;

    switch (sortBy) {
      case 'name':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'artist':
        aValue = (a.artist || '').toLowerCase();
        bValue = (b.artist || '').toLowerCase();
        break;
      case 'price':
        aValue = a.price;
        bValue = b.price;
        break;
      case 'date':
        aValue = new Date(a.createdAt || 0);
        bValue = new Date(b.createdAt || 0);
        break;
      default:
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  return (
    <div className="min-h-screen text-black" style={{ backgroundColor: 'var(--color-offwhite)' }}>
      <Navigation />
      {/* Top Filter Bar - sticky, orange, with title */}
      <div
        className="sticky z-40 px-4 sm:px-6 lg:px-8 py-3 shadow-sm"
        style={{ 
          top: 'var(--header-height, 64px)',
          backgroundColor: 'var(--color-clay)'
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-lg font-bold text-black font-mono">
            Porch Records
          </h1>
          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center flex-1 w-full">
          <input
            type="text"
            placeholder="Search records, artists, genres, merch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-48 md:w-64 px-3 py-2 text-sm border bg-white text-black placeholder-gray-500 focus:outline-none focus:border-black font-mono h-9"
            style={{ borderColor: 'var(--color-black)' }}
          />
          <select
            value={selectedProductType}
            onChange={e => setSelectedProductType(e.target.value)}
            className="bg-white text-black border px-3 py-2 font-medium text-xs font-mono appearance-none relative h-9"
            style={{
              borderColor: 'var(--color-black)',
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.5rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em',
              paddingRight: '2.5rem'
            }}
          >
            <option value="All">All Items</option>
            {allProductTypes.map(productType => (
              <option key={productType} value={productType.toLowerCase()}>{productType}</option>
            ))}
          </select>
          <select
            value={selectedGenre}
            onChange={e => setSelectedGenre(e.target.value)}
            className="bg-white text-black border px-3 py-2 font-medium text-xs font-mono appearance-none relative h-9"
            style={{
              borderColor: 'var(--color-black)',
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.5rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em',
              paddingRight: '2.5rem'
            }}
          >
            <option value="All">All Genres</option>
            {allGenres.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
          <select
            value={selectedMood}
            onChange={e => setSelectedMood(e.target.value)}
            className="bg-white text-black border px-3 py-2 font-medium text-xs font-mono appearance-none relative h-9"
            style={{
              borderColor: 'var(--color-black)',
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.5rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em',
              paddingRight: '2.5rem'
            }}
          >
            <option value="All">All Moods</option>
            {allMoods.map(mood => (
              <option key={mood} value={mood}>
                {getMoodEmoji(mood) ? `${getMoodEmoji(mood)} ${mood}` : mood}
              </option>
            ))}
          </select>
          {selectedProductType === 'merch' && (
            <select
              value={selectedMerchCategory}
              onChange={e => setSelectedMerchCategory(e.target.value)}
              className="bg-white text-black border px-3 py-2 font-medium text-xs font-mono appearance-none relative h-9"
              style={{
                borderColor: 'var(--color-black)',
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em',
                paddingRight: '2.5rem'
              }}
            >
              <option value="All">All Categories</option>
              {allMerchCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          )}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={e => {
              const [newSortBy, newSortOrder] = e.target.value.split('-');
              setSortBy(newSortBy);
              setSortOrder(newSortOrder as 'asc' | 'desc');
            }}
            className="bg-white text-black border px-3 py-2 font-medium text-xs font-mono appearance-none relative h-9"
            style={{
              borderColor: 'var(--color-black)',
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.5rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em',
              paddingRight: '2.5rem'
            }}
          >
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="artist-asc">Artist A-Z</option>
            <option value="artist-desc">Artist Z-A</option>
            <option value="price-asc">Price Low-High</option>
            <option value="price-desc">Price High-Low</option>
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
          </select>
          
          {/* Pre-order Checkbox Filter */}
          <label className="flex items-center gap-2 bg-white text-black border px-3 py-2 font-medium text-xs font-mono h-9 cursor-pointer hover:bg-gray-50 transition-colors"
                 style={{ borderColor: 'var(--color-black)' }}>
            <input
              type="checkbox"
              checked={showPreOrdersOnly}
              onChange={e => setShowPreOrdersOnly(e.target.checked)}
              className="w-3 h-3 text-black border-gray-400 rounded focus:ring-2 focus:ring-black accent-black"
            />
            <span className="select-none">Pre-orders</span>
          </label>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <StoreClient initialProducts={sortedProducts} />

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center py-8">
          <button
            onClick={async () => {
              try {
                setIsLoadingMore(true);
                const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
                const nextOffset = page * 24;
                const res = await fetch(`${baseUrl}/api/store/products?limit=24&offset=${nextOffset}`, {
                  method: 'GET',
                  cache: 'no-store'
                });
                if (res.ok) {
                  const data = await res.json();
                  const newProducts: StoreProduct[] = data.products || [];
                  setProducts(prev => [...prev, ...newProducts]);
                  setHasMore(Boolean(data.hasMore));
                  setPage(prev => prev + 1);
                }
              } finally {
                setIsLoadingMore(false);
              }
            }}
            className="px-6 py-3 bg-white text-black border font-mono text-sm"
            style={{ borderColor: 'var(--color-black)' }}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </div>
  );
} 
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { SearchResult, highlightSearchTerms } from '@/lib/search-utils';

interface SearchFilters {
  productType: 'all' | 'record' | 'merch' | 'accessory';
  genre: string;
  merchCategory: string;
  priceRange: 'all' | 'under-25' | '25-50' | 'over-50';
  inStock: boolean;
  isPreorder: boolean;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  hasMore: boolean;
  suggestions: string[];
}

export default function GlobalSearch({ isOpen, onClose, className = '' }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [hasSearched, setHasSearched] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    productType: 'all',
    genre: '',
    merchCategory: '',
    priceRange: 'all',
    inStock: true,
    isPreorder: false
  });
  const [genres, setGenres] = useState<string[]>([]);
  const [merchCategories, setMerchCategories] = useState<string[]>([]);
  
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleResultClick = useCallback((result: SearchResult) => {
    router.push(result.url);
    onClose();
    setQuery('');
    setResults([]);
    setSuggestions([]);
  }, [router, onClose]);

  // Close search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Focus input when search opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex(prev => 
            prev < (showSuggestions ? suggestions.length - 1 : results.length - 1) 
              ? prev + 1 
              : prev
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          event.preventDefault();
          if (selectedIndex >= 0) {
            if (showSuggestions && suggestions[selectedIndex]) {
              setQuery(suggestions[selectedIndex]);
              performSearch(suggestions[selectedIndex]);
            } else if (results[selectedIndex]) {
              handleResultClick(results[selectedIndex]);
            }
          } else if (query.trim()) {
            performSearch(query);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, query, results, suggestions, showSuggestions, selectedIndex, onClose, handleResultClick]);

  // Load filter data
  useEffect(() => {
    const loadFilterData = async () => {
      try {
        const response = await fetch('/api/search/filters');
        if (response.ok) {
          const data = await response.json();
          setGenres(data.genres || []);
          setMerchCategories(data.categories || []);
        }
      } catch (error) {
        console.error('Error loading filter data:', error);
      }
    };

    if (isOpen) {
      loadFilterData();
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSuggestions([]);
      setHasSearched(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        getSuggestions(query);
        if (query.length >= 2) {
          performSearch(query);
        }
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const getSuggestions = async (searchQuery: string) => {
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&suggestions=true`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setShowSuggestions(false);
    setHasSearched(true);

    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&limit=10`);
      if (response.ok) {
        const data: SearchResponse = await response.json();
        setResults(data.results || []);
      }
    } catch (error) {
      console.error('Error performing search:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    performSearch(suggestion);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleFilterSearch = () => {
    // Navigate to store with filters applied
    const params = new URLSearchParams();
    
    if (filters.productType !== 'all') params.append('type', filters.productType);
    if (filters.genre) params.append('genre', filters.genre);
    if (filters.merchCategory) params.append('merchCategory', filters.merchCategory);
    if (filters.priceRange !== 'all') params.append('priceRange', filters.priceRange);
    if (!filters.inStock) params.append('inStock', 'false');
    if (filters.isPreorder) params.append('preorder', 'true');
    
    const queryString = params.toString();
    router.push(`/store${queryString ? `?${queryString}` : ''}`);
    onClose();
  };

  const handleClearFilters = () => {
    setFilters({
      productType: 'all',
      genre: '',
      merchCategory: '',
      priceRange: 'all',
      inStock: true,
      isPreorder: false
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'product':
        return '📦';
      case 'show':
        return '🎵';
      case 'page':
        return '📄';
      default:
        return '🔍';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'product':
        return 'Product';
      case 'show':
        return 'Show';
      case 'page':
        return 'Page';
      default:
        return 'Result';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/10 backdrop-blur-sm z-[9999] flex items-start justify-center pt-16">
      <div 
        ref={searchRef}
        className={`bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 border border-gray-200 ${className}`}
      >
        {/* Search Header */}
        <div className="p-6 border-b border-gray-200" style={{ background: 'linear-gradient(to right, var(--color-mustard), var(--color-clay))' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-black font-mono">Search Porch Records</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-black hover:bg-opacity-10 rounded-full transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 text-sm font-mono font-medium rounded-lg transition-colors border-2 ${
                showFilters 
                  ? 'bg-black text-white border-black' 
                  : 'bg-white text-black border-black hover:bg-black hover:text-white'
              }`}
            >
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
              </svg>
              Filters
            </button>
            {Object.values(filters).some(v => v !== 'all' && v !== '' && v !== true && v !== false) && (
              <button
                onClick={handleClearFilters}
                className="px-3 py-2 text-sm font-mono text-black hover:bg-black hover:bg-opacity-10 rounded-lg transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mb-4 p-4 bg-white border border-gray-200 rounded-lg">
              <h3 className="text-lg font-mono font-bold text-black mb-4">Refine Your Search</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Product Type */}
                <div>
                  <label className="block text-sm font-mono font-medium text-black mb-2">Product Type</label>
                  <select
                    value={filters.productType}
                    onChange={(e) => handleFilterChange('productType', e.target.value)}
                    className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none font-mono"
                    style={{ '--tw-ring-color': 'var(--color-clay)' } as React.CSSProperties}
                  >
                    <option value="all">All Products</option>
                    <option value="record">Records</option>
                    <option value="merch">Merchandise</option>
                    <option value="accessory">Accessories</option>
                  </select>
                </div>

                {/* Genre */}
                <div>
                  <label className="block text-sm font-mono font-medium text-black mb-2">Genre</label>
                  <select
                    value={filters.genre}
                    onChange={(e) => handleFilterChange('genre', e.target.value)}
                    className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none font-mono"
                    style={{ '--tw-ring-color': 'var(--color-clay)' } as React.CSSProperties}
                  >
                    <option value="">All Genres</option>
                    {genres.map(genre => (
                      <option key={genre} value={genre}>{genre}</option>
                    ))}
                  </select>
                </div>

                {/* Merch Category */}
                <div>
                  <label className="block text-sm font-mono font-medium text-black mb-2">Category</label>
                  <select
                    value={filters.merchCategory}
                    onChange={(e) => handleFilterChange('merchCategory', e.target.value)}
                    className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none font-mono"
                    style={{ '--tw-ring-color': 'var(--color-clay)' } as React.CSSProperties}
                  >
                    <option value="">All Categories</option>
                    {merchCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-mono font-medium text-black mb-2">Price Range</label>
                  <select
                    value={filters.priceRange}
                    onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                    className="w-full px-3 py-2 border-2 border-black rounded-lg focus:outline-none font-mono"
                    style={{ '--tw-ring-color': 'var(--color-clay)' } as React.CSSProperties}
                  >
                    <option value="all">All Prices</option>
                    <option value="under-25">Under $25</option>
                    <option value="25-50">$25 - $50</option>
                    <option value="over-50">Over $50</option>
                  </select>
                </div>

                {/* Stock & Preorder */}
                <div className="md:col-span-2">
                  <div className="flex items-center gap-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.inStock}
                        onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                        className="mr-2 w-4 h-4 border-2 border-black rounded"
                        style={{ '--tw-ring-color': 'var(--color-clay)' } as React.CSSProperties}
                      />
                      <span className="text-sm font-mono text-black">In Stock Only</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.isPreorder}
                        onChange={(e) => handleFilterChange('isPreorder', e.target.checked)}
                        className="mr-2 w-4 h-4 border-2 border-black rounded"
                        style={{ '--tw-ring-color': 'var(--color-clay)' } as React.CSSProperties}
                      />
                      <span className="text-sm font-mono text-black">Preorders</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleFilterSearch}
                  className="px-6 py-3 bg-black text-white font-mono font-bold rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Browse with Filters
                </button>
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-3 bg-white text-black font-mono font-bold border-2 border-black rounded-lg hover:bg-black hover:text-white transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-6 w-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, shows, pages..."
              className="w-full pl-12 pr-4 py-4 border-2 border-black rounded-lg focus:outline-none text-lg font-mono bg-white"
              style={{ '--tw-ring-color': 'var(--color-clay)' } as React.CSSProperties}
            />
            {isLoading && (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
              </div>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto bg-white">
          {showSuggestions && suggestions.length > 0 && (
            <div className="p-4 border-b border-gray-100">
              <div className="text-sm font-mono font-medium text-black px-3 py-2">Suggestions</div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`w-full text-left px-3 py-3 hover:bg-yellow-100 rounded-lg flex items-center transition-colors ${
                    selectedIndex === index ? 'bg-yellow-100' : ''
                  }`}
                >
                  <span className="text-orange-500 mr-3 text-lg">💡</span>
                  <span className="font-mono" dangerouslySetInnerHTML={{ 
                    __html: highlightSearchTerms(suggestion, query) 
                  }} />
                </button>
              ))}
            </div>
          )}

          {hasSearched && !isLoading && results.length === 0 && (
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <p className="font-mono text-lg text-black mb-2">No results found for &quot;{query}&quot;</p>
              <p className="text-gray-600">Try different keywords or check your spelling</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="p-4">
              <div className="text-sm font-mono font-medium text-black px-3 py-2 mb-2">
                {results.length} result{results.length !== 1 ? 's' : ''}
              </div>
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className={`w-full text-left p-4 hover:bg-yellow-100 rounded-lg flex items-start space-x-4 transition-colors border border-transparent hover:border-orange-200 ${
                    selectedIndex === index ? 'bg-yellow-100 border-orange-200' : ''
                  }`}
                >
                  <div className="flex-shrink-0">
                    {result.image ? (
                      <Image
                        src={result.image}
                        alt={result.title}
                        width={56}
                        height={56}
                        className="rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 bg-gray-200 rounded-lg flex items-center justify-center text-xl">
                        {getTypeIcon(result.type)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xs bg-black text-white px-2 py-1 rounded font-mono">
                        {getTypeLabel(result.type)}
                      </span>
                      {result.artist && (
                        <span className="text-xs text-gray-600 font-mono">by {result.artist}</span>
                      )}
                    </div>
                    <h3 
                      className="font-mono font-bold text-black mb-2"
                      dangerouslySetInnerHTML={{ 
                        __html: highlightSearchTerms(result.title, query) 
                      }}
                    />
                    {result.description && (
                      <p 
                        className="text-sm text-gray-600 line-clamp-2 font-mono"
                        dangerouslySetInnerHTML={{ 
                          __html: highlightSearchTerms(result.description, query) 
                        }}
                      />
                    )}
                    {result.date && (
                      <p className="text-xs text-gray-500 mt-2 font-mono">
                        {new Date(result.date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-yellow-50 rounded-b-xl">
          <div className="text-xs font-mono text-black text-center">
            Press <kbd className="px-2 py-1 bg-black text-white rounded text-xs font-mono">Enter</kbd> to search,{' '}
            <kbd className="px-2 py-1 bg-black text-white rounded text-xs font-mono">↑↓</kbd> to navigate,{' '}
            <kbd className="px-2 py-1 bg-black text-white rounded text-xs font-mono">Esc</kbd> to close
          </div>
        </div>
      </div>
    </div>
  );
} 
"use client";

import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Navigation from '@/components/Navigation';
import CustomCursor from '@/components/CustomCursor';
import { SearchResult, highlightSearchTerms } from '@/lib/search-utils';

interface SearchResponse {
  results: SearchResult[];
  total: number;
  query: string;
  hasMore: boolean;
  suggestions: string[];
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<('product' | 'show' | 'page')[]>(['product', 'show', 'page']);
  const [sortBy, setSortBy] = useState<'relevance' | 'title' | 'date'>('relevance');
  const [currentPage, setCurrentPage] = useState(1);
  const [searchInput, setSearchInput] = useState(query);

  const itemsPerPage = 20;

  const performSearch = useCallback(async (searchQuery: string, page: number = 1) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    const offset = (page - 1) * itemsPerPage;

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        limit: itemsPerPage.toString(),
        offset: offset.toString(),
        types: selectedTypes.join(',')
      });

      const response = await fetch(`/api/search?${params}`);
      if (response.ok) {
        const data: SearchResponse = await response.json();
        
        if (page === 1) {
          setResults(data.results);
        } else {
          setResults(prev => [...prev, ...data.results]);
        }
        
        setTotal(data.total);
        setHasMore(data.hasMore);
        setCurrentPage(page);
      }
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTypes]);

  useEffect(() => {
    if (query) {
      setSearchInput(query);
      performSearch(query, 1);
    }
  }, [query, performSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  const handleTypeFilter = (type: 'product' | 'show' | 'page') => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter(t => t !== type)
      : [...selectedTypes, type];
    
    setSelectedTypes(newTypes);
    if (searchInput.trim()) {
      performSearch(searchInput, 1);
    }
  };

  const handleSort = (sort: 'relevance' | 'title' | 'date') => {
    setSortBy(sort);
    let sortedResults = [...results];
    
    switch (sort) {
      case 'title':
        sortedResults.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'date':
        sortedResults.sort((a, b) => {
          const dateA = a.date ? new Date(a.date).getTime() : 0;
          const dateB = b.date ? new Date(b.date).getTime() : 0;
          return dateB - dateA;
        });
        break;
      default:
        sortedResults.sort((a, b) => b.relevance - a.relevance);
    }
    
    setResults(sortedResults);
  };

  const loadMore = () => {
    if (hasMore && !isLoading) {
      performSearch(searchInput, currentPage + 1);
    }
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

  const filteredResults = results.filter(result => selectedTypes.includes(result.type));

  return (
    <div className="flex flex-col min-h-screen overflow-hidden">
      <CustomCursor />
      <Navigation />
      
      <main className="flex-grow" style={{ backgroundColor: 'var(--color-offwhite)' }}>
        {/* Search Header */}
        <div className="py-6" style={{ backgroundColor: 'var(--color-clay)' }}>
          <div className="max-w-7xl mx-auto px-4">
            <h1 className="text-2xl font-bold text-black font-mono mb-4">Search Results</h1>
            
            {/* Search Form */}
            <form onSubmit={handleSearch} className="max-w-2xl">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search products, shows, pages..."
                  className="w-full pl-10 pr-4 py-3 border bg-white text-black placeholder-gray-500 focus:outline-none font-mono"
                  style={{ borderColor: 'var(--color-black)' }}
                />
                <button
                  type="submit"
                  className="absolute inset-y-0 right-0 px-4 text-white font-mono transition-colors"
                  style={{ backgroundColor: 'var(--color-black)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgb(55, 65, 81)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-black)';
                  }}
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Filters and Results */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            {/* Type Filters */}
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm font-medium">Filter by:</span>
              {(['product', 'show', 'page'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => handleTypeFilter(type)}
                  className={`px-3 py-1 text-xs font-mono border transition-colors ${
                    selectedTypes.includes(type)
                      ? 'text-white'
                      : 'text-black'
                  }`}
                  style={{
                    backgroundColor: selectedTypes.includes(type)
                      ? 'var(--color-black)'
                      : 'white',
                    borderColor: 'var(--color-black)'
                  }}
                  onMouseEnter={(e) => {
                    if (!selectedTypes.includes(type)) {
                      e.currentTarget.style.backgroundColor = 'rgb(243, 244, 246)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selectedTypes.includes(type)) {
                      e.currentTarget.style.backgroundColor = 'white';
                    }
                  }}
                >
                  {getTypeLabel(type)}s
                </button>
              ))}
            </div>

            {/* Sort Options */}
            <div className="flex items-center space-x-2">
              <span className="font-mono text-sm font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => handleSort(e.target.value as 'relevance' | 'title' | 'date')}
                className="px-3 py-1 text-xs font-mono border bg-white text-black focus:outline-none"
                style={{ borderColor: 'var(--color-black)' }}
              >
                <option value="relevance">Relevance</option>
                <option value="title">Title A-Z</option>
                <option value="date">Date</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          {query && (
            <div className="mb-4">
              <p className="font-mono text-sm text-gray-600">
                {total} result{total !== 1 ? 's' : ''} for &quot;{query}&quot;
              </p>
            </div>
          )}

          {/* Results */}
          {isLoading && currentPage === 1 ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--color-black)' }}></div>
            </div>
          ) : filteredResults.length === 0 && query ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🔍</div>
              <p className="font-mono text-lg mb-2">No results found for &quot;{query}&quot;</p>
              <p className="text-gray-600">Try different keywords or check your spelling</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredResults.map((result) => (
                <div
                  key={result.id}
                  onClick={() => router.push(result.url)}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {result.image ? (
                        <Image
                          src={result.image}
                          alt={result.title}
                          width={80}
                          height={80}
                          className="rounded object-cover"
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center text-2xl">
                          {getTypeIcon(result.type)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded font-mono">
                          {getTypeLabel(result.type)}
                        </span>
                        {result.artist && (
                          <span className="text-xs text-gray-500">by {result.artist}</span>
                        )}
                        {result.relevance && (
                          <span className="text-xs text-gray-500">
                            Relevance: {result.relevance}%
                          </span>
                        )}
                      </div>
                      <h3 
                        className="font-mono font-medium text-lg mb-2"
                        dangerouslySetInnerHTML={{ 
                          __html: highlightSearchTerms(result.title, query) 
                        }}
                      />
                      {result.description && (
                        <p 
                          className="text-gray-600 mb-2 line-clamp-2"
                          dangerouslySetInnerHTML={{ 
                            __html: highlightSearchTerms(result.description, query) 
                          }}
                        />
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        {result.date && (
                          <span>{new Date(result.date).toLocaleDateString()}</span>
                        )}
                        {result.genre && (
                          <span>Genre: {result.genre}</span>
                        )}
                        <span className="text-blue-600 hover:underline">
                          View Details →
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center mt-8">
              <button
                onClick={loadMore}
                disabled={isLoading}
                className="px-6 py-3 text-white font-mono transition-colors disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-black)' }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = 'rgb(55, 65, 81)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.backgroundColor = 'var(--color-black)';
                  }
                }}
              >
                {isLoading ? 'Loading...' : 'Load More Results'}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-mustard)' }}>
        <Navigation />
        <CustomCursor />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto" style={{ borderColor: 'var(--color-black)' }}></div>
            <p className="mt-4 font-mono">Loading search...</p>
          </div>
        </main>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
} 
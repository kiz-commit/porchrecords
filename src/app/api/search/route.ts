import { NextRequest, NextResponse } from 'next/server';
import { performSearch, getSearchSuggestions, SearchOptions } from '@/lib/search-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const types = searchParams.get('types')?.split(',') as ('product' | 'show' | 'page')[] || ['product', 'show', 'page'];
    const suggestions = searchParams.get('suggestions') === 'true';

    if (!query.trim()) {
      return NextResponse.json({ 
        results: [], 
        total: 0, 
        query: '',
        suggestions: [] 
      });
    }

    if (suggestions) {
      // Return search suggestions for autocomplete
      const searchSuggestions = getSearchSuggestions(query, 5);
      return NextResponse.json({
        suggestions: searchSuggestions,
        query
      });
    }

    // Perform the search
    const searchOptions: SearchOptions = {
      query,
      limit,
      offset,
      types
    };

    const results = performSearch(searchOptions);
    
    // Get total count for pagination
    const totalResults = performSearch({ ...searchOptions, limit: 1000, offset: 0 });
    
    return NextResponse.json({
      results,
      total: totalResults.length,
      query,
      hasMore: offset + limit < totalResults.length,
      suggestions: []
    });

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { 
        error: 'Search failed', 
        message: 'An error occurred while performing the search' 
      },
      { status: 500 }
    );
  }
}

// Handle POST requests for more complex search queries
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, limit = 20, offset = 0, types = ['product', 'show', 'page'] } = body;

    if (!query || !query.trim()) {
      return NextResponse.json({ 
        results: [], 
        total: 0, 
        query: '',
        suggestions: [] 
      });
    }

    const searchOptions: SearchOptions = {
      query: query.trim(),
      limit,
      offset,
      types
    };

    const results = performSearch(searchOptions);
    const totalResults = performSearch({ ...searchOptions, limit: 1000, offset: 0 });

    return NextResponse.json({
      results,
      total: totalResults.length,
      query: query.trim(),
      hasMore: offset + limit < totalResults.length,
      suggestions: []
    });

  } catch (error) {
    console.error('Search API POST error:', error);
    return NextResponse.json(
      { 
        error: 'Search failed', 
        message: 'An error occurred while performing the search' 
      },
      { status: 500 }
    );
  }
} 
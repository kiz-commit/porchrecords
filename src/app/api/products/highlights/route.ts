import { NextRequest, NextResponse } from 'next/server';
import { getTopViewedProducts, getViewedNotPurchasedProducts } from '@/lib/analytics-db';

// GET - Retrieve products with analytics data for homepage sections
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'selling-fast';
    const limit = parseInt(searchParams.get('limit') || '4');

    // Get products from cache API
    const productsResponse = await fetch(`${request.nextUrl.origin}/api/products/cache`);
    if (!productsResponse.ok) {
      throw new Error('Failed to fetch products');
    }
    
    const productsData = await productsResponse.json();
    const products: any[] = productsData.products || [];

    if (products.length === 0) {
      return NextResponse.json({
        success: true,
        products: [],
        type,
        message: 'No products available'
      });
    }

    let highlightedProducts = [];

    if (type === 'selling-fast') {
      // Get products with low stock that are being viewed frequently
      const topViewed = await getTopViewedProducts('weekly', 20);
      
      // Filter products that are low stock or out of stock
      const lowStockProducts = products.filter(p => 
        p.stockStatus === 'low_stock' || p.stockStatus === 'out_of_stock'
      );

      // Combine with analytics data
      highlightedProducts = lowStockProducts.map(product => {
        const analytics = topViewed.find(a => a.product_id === product.id);
        return {
          ...product,
          viewCount: analytics?.view_count || 0,
          returnRate: analytics?.return_rate || 0
        };
      }).sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));

    } else if (type === 'returning-users') {
      // Get products that are viewed but not purchased (customer favorites)
      const viewedNotPurchased = await getViewedNotPurchasedProducts(20);
      
      highlightedProducts = products.map(product => {
        const analytics = viewedNotPurchased.find(a => a.product_id === product.id);
        return {
          ...product,
          viewCount: analytics?.view_count || 0,
          returnRate: analytics?.return_rate || 0
        };
      }).sort((a, b) => (b.returnRate || 0) - (a.returnRate || 0));

    } else if (type === 'latest-releases') {
      // Get products sorted by creation date (newest first)
      // For now, we'll use the cached timestamp as a proxy for creation date
      highlightedProducts = products
        .filter(p => p.productType === 'record') // Only show records for latest releases
        .sort((a, b) => (b.cachedAt || 0) - (a.cachedAt || 0))
        .map(product => ({
          ...product,
          viewCount: 0, // Will be populated by analytics if available
          returnRate: 0
        }));
    }

    // Limit the results
    highlightedProducts = highlightedProducts.slice(0, limit);

    return NextResponse.json({
      success: true,
      products: highlightedProducts,
      type,
      count: highlightedProducts.length
    });

  } catch (error) {
    console.error('Error fetching highlighted products:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch highlighted products',
        products: []
      },
      { status: 500 }
    );
  }
} 
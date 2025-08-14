import { NextRequest, NextResponse } from 'next/server';
import { CacheManager } from '@/lib/cache-invalidation';

// POST - Invalidate specific caches
export async function POST(request: NextRequest) {
  try {
    const { type, productId } = await request.json();

    console.log(`🗑️  Cache invalidation requested for: ${type}`);

    switch (type) {
      case 'products':
        await CacheManager.invalidateProducts();
        break;
      case 'inventory':
        await CacheManager.invalidateInventory();
        break;
      case 'product':
        if (!productId) {
          return NextResponse.json({
            success: false,
            error: 'Product ID required for product-specific invalidation'
          }, { status: 400 });
        }
        await CacheManager.invalidateProduct(productId);
        break;
      case 'all':
        await CacheManager.invalidateAll();
        break;
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid cache type. Use: products, inventory, product, or all'
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Cache invalidated for: ${type}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error invalidating cache:', error);
    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}

// GET - Get cache status
export async function GET() {
  try {
    const cacheInfo = CacheManager.getCacheInfo();
    
    return NextResponse.json({
      success: true,
      cacheInfo,
      availableOperations: [
        'products',
        'inventory', 
        'product (requires productId)',
        'all'
      ]
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error getting cache info:', error);
    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}

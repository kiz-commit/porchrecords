import { NextRequest, NextResponse } from 'next/server';
import {
  getAllPreorders,
  createOrUpdatePreorder,
  validatePreorderData,
  getPreorderStats,
  calculateDaysUntilRelease,
} from '@/lib/preorder-utils';
import squareClient from '@/lib/square';

// GET - Load preorder assignments with enhanced data
export async function GET() {
  try {
    const preorders = await getAllPreorders();

    // Enhance preorder data with product information from Square
    const enhancedPreorders = await Promise.all(
      preorders.map(async (preorder) => {
        let productName = 'Unknown Product';
        let title = '';
        let artist = '';
        let price = 0;

        try {
          // Search for the item that contains this variation ID
          const catalogResponse = await squareClient.catalog.searchItems({});
          
          if (catalogResponse && catalogResponse.items) {
            // Find the item that contains our variation
            const item = catalogResponse.items.find(item => 
              item.type === 'ITEM' && 
              (item as any).itemData?.variations?.some((variation: any) => variation.id === preorder.productId)
            );
            
            if (item && (item as any).itemData) {
              title = (item as any).itemData.name || 'Unknown Product';
              productName = title;
              
              // Get price from the specific variation
              const variation = (item as any).itemData.variations?.find((v: any) => v.id === preorder.productId);
              if (variation && variation.itemVariationData && variation.itemVariationData.priceMoney) {
                price = Number(variation.itemVariationData.priceMoney.amount || 0) / 100;
              }

              // Extract artist from description or name
              const description = (item as any).itemData.description || '';
              const artistMatch = description.match(/Artist:\s*([^,\n]+)/i) || 
                                title.match(/^([^-]+)\s*-\s*/);
              if (artistMatch) {
                artist = artistMatch[1].trim();
              }
            }
          }
        } catch (error) {
          console.warn(`Failed to fetch product info for ${preorder.productId}:`, error);
        }

        return {
          ...preorder,
          productName,
          title,
          artist,
          price,
          daysUntilRelease: calculateDaysUntilRelease(preorder.preorderReleaseDate),
        };
      })
    );

    // Get preorder statistics
    const stats = await getPreorderStats();

    return NextResponse.json({ 
      preorders: enhancedPreorders,
      stats,
    });
  } catch (error) {
    console.error('Failed to load preorders:', error);
    return NextResponse.json({ error: 'Failed to load preorders' }, { status: 500 });
  }
}

// POST - Create preorder
export async function POST(request: NextRequest) {
  try {
    const { productId, preorderReleaseDate, preorderMaxQuantity } = await request.json();

    // Validate input data
    const validation = validatePreorderData({
      productId,
      preorderReleaseDate,
      preorderMaxQuantity,
    });

    if (!validation.valid) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.errors 
      }, { status: 400 });
    }

    // Verify product exists in Square
    try {
      const catalogResponse = await squareClient.catalog.object.get({ objectId: productId });
      if (!catalogResponse || !catalogResponse.object) {
        return NextResponse.json({ 
          error: 'Product not found in Square catalog' 
        }, { status: 404 });
      }
    } catch (error) {
      console.error('Failed to verify product in Square:', error);
      return NextResponse.json({ 
        error: 'Failed to verify product in Square catalog' 
      }, { status: 400 });
    }

    // Create or update preorder
    await createOrUpdatePreorder({
      productId,
      isPreorder: true,
      preorderReleaseDate,
      preorderQuantity: 0,
      preorderMaxQuantity,
    });

    console.log(`Created preorder for product ${productId} with release date ${preorderReleaseDate}`);

    // Invalidate products cache to reflect new preorder
    try {
      const cacheRefreshResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/products/cache`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (cacheRefreshResponse.ok) {
        console.log('Products cache refreshed after preorder creation');
      } else {
        console.warn('Failed to refresh products cache:', cacheRefreshResponse.status);
      }
    } catch (cacheError) {
      console.error('Error refreshing products cache:', cacheError);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Preorder created successfully',
    });
  } catch (error) {
    console.error('Failed to create preorder:', error);
    return NextResponse.json({ error: 'Failed to create preorder' }, { status: 500 });
  }
}

// PATCH - Update preorder
export async function PATCH(request: NextRequest) {
  try {
    const { productId, preorderReleaseDate, preorderMaxQuantity, isPreorder } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Validate input data
    const validation = validatePreorderData({
      productId,
      preorderReleaseDate,
      preorderMaxQuantity,
      isPreorder,
    });

    if (!validation.valid) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.errors 
      }, { status: 400 });
    }

    // Update preorder with new data
    await createOrUpdatePreorder({
      productId,
      preorderReleaseDate,
      preorderMaxQuantity,
      isPreorder,
    });

    console.log(`Updated preorder for product ${productId}`);

    // Invalidate products cache to reflect updated preorder
    try {
      const cacheRefreshResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/products/cache`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (cacheRefreshResponse.ok) {
        console.log('Products cache refreshed after preorder update');
      } else {
        console.warn('Failed to refresh products cache:', cacheRefreshResponse.status);
      }
    } catch (cacheError) {
      console.error('Error refreshing products cache:', cacheError);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Preorder updated successfully',
    });
  } catch (error) {
    console.error('Failed to update preorder:', error);
    return NextResponse.json({ error: 'Failed to update preorder' }, { status: 500 });
  }
} 
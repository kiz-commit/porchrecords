import { NextRequest, NextResponse } from 'next/server';
import squareClient from '@/lib/square';
import { Square } from 'square';

// POST - Debug sync to see what data we're getting from Square
export async function POST() {
  try {
    console.log('🔍 Debug: Starting Square API inspection...');
    
    // Use location filtering to only fetch items available at our location
    const locationId = process.env.SQUARE_LOCATION_ID;
    console.log('🔍 Debug: Location ID:', locationId);
    
    const searchRequest = locationId 
      ? { enabledLocationIds: [locationId] }
      : {};
    
    console.log('🔍 Debug: Search request:', JSON.stringify(searchRequest, null, 2));
    
    const catalog = await squareClient.catalog();
    const response = await catalog.searchItems(searchRequest);
    
    console.log('🔍 Debug: Response structure:', {
      hasItems: !!response.items,
      itemCount: response.items?.length || 0,
      errors: response.errors
    });
    
    if (!response.items) {
      return NextResponse.json({
        success: false,
        error: 'No items returned from Square API',
        response: response
      });
    }

    // Inspect first few items in detail
    const debugItems = response.items.slice(0, 3).map((item: any, index: number) => {
      console.log(`🔍 Debug: Item ${index + 1}:`, {
        id: item.id,
        type: item.type,
        name: item.itemData?.name,
        hasVariations: !!item.itemData?.variations?.length,
        variationCount: item.itemData?.variations?.length || 0
      });

      if (item.itemData?.variations?.length > 0) {
        const variation = item.itemData.variations[0];
        console.log(`🔍 Debug: First variation:`, {
          id: variation.id,
          type: variation.type,
          hasPriceMoney: !!variation.itemVariationData?.priceMoney,
          price: variation.itemVariationData?.priceMoney?.amount
        });
      }

      return {
        id: item.id,
        type: item.type,
        name: item.itemData?.name,
        description: item.itemData?.description,
        hasVariations: !!item.itemData?.variations?.length,
        firstVariation: item.itemData?.variations?.[0] ? {
          id: item.itemData.variations[0].id,
          type: item.itemData.variations[0].type,
          hasPriceMoney: !!item.itemData.variations[0].itemVariationData?.priceMoney,
          priceAmount: item.itemData.variations[0].itemVariationData?.priceMoney?.amount
        } : null
      };
    });

    // Convert BigInts to strings for JSON serialization
    const safeRawItem = response.items[0] ? JSON.parse(JSON.stringify(response.items[0], (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )) : null;

    return NextResponse.json({
      success: true,
      totalItems: response.items.length,
      locationId,
      searchRequest,
      debugItems,
      rawFirstItem: safeRawItem
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('🔍 Debug: Error during inspection:', error);
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

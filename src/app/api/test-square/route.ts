import { NextResponse } from 'next/server';
import squareClient from '@/lib/square';

export async function GET() {
  try {
    console.log('🧪 Testing Square API from Next.js route...');
    console.log('Token:', process.env.SQUARE_ACCESS_TOKEN ? 'Set' : 'Not set');
    
    // Use location filtering to only fetch items available at our location
    const locationId = process.env.SQUARE_LOCATION_ID;
    const searchRequest = locationId 
      ? { enabledLocationIds: [locationId] }
      : {};
    
    const response = await squareClient.catalog.searchItems(searchRequest);
    
    if (!response.items) {
      return NextResponse.json({
        success: false,
        error: 'No items returned from Square API',
        items: []
      });
    }
    
    const items = response.items.map(item => {
      if (item.type === 'ITEM') {
        const itemData = item.itemData;
        if (!itemData) return null;
        return {
          id: item.id,
          name: itemData.name,
          imageCount: itemData.imageIds ? itemData.imageIds.length : 0,
          imageIds: itemData.imageIds || []
        };
      }
      return null;
    }).filter(Boolean);
    
    return NextResponse.json({
      success: true,
      totalItems: response.items.length,
      items: items
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Square API error in Next.js route:', error);
    return NextResponse.json({
      success: false,
      error: errorMessage,
      items: []
    });
  }
} 
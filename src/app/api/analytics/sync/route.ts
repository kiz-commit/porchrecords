import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const getAnalyticsDataPath = () => join(process.cwd(), 'src', 'data', 'analytics.json');

const ensureAnalyticsFile = () => {
  const filePath = getAnalyticsDataPath();
  if (!existsSync(filePath)) {
    const defaultData = {
      productViews: [],
      lastUpdated: new Date().toISOString()
    };
    writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productViews, lastUpdated } = body;

    if (!productViews || !Array.isArray(productViews)) {
      return NextResponse.json(
        { error: 'Invalid analytics data format' },
        { status: 400 }
      );
    }

    ensureAnalyticsFile();
    
    const filePath = getAnalyticsDataPath();
    const existingData = JSON.parse(readFileSync(filePath, 'utf-8'));

    // Merge new views with existing data
    const mergedViews = [...existingData.productViews, ...productViews];

    // Remove duplicates based on sessionId and productId
    const uniqueViews = mergedViews.filter((view, index, self) => 
      index === self.findIndex(v => 
        v.sessionId === view.sessionId && v.productId === view.productId
      )
    );

    const updatedData = {
      productViews: uniqueViews,
      lastUpdated: new Date().toISOString()
    };

    writeFileSync(filePath, JSON.stringify(updatedData, null, 2));

    console.log(`Synced ${productViews.length} product views to server`);

    return NextResponse.json({
      success: true,
      syncedViews: productViews.length,
      totalViews: uniqueViews.length,
      message: 'Analytics data synced successfully'
    });
  } catch (error) {
    console.error('Error syncing analytics data:', error);
    return NextResponse.json(
      { error: 'Failed to sync analytics data' },
      { status: 500 }
    );
  }
} 
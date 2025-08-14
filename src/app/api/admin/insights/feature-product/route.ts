import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const getHomeDataPath = () => join(process.cwd(), 'src', 'data', 'home-images.json');

const ensureHomeDataFile = () => {
  const filePath = getHomeDataPath();
  if (!existsSync(filePath)) {
    const defaultData = {
      featuredProducts: [],
      heroImages: [],
      lastUpdated: new Date().toISOString()
    };
    writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'Missing required field: productId' },
        { status: 400 }
      );
    }

    ensureHomeDataFile();
    
    const filePath = getHomeDataPath();
    const homeData = JSON.parse(readFileSync(filePath, 'utf-8'));

    // Check if product is already featured
    const isAlreadyFeatured = homeData.featuredProducts?.some((p: any) => p.id === productId);
    
    if (isAlreadyFeatured) {
      return NextResponse.json({
        success: false,
        message: 'Product is already featured on homepage'
      });
    }

    // Add product to featured list
    const featuredProduct = {
      id: productId,
      featuredAt: new Date().toISOString(),
      position: (homeData.featuredProducts?.length || 0) + 1
    };

    homeData.featuredProducts = homeData.featuredProducts || [];
    homeData.featuredProducts.push(featuredProduct);
    homeData.lastUpdated = new Date().toISOString();

    writeFileSync(filePath, JSON.stringify(homeData, null, 2));

    console.log(`Product ${productId} featured on homepage`);

    return NextResponse.json({
      success: true,
      message: 'Product successfully featured on homepage',
      featuredProduct
    });
  } catch (error) {
    console.error('Error featuring product:', error);
    return NextResponse.json(
      { error: 'Failed to feature product' },
      { status: 500 }
    );
  }
} 
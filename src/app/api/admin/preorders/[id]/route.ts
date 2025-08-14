import { NextRequest, NextResponse } from 'next/server';
import {
  getPreorderByProductId,
  deletePreorder,
  createOrUpdatePreorder,
  validatePreorderData,
} from '@/lib/preorder-utils';

// DELETE - Remove preorder
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = id;

    // Check if preorder exists
    const existingPreorder = await getPreorderByProductId(productId);
    if (!existingPreorder) {
      return NextResponse.json({ error: 'Preorder not found' }, { status: 404 });
    }

    // Delete the preorder
    await deletePreorder(productId);

    console.log(`Deleted preorder for product ${productId}`);

    // Invalidate products cache to reflect deleted preorder
    try {
      const cacheRefreshResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/products/cache`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (cacheRefreshResponse.ok) {
        console.log('Products cache refreshed after preorder deletion');
      } else {
        console.warn('Failed to refresh products cache:', cacheRefreshResponse.status);
      }
    } catch (cacheError) {
      console.error('Error refreshing products cache:', cacheError);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Preorder deleted successfully',
    });
  } catch (error) {
    console.error('Failed to remove preorder:', error);
    return NextResponse.json({ error: 'Failed to remove preorder' }, { status: 500 });
  }
}

// PATCH - Update preorder
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = id;
    const { preorderReleaseDate, preorderMaxQuantity, isPreorder } = await request.json();

    // Check if preorder exists
    const existingPreorder = await getPreorderByProductId(productId);
    if (!existingPreorder) {
      return NextResponse.json({ error: 'Preorder not found' }, { status: 404 });
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

    // Update the preorder
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

// GET - Get specific preorder
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = id;

    const preorder = await getPreorderByProductId(productId);
    if (!preorder) {
      return NextResponse.json({ error: 'Preorder not found' }, { status: 404 });
    }

    return NextResponse.json({ preorder });
  } catch (error) {
    console.error('Failed to get preorder:', error);
    return NextResponse.json({ error: 'Failed to get preorder' }, { status: 500 });
  }
} 
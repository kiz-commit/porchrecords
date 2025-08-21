import { NextRequest, NextResponse } from 'next/server';
import { reorderTaxonomyItems, type TaxonomyItem } from '@/lib/taxonomy-utils';
import { withAdminAuth } from '@/lib/route-protection';

// POST - Reorder taxonomy items within a type
async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.type || !body.orderedIds || !Array.isArray(body.orderedIds)) {
      return NextResponse.json(
        { error: 'Type and orderedIds array are required' }, 
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['genre', 'mood', 'category', 'tag'];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be one of: genre, mood, category, tag' }, 
        { status: 400 }
      );
    }

    reorderTaxonomyItems(body.type as TaxonomyItem['type'], body.orderedIds);

    return NextResponse.json({ 
      success: true, 
      message: 'Items reordered successfully' 
    });

  } catch (error) {
    console.error('Error reordering taxonomy items:', error);
    return NextResponse.json(
      { error: 'Failed to reorder taxonomy items' }, 
      { status: 500 }
    );
  }
}

// Export protected handler
export const POST = withAdminAuth(postHandler);
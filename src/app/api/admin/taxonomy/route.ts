import { NextRequest, NextResponse } from 'next/server';
import { 
  getTaxonomyData, 
  getTaxonomyByType, 
  addTaxonomyItem, 
  type TaxonomyItem 
} from '@/lib/taxonomy-utils';
import { withAdminAuth } from '@/lib/route-protection';

// GET - List all taxonomy items or filter by type
async function getHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as TaxonomyItem['type'] | null;
    const includeInactive = searchParams.get('includeInactive') === 'true';

    if (type) {
      const items = getTaxonomyByType(type);
      return NextResponse.json({ 
        items,
        type,
        count: items.length 
      });
    }

    const data = getTaxonomyData();
    const items = includeInactive 
      ? data.items 
      : data.items.filter(item => item.isActive);

    return NextResponse.json({
      items,
      metadata: {
        lastUpdated: data.lastUpdated,
        version: data.version,
        totalCount: items.length,
        byType: {
          genres: items.filter(item => item.type === 'genre').length,
          moods: items.filter(item => item.type === 'mood').length,
          categories: items.filter(item => item.type === 'category').length,
          tags: items.filter(item => item.type === 'tag').length,
        }
      }
    });
  } catch (error) {
    console.error('Error fetching taxonomy:', error);
    return NextResponse.json(
      { error: 'Failed to fetch taxonomy data' }, 
      { status: 500 }
    );
  }
}

// POST - Add a new taxonomy item
async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.type) {
      return NextResponse.json(
        { error: 'Name and type are required' }, 
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

    const newItem = addTaxonomyItem({
      name: body.name.trim(),
      type: body.type,
      emoji: body.emoji || '',
      color: body.color || '',
      description: body.description || '',
      parentId: body.parentId || undefined,
      order: body.order || 0,
      usageCount: 0,
      isActive: true
    });

    return NextResponse.json({ 
      success: true, 
      item: newItem 
    }, { status: 201 });

  } catch (error) {
    console.error('Error adding taxonomy item:', error);
    const message = error instanceof Error ? error.message : 'Failed to add taxonomy item';
    return NextResponse.json(
      { error: message }, 
      { status: 400 }
    );
  }
}

// PUT handler removed; legacy migration no longer supported

// Export protected handlers
export const GET = withAdminAuth(getHandler);
export const POST = withAdminAuth(postHandler);
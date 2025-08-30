import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllTaxonomyItems, 
  getTaxonomyByType, 
  addTaxonomyItem, 
  getTaxonomyStats,
  type TaxonomyItem 
} from '@/lib/taxonomy-db';
import { withAdminAuth } from '@/lib/route-protection';

// GET - List all taxonomy items or filter by type
async function getHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as TaxonomyItem['type'] | null;
    const includeInactive = searchParams.get('includeInactive') === 'true';

    if (type) {
      const items = await getTaxonomyByType(type);
      return NextResponse.json({ 
        items,
        type,
        count: items.length 
      });
    }

    const items = await getAllTaxonomyItems(includeInactive);
    const stats = await getTaxonomyStats();

    return NextResponse.json({
      items,
      metadata: {
        lastUpdated: new Date().toISOString(),
        version: "2.0.0",
        totalCount: stats.totalCount,
        byType: stats.byType
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
    const validTypes = ['genre', 'mood', 'tag', 'product_type', 'merch_category'];
    if (!validTypes.includes(body.type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be one of: genre, mood, tag, product_type, merch_category' }, 
        { status: 400 }
      );
    }

    const newItem = await addTaxonomyItem({
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
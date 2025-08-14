import { NextRequest, NextResponse } from 'next/server';
import { 
  getTaxonomyById, 
  updateTaxonomyItem, 
  deleteTaxonomyItem 
} from '@/lib/taxonomy-utils';

// GET - Get a specific taxonomy item
export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = getTaxonomyById(id);
    
    if (!item) {
      return NextResponse.json(
        { error: 'Taxonomy item not found' }, 
        { status: 404 }
      );
    }

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Error fetching taxonomy item:', error);
    return NextResponse.json(
      { error: 'Failed to fetch taxonomy item' }, 
      { status: 500 }
    );
  }
}

// PUT - Update a taxonomy item
export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const updatedItem = updateTaxonomyItem(id, {
      name: body.name?.trim(),
      emoji: body.emoji,
      color: body.color,
      description: body.description,
      parentId: body.parentId,
      order: body.order,
      isActive: body.isActive
    });

    return NextResponse.json({ 
      success: true, 
      item: updatedItem 
    });

  } catch (error) {
    console.error('Error updating taxonomy item:', error);
    const message = error instanceof Error ? error.message : 'Failed to update taxonomy item';
    return NextResponse.json(
      { error: message }, 
      { status: 400 }
    );
  }
}

// DELETE - Delete (deactivate) a taxonomy item
export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = deleteTaxonomyItem(id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Taxonomy item not found' }, 
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Taxonomy item deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting taxonomy item:', error);
    return NextResponse.json(
      { error: 'Failed to delete taxonomy item' }, 
      { status: 500 }
    );
  }
}
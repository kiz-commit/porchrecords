import { NextRequest, NextResponse } from 'next/server';
import { 
  getTaxonomyById, 
  updateTaxonomyItem, 
  deleteTaxonomyItem 
} from '@/lib/taxonomy-db';
import { withAdminAuth } from '@/lib/route-protection';

// GET - Get a specific taxonomy item
async function getHandler(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await getTaxonomyById(id);
    
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
async function putHandler(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const updatedItem = await updateTaxonomyItem(id, {
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
async function deleteHandler(
  request: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await deleteTaxonomyItem(id);
    
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

// Export protected handlers
export const GET = withAdminAuth(getHandler);
export const PUT = withAdminAuth(putHandler);
export const DELETE = withAdminAuth(deleteHandler);
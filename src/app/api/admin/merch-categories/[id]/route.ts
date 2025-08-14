import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const merchCategoriesPath = path.join(process.cwd(), 'src', 'data', 'merchCategories.json');

// DELETE - Remove merch category assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const productId = id;

    if (!fs.existsSync(merchCategoriesPath)) {
      return NextResponse.json({ error: 'No merch categories file found' }, { status: 404 });
    }

    const data = fs.readFileSync(merchCategoriesPath, 'utf8');
    const merchCategories: Record<string, any> = JSON.parse(data);

    if (!merchCategories[productId]) {
      return NextResponse.json({ error: 'Merch category assignment not found' }, { status: 404 });
    }

    // Remove the assignment
    delete merchCategories[productId];

    // Save back to file
    fs.writeFileSync(merchCategoriesPath, JSON.stringify(merchCategories, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove merch category assignment:', error);
    return NextResponse.json({ error: 'Failed to remove merch category assignment' }, { status: 500 });
  }
} 
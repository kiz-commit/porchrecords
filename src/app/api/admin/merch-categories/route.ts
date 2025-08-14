import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const merchCategoriesPath = path.join(process.cwd(), 'src', 'data', 'merchCategories.json');

// GET - Load merch category assignments
export async function GET() {
  try {
    if (!fs.existsSync(merchCategoriesPath)) {
      return NextResponse.json({ assignments: [] });
    }

    const data = fs.readFileSync(merchCategoriesPath, 'utf8');
    const merchCategories = JSON.parse(data);

    // Convert to array format for easier management
    const assignments = Object.entries(merchCategories).map(([productId, merchData]) => ({
      productId,
      productName: 'Unknown Product', // Would be fetched from Square
      productType: (merchData as any).productType || 'merch',
      merchCategory: (merchData as any).merchCategory || '',
      size: (merchData as any).size,
      color: (merchData as any).color,
    }));

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('Failed to load merch categories:', error);
    return NextResponse.json({ error: 'Failed to load merch categories' }, { status: 500 });
  }
}

// POST - Assign merch category to product
export async function POST(request: NextRequest) {
  try {
    const { productId, productType, merchCategory, size, color } = await request.json();

    if (!productId || !productType || !merchCategory) {
      return NextResponse.json({ error: 'Product ID, product type, and merch category are required' }, { status: 400 });
    }

    // Load existing data
    let merchCategories: Record<string, any> = {};
    if (fs.existsSync(merchCategoriesPath)) {
      const data = fs.readFileSync(merchCategoriesPath, 'utf8');
      merchCategories = JSON.parse(data);
    }

    // Update assignment
    merchCategories[productId] = {
      productType,
      merchCategory,
      size,
      color,
    };

    // Save back to file
    fs.writeFileSync(merchCategoriesPath, JSON.stringify(merchCategories, null, 2));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to assign merch category:', error);
    return NextResponse.json({ error: 'Failed to assign merch category' }, { status: 500 });
  }
} 
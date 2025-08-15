import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';

// GET - Load merch category assignments from database
export async function GET() {
  const db = new Database('data/porchrecords.db');
  
  try {
    // Get all products with merch category assignments
    const assignments = db.prepare(`
      SELECT 
        id as productId,
        title as productName,
        product_type as productType,
        merch_category as merchCategory,
        size,
        color
      FROM products 
      WHERE merch_category IS NOT NULL AND merch_category != ''
      ORDER BY title ASC
    `).all() as any[];

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('Failed to load merch categories from database:', error);
    return NextResponse.json({ error: 'Failed to load merch categories' }, { status: 500 });
  } finally {
    db.close();
  }
}

// POST - Assign merch category to product in database
export async function POST(request: NextRequest) {
  const db = new Database('data/porchrecords.db');
  
  try {
    const { productId, productType, merchCategory, size, color } = await request.json();

    if (!productId || !productType || !merchCategory) {
      return NextResponse.json({ error: 'Product ID, product type, and merch category are required' }, { status: 400 });
    }

    // Update product in database
    const updateProduct = db.prepare(`
      UPDATE products 
      SET product_type = ?, merch_category = ?, size = ?, color = ?, updated_at = ?
      WHERE id = ?
    `);

    const result = updateProduct.run(
      productType,
      merchCategory,
      size || null,
      color || null,
      new Date().toISOString(),
      productId
    );

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to assign merch category in database:', error);
    return NextResponse.json({ error: 'Failed to assign merch category' }, { status: 500 });
  } finally {
    db.close();
  }
} 
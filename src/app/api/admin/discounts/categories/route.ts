import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';

// GET - Get available categories for discounts
export async function GET(request: NextRequest) {
  const db = new Database('data/porchrecords.db');
  
  try {
    // Get all products from database
    const products = db.prepare(`
      SELECT id, title, product_type, merch_category, genre
      FROM products 
      WHERE is_visible = 1
      ORDER BY title ASC
    `).all() as any[];

    // Get unique merch categories from database
    const merchCategories = db.prepare(`
      SELECT DISTINCT merch_category 
      FROM products 
      WHERE merch_category IS NOT NULL AND merch_category != '' AND is_visible = 1
      ORDER BY merch_category
    `).all() as any[];

    // Get unique genres from database
    const genres = db.prepare(`
      SELECT DISTINCT genre 
      FROM products 
      WHERE genre IS NOT NULL AND genre != '' AND is_visible = 1
      ORDER BY genre
    `).all() as any[];

    // Get unique product types from database
    const productTypes = db.prepare(`
      SELECT DISTINCT product_type 
      FROM products 
      WHERE product_type IS NOT NULL AND product_type != '' AND is_visible = 1
      ORDER BY product_type
    `).all() as any[];

    return NextResponse.json({
      success: true,
      products: products.map(p => ({
        id: p.id,
        title: p.title,
        productType: p.product_type,
        merchCategory: p.merch_category,
        genre: p.genre
      })),
      categories: {
        merchCategories: merchCategories.map(mc => mc.merch_category),
        genres: genres.map(g => g.genre),
        productTypes: productTypes.map(pt => pt.product_type)
      },
      fromDatabase: true
    });

  } catch (error) {
    console.error('Error fetching categories from database:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  } finally {
    db.close();
  }
} 
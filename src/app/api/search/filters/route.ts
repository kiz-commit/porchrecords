import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';

export async function GET() {
  const db = new Database('data/porchrecords.db');
  
  try {
    // Load genres from database
    const genres = db.prepare(`
      SELECT DISTINCT genre 
      FROM products 
      WHERE genre IS NOT NULL AND genre != '' AND is_visible = 1
      ORDER BY genre
    `).all() as any[];
    
    // Load merch categories from database
    const categories = db.prepare(`
      SELECT DISTINCT merch_category 
      FROM products 
      WHERE merch_category IS NOT NULL AND merch_category != '' AND is_visible = 1
      ORDER BY merch_category
    `).all() as any[];
    
    return NextResponse.json({
      genres: genres.map(g => g.genre),
      categories: categories.map(c => c.merch_category),
      fromDatabase: true
    });
  } catch (error) {
    console.error('Error loading filter data from database:', error);
    return NextResponse.json(
      { error: 'Failed to load filter data' },
      { status: 500 }
    );
  } finally {
    db.close();
  }
} 
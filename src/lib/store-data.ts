import Database from 'better-sqlite3';
import { StoreProduct } from '@/lib/types';

export async function getStoreData(): Promise<{
  products: StoreProduct[];
  allGenres: string[];
  allMerchCategories: string[];
  allMoods: string[];
}> {
  let products: StoreProduct[] = [];
  let allGenres: string[] = [];
  let allMerchCategories: string[] = [];
  let allMoods: string[] = [];

  const db = new Database('data/porchrecords.db');
  
  try {
    // Load genres from database
    const genres = db.prepare(`
      SELECT DISTINCT genre 
      FROM products 
      WHERE genre IS NOT NULL AND genre != '' AND is_visible = 1
      ORDER BY genre
    `).all() as any[];
    allGenres = genres.map(g => g.genre);

    // Load moods from database
    const moods = db.prepare(`
      SELECT DISTINCT mood 
      FROM products 
      WHERE mood IS NOT NULL AND mood != '' AND is_visible = 1
      ORDER BY mood
    `).all() as any[];
    allMoods = moods.map(m => m.mood);

    // Load merch categories from database
    const merchCategories = db.prepare(`
      SELECT DISTINCT merch_category 
      FROM products 
      WHERE merch_category IS NOT NULL AND merch_category != '' AND is_visible = 1
      ORDER BY merch_category
    `).all() as any[];
    allMerchCategories = merchCategories.map(mc => mc.merch_category);

  } catch (error) {
    console.error('Error loading store data from database:', error);
    // Fallback to empty arrays
    allGenres = [];
    allMerchCategories = [];
    allMoods = [];
  } finally {
    db.close();
  }

  // For now, return empty products since we're using the cache API
  // This function is kept for backward compatibility
  products = [];
  
  return {
    products,
    allGenres,
    allMerchCategories,
    allMoods
  };
} 
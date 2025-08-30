import StoreClientPage from '@/components/StoreClientPage';
import { getTaxonomyByType } from '@/lib/taxonomy-db';
import { getDatabase } from '@/lib/database';

// Force dynamic rendering to avoid static generation issues with database
export const dynamic = 'force-dynamic';

// DEFAULT EXPORT: SERVER COMPONENT
export default async function Store() {
  // Fetch visible products from the optimized database API (super fast!)
  let products = [];
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/store/products?limit=24&offset=0`, {
      method: 'GET',
      cache: 'no-store'
    });
    if (response.ok) {
      const data = await response.json();
      products = data.products || [];
      console.log(`🚀 Loaded first page (${products.length}) products from database`);
    } else {
      console.warn('Failed to fetch products from database, using empty products list');
    }
  } catch (error) {
    console.error('Error fetching products from database:', error);
    // Fallback to empty products list
  }

  // Load categories, genres, and moods from database using proper database utility
  let allGenres: string[] = [];
  let allMerchCategories: string[] = [];
  let allMoods: string[] = [];
  let allProductTypes: string[] = [];

  try {
    const db = await getDatabase();
    
    // Load all taxonomy data from unified system
    const [taxonomyMoods, taxonomyGenres, taxonomyProductTypes, taxonomyMerchCategories] = await Promise.all([
      getTaxonomyByType('mood'),
      getTaxonomyByType('genre'),
      getTaxonomyByType('product_type'),
      getTaxonomyByType('merch_category')
    ]);

    // Use taxonomy data if available, otherwise fallback to database
    if (taxonomyMoods.length > 0) {
      allMoods = taxonomyMoods.map(mood => mood.name);
    } else {
      // Fallback to database if taxonomy system is empty
      const moods = await db.all(`
        SELECT DISTINCT mood 
        FROM products 
        WHERE mood IS NOT NULL AND mood != '' AND is_visible = 1
        ORDER BY mood
      `) as any[];
      allMoods = moods.map(m => m.mood);
    }

    if (taxonomyGenres.length > 0) {
      allGenres = taxonomyGenres.map(genre => genre.name);
    } else {
      // Fallback to database if taxonomy system is empty
      const genres = await db.all(`
        SELECT DISTINCT genre 
        FROM products 
        WHERE genre IS NOT NULL AND genre != '' AND is_visible = 1
        ORDER BY genre
      `) as any[];
      allGenres = genres.map(g => g.genre);
    }

    if (taxonomyMerchCategories.length > 0) {
      allMerchCategories = taxonomyMerchCategories.map(category => category.name);
    } else {
      // Fallback to database if taxonomy system is empty
      const merchCategories = await db.all(`
        SELECT DISTINCT merch_category 
        FROM products 
        WHERE merch_category IS NOT NULL AND merch_category != '' AND is_visible = 1
        ORDER BY merch_category
      `) as any[];
      allMerchCategories = merchCategories.map(mc => mc.merch_category);
    }

    // Extract product types from taxonomy
    allProductTypes = taxonomyProductTypes.map(pt => pt.name);
  } catch (error) {
    console.error('Error loading categories from database:', error);
    // Fallback to empty arrays
    allGenres = [];
    allMerchCategories = [];
    allMoods = [];
    allProductTypes = [];
  }

  return <StoreClientPage 
    initialProducts={products}
    allGenres={allGenres}
    allMerchCategories={allMerchCategories}
    allMoods={allMoods}
    allProductTypes={allProductTypes}
  />;
} 
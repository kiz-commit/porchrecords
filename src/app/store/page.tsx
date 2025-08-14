import StoreClientPage from '@/components/StoreClientPage';
import fs from 'fs';
import path from 'path';
import { getTaxonomyByType } from '@/lib/taxonomy-utils';

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

  // Load categories, genres, and moods from local files
  let allGenres: string[] = [];
  let allMerchCategories: string[] = [];
  let allMoods: string[] = [];

  try {
    const genresPath = path.join(process.cwd(), 'src', 'data', 'genres.json');
    const genresFile = fs.readFileSync(genresPath, 'utf8');
    allGenres = JSON.parse(genresFile);
  } catch {
    allGenres = [];
  }

  try {
    // Try to load from new taxonomy system first
    const taxonomyMoods = getTaxonomyByType('mood');
    if (taxonomyMoods.length > 0) {
      allMoods = taxonomyMoods.map(mood => mood.name);
    } else {
      // Fallback to legacy moods file
      const moodsPath = path.join(process.cwd(), 'src', 'data', 'moods.json');
      const moodsFile = fs.readFileSync(moodsPath, 'utf8');
      allMoods = JSON.parse(moodsFile);
    }
  } catch {
    allMoods = [];
  }

  try {
    const merchCategoriesPath = path.join(process.cwd(), 'src', 'data', 'merchCategories.json');
    const merchCategoriesFile = fs.readFileSync(merchCategoriesPath, 'utf8');
    const merchCategoriesData = JSON.parse(merchCategoriesFile);
    
    const allMerchCategoriesSet = new Set<string>();
    Object.values(merchCategoriesData).forEach((item: any) => {
      if (item.merchCategory && item.merchCategory.trim() !== '') {
        allMerchCategoriesSet.add(item.merchCategory);
      }
    });
    allMerchCategories = Array.from(allMerchCategoriesSet).sort();
  } catch {
    allMerchCategories = [];
  }

  return <StoreClientPage 
    initialProducts={products}
    allGenres={allGenres}
    allMerchCategories={allMerchCategories}
    allMoods={allMoods}
  />;
} 
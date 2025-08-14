import fs from 'fs';
import path from 'path';
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

  // Load local data for categories, genres, and moods
  try {
    // Load genres from local file
    const genresPath = path.join(process.cwd(), 'src', 'data', 'genres.json');
    const genresFile = fs.readFileSync(genresPath, 'utf8');
    allGenres = JSON.parse(genresFile);
  } catch {
    allGenres = [];
  }

  try {
    // Load moods from local file
    const moodsPath = path.join(process.cwd(), 'src', 'data', 'moods.json');
    const moodsFile = fs.readFileSync(moodsPath, 'utf8');
    allMoods = JSON.parse(moodsFile);
  } catch {
    allMoods = [];
  }

  try {
    // Load merch categories from local file
    const merchCategoriesPath = path.join(process.cwd(), 'src', 'data', 'merchCategories.json');
    const merchCategoriesFile = fs.readFileSync(merchCategoriesPath, 'utf8');
    const merchCategoriesData = JSON.parse(merchCategoriesFile);
    
    // Extract unique merch categories
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
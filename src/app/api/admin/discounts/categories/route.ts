import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const PRODUCTS_FILE = path.join(process.cwd(), 'src', 'data', 'products.json');
const MERCH_CATEGORIES_FILE = path.join(process.cwd(), 'src', 'data', 'merchCategories.json');

// Helper function to read products from file
function readProducts(): any[] {
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      const data = fs.readFileSync(PRODUCTS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading products file:', error);
  }
  return [];
}

// Helper function to read merch categories from file
function readMerchCategories(): any {
  try {
    if (fs.existsSync(MERCH_CATEGORIES_FILE)) {
      const data = fs.readFileSync(MERCH_CATEGORIES_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading merch categories file:', error);
  }
  return {};
}

// GET - Get available categories for discounts
export async function GET(request: NextRequest) {
  try {
    const products = readProducts();
    const merchCategories = readMerchCategories();

    // Extract unique product types from products
    const productTypes = new Set<string>();
    products.forEach(product => {
      if (product.productType) {
        productTypes.add(product.productType);
      }
    });

    // Extract unique product types from merchCategories file as well
    Object.values(merchCategories).forEach((item: any) => {
      if (item.productType && item.productType.trim() !== '') {
        productTypes.add(item.productType);
      }
    });

    // Extract unique merch categories from merchCategories file
    const merchCategorySet = new Set<string>();
    Object.values(merchCategories).forEach((item: any) => {
      if (item.merchCategory && item.merchCategory.trim() !== '') {
        merchCategorySet.add(item.merchCategory);
      }
    });

    // Convert sets to arrays and sort them
    const productTypesArray = Array.from(productTypes).sort();
    const merchCategoriesArray = Array.from(merchCategorySet).sort();

    return NextResponse.json({
      success: true,
      productTypes: productTypesArray,
      merchCategories: merchCategoriesArray
    });
  } catch (error) {
    console.error('Error getting categories:', error);
    return NextResponse.json(
      { error: 'Failed to get categories' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import squareClient from '@/lib/square';
import { Square } from 'square';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import Database from 'better-sqlite3';

// Ensure environment variables are loaded
dotenv.config({ path: '.env.local' });

const CACHE_FILE = path.join(process.cwd(), 'src', 'data', 'products-cache.json');
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CachedProduct {
  id: string;
  title: string;
  price: number;
  description: string;
  image: string;
  images: { id: string; url: string }[];
  imageIds: string[] | null;
  productType: string;
  inStock: boolean;
  isVisible: boolean;
  squareId: string;
  cachedAt: number;
}

// Helper function to check if product has inventory at the configured location
async function hasLocationInventory(variationId: string): Promise<boolean> {
  try {
    const locationId = process.env.SQUARE_LOCATION_ID;
    if (!locationId) {
      console.log('   ⚠️  No SQUARE_LOCATION_ID configured - defaulting to include product');
      return true; // Default to include if no location configured
    }

    // Check if this variation has inventory at the configured location
    const inventory = await squareClient.inventory();
    const inventoryResponse = await inventory.batchGetCounts({
      locationIds: [locationId],
      catalogObjectIds: [variationId],
    });
    
    if (inventoryResponse && inventoryResponse.data && inventoryResponse.data.length > 0) {
      const quantity = Number(inventoryResponse.data[0].quantity) || 0;
      console.log(`   📍 Location inventory check for ${variationId}: ${quantity} units (INCLUDED - will show as sold out if 0)`);
      return true; // Include product if it has an inventory record, regardless of quantity
    }
    
    // If no inventory record found, exclude the product
    console.log(`   📍 No inventory record found for ${variationId} at location ${locationId} - excluding product`);
    return false;
  } catch (error) {
    console.error('❌ Error checking location inventory:', error);
    return false; // Default to exclude on error
  }
}

// Helper function to get or create product in database and check visibility
function getProductVisibility(squareId: string, title: string): boolean {
  const db = new Database('data/porchrecords.db');
  
  try {
    // Check if product exists in database
    const existingProduct = db.prepare('SELECT is_visible FROM products WHERE square_id = ?').get(squareId);
    
    if (existingProduct && typeof existingProduct === 'object' && 'is_visible' in existingProduct) {
      return Boolean(existingProduct.is_visible);
    }
    
    // Product doesn't exist, create it with default visibility (true)
    const insertProduct = db.prepare(`
      INSERT OR IGNORE INTO products (id, title, square_id, is_visible, is_from_square, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const productId = `square_${squareId}`;
    insertProduct.run(productId, title, squareId, 1, 1, new Date().toISOString());
    
    return true; // Default to visible for new products
  } catch (error) {
    console.error('❌ Error checking product visibility:', error);
    return true; // Default to visible on error
  } finally {
    db.close();
  }
}

// GET - Retrieve cached products
export async function GET() {
  try {
    // Check if cache exists and is fresh
    if (fs.existsSync(CACHE_FILE)) {
      const cacheData = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
      const now = Date.now();
      
      if (now - cacheData.cachedAt < CACHE_DURATION) {
        return NextResponse.json({
          success: true,
          products: cacheData.products,
          fromCache: true
        });
      }
    }

    // Cache is stale or doesn't exist, fetch from local database
    console.log('🔄 Fetching fresh data from local database...');
    
    const db = new Database('data/porchrecords.db');
    
    try {
      const products = db.prepare(`
        SELECT * FROM products 
        WHERE is_visible = 1
        ORDER BY title
      `).all();
      
      console.log(`✅ Successfully fetched ${products.length} products from local database`);
      
      // Format products for the API response
      const formattedProducts: CachedProduct[] = await Promise.all(products.map(async (product: any) => {
        // Parse JSON fields
        const imageIds = product.image_ids ? JSON.parse(product.image_ids) : [];
        const images = product.images ? JSON.parse(product.images) : [];
        
        // Get the first image URL if available
        let imageUrl = product.image || '/store.webp';
        
        // If we have image IDs, try to fetch all actual image URLs from Square
        if (imageIds.length > 0) {
          try {
            console.log(`🖼️  Fetching ${imageIds.length} images for ${product.title}`);
            const fetchedImages = [];
            
            for (const imageId of imageIds) {
              const catalog = await squareClient.catalog();
              const imageResponse = await catalog.object.get({ 
                objectId: imageId 
              });
              if (imageResponse.object && imageResponse.object.type === 'IMAGE') {
                const url = (imageResponse.object as any).imageData.url;
                fetchedImages.push({ id: imageId, url });
                console.log(`   ✅ Image ${imageId}: ${url}`);
              }
            }
            
            // Use the first image as the main image
            if (fetchedImages.length > 0) {
              imageUrl = fetchedImages[0].url;
              // Update the images array with all fetched images
              images.length = 0; // Clear existing images
              images.push(...fetchedImages);
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`   ❌ Error fetching images for ${product.title}:`, errorMessage);
          }
        } else if (images.length > 0 && images[0].url) {
          imageUrl = images[0].url;
        }
        
        return {
          id: product.square_id, // Use Square ID for compatibility
          title: product.title,
          price: product.price,
          description: product.description || '',
          image: imageUrl,
          images: images,
          imageIds: imageIds,
          productType: product.product_type || 'record',
          inStock: Boolean(product.in_stock),
          isVisible: Boolean(product.is_visible),
          squareId: product.square_id,
          cachedAt: Date.now()
        };
      }));
      
      // Save to cache
      const cacheData = {
        products: formattedProducts,
        cachedAt: Date.now()
      };
      
      fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2));
      
      return NextResponse.json({
        success: true,
        products: formattedProducts,
        fromCache: false
      });
      
    } finally {
      db.close();
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error fetching products:', error);
    
    return NextResponse.json({
      success: false,
      products: [],
      error: errorMessage
    }, { status: 500 });
  }
}

// POST - Force refresh cache
export async function POST() {
  try {
    // Delete existing cache
    if (fs.existsSync(CACHE_FILE)) {
      fs.unlinkSync(CACHE_FILE);
    }
    
    // Fetch fresh data
    const response = await GET();
    return response;
  } catch (error) {
    console.error('Error refreshing cache:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to refresh cache'
    }, { status: 500 });
  }
} 
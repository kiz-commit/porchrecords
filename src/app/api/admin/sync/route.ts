import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';
import * as fs from 'fs';

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'porchrecords.db');

// Helper function to ensure admin authentication
const isAdminAuthenticated = (request: NextRequest): boolean => {
  const adminCookie = request.cookies.get('admin_session');
  return adminCookie?.value === process.env.ADMIN_SESSION_SECRET;
};

// Helper function to check if user is admin
const checkAdminAuth = (request: NextRequest) => {
  if (!isAdminAuthenticated(request)) {
    throw new Error('Authentication required');
  }
};

// Helper function to generate a slug from title
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

// POST - Manual sync from Square to local database (admin only)
export async function POST(request: NextRequest) {
  // Check admin authentication
  try {
    checkAdminAuth(request);
  } catch (error) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  
  // Check for concurrent sync operations
  const lockFile = path.join(process.cwd(), 'data', 'sync.lock');
  
  if (fs.existsSync(lockFile)) {
    const lockTime = fs.statSync(lockFile).mtime;
    const timeDiff = Date.now() - lockTime.getTime();
    
    // If lock is older than 30 minutes, consider it stale
    if (timeDiff < 30 * 60 * 1000) {
      return NextResponse.json({
        success: false,
        error: 'Another sync operation is already in progress',
        syncedCount: 0,
        skippedCount: 0,
        errorCount: 0,
        log: ['⚠️ Sync already in progress - please wait for completion']
      }, { status: 409 });
    }
  }
  
  // Create sync lock
  fs.writeFileSync(lockFile, new Date().toISOString());
  
  try {
    const log: string[] = [];
    
    log.push('🔄 Starting manual sync operation...');
    console.log('🔄 Starting manual sync operation...');
    
    // Use the improved sync function from square-api-service
    const { fetchProductsFromSquareWithRateLimit } = await import('@/lib/square-api-service');
    const { upsertProductFromSquare } = await import('@/lib/product-database-utils');
    
    log.push('📡 Fetching products from Square with proper image handling...');
    console.log('📡 Fetching products from Square with proper image handling...');
    
    let squareProducts;
    try {
      squareProducts = await fetchProductsFromSquareWithRateLimit();
    } catch (fetchError: any) {
      const errorMsg = fetchError?.message || String(fetchError);
      log.push(`❌ Failed to fetch products from Square: ${errorMsg}`);
      console.error('❌ Square API fetch error:', fetchError);
      
      // Check if it's a JSON parsing error
      if (errorMsg.includes('JSON') || errorMsg.includes('json') || errorMsg.includes('SyntaxError')) {
        log.push('🔍 This appears to be a JSON parsing error from Square API');
        log.push('💡 This usually means Square returned an empty or malformed response');
        log.push('🔄 Try running the sync again in a few minutes');
      }
      
      throw new Error(`Square API error: ${errorMsg}`);
    }
    
    log.push(`📊 Found ${squareProducts.length} products from Square`);
    console.log(`📊 Found ${squareProducts.length} products from Square`);
    
    let syncedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const product of squareProducts) {
      try {
        // Skip products without Square ID
        if (!product.squareId) {
          skippedCount++;
          console.log(`⏭️ Skipped: ${product.title} (no Square ID)`);
          continue;
        }

        const success = upsertProductFromSquare({
          squareId: product.squareId,
          title: product.title,
          price: product.price,
          description: product.description,
          image: product.image,
          artist: product.artist,
          imageIds: product.imageIds || [],
          images: product.images || [],
          slug: product.slug || generateSlug(product.title)
        }, {
          stockQuantity: product.stockQuantity,
          stockStatus: product.stockStatus,
          availableAtLocation: true
        });
        
        if (success) {
          syncedCount++;
          console.log(`✅ Synced: ${product.title}`);
        } else {
          skippedCount++;
          console.log(`⏭️ Skipped: ${product.title}`);
        }
      } catch (productError: any) {
        errorCount++;
        const errorMsg = productError?.message || 'Unknown error';
        log.push(`❌ Error syncing ${product.title}: ${errorMsg}`);
        console.error(`❌ Error syncing ${product.title}:`, productError);
      }
    }

    log.push(`🎉 Sync completed successfully!`);
    log.push(`📊 Results: ${syncedCount} synced, ${skippedCount} skipped, ${errorCount} errors`);
    
    console.log(`🎉 Sync completed! ${syncedCount} synced, ${skippedCount} skipped, ${errorCount} errors`);
    
    // Clean up sync lock
    if (fs.existsSync(lockFile)) {
      fs.unlinkSync(lockFile);
    }
    
    return NextResponse.json({
      success: true,
      syncedCount,
      skippedCount,
      errorCount,
      log
    });
    
  } catch (error: any) {
    // Clean up sync lock on error
    if (fs.existsSync(lockFile)) {
      fs.unlinkSync(lockFile);
    }
    
    const errorMessage = error?.message || 'Unknown error';
    console.error('❌ Sync error:', error);
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      syncedCount: 0,
      skippedCount: 0,
      errorCount: 1,
      log: [`❌ Sync failed: ${errorMessage}`]
    }, { status: 500 });
  }
}
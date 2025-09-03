import { NextRequest, NextResponse } from 'next/server';
import squareClient from '@/lib/square';
import { Square } from 'square';
import Database from 'better-sqlite3';
import { invalidateProductsCache } from '@/lib/cache-utils';
import { withAdminAuth } from '@/lib/route-protection';

// Helper function to convert BigInt to string for JSON serialization
function convertBigIntToString(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString);
  }
  
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = convertBigIntToString(obj[key]);
      }
    }
    return result;
  }
  
  return obj;
}

// Helper function to determine stock status
function getStockStatus(quantity: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
  if (quantity === 0) return 'out_of_stock';
  if (quantity < 3) return 'low_stock';
  return 'in_stock';
}

// GET - Fetch a single product from inventory API
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    
    // First, try to get product from local database
    const DB_PATH = process.env.DB_PATH || 'data/porchrecords.db';
    const db = new Database(DB_PATH);
    let localProduct: any = null;
    
    try {
      console.log('🔍 Looking for product in database with ID:', id);
      console.log('🔍 Trying lookup with:', [id, id, `square_${id}`, `square_${id}`]);
      // Try multiple ways to find the product
      localProduct = db.prepare(`
        SELECT * FROM products 
        WHERE id = ? OR square_id = ? OR id = ? OR square_id = ?
      `).get(id, id, `square_${id}`, `square_${id}`);
      console.log('🔍 Database lookup result:', localProduct ? 'Found' : 'Not found');
      if (localProduct) {
        console.log('🔍 Found product:', {
          id: localProduct.id,
          square_id: localProduct.square_id,
          genre: localProduct.genre,
          mood: localProduct.mood
        });
      } else {
        console.log('🔍 No product found in database');
      }
    } catch (error) {
      console.error('🔍 Database lookup error:', error);
    } finally {
      db.close();
    }
    
    // Only fetch from Square if we don't have local data or if we need fresh data
    let product: Square.CatalogObject | null = null;
    let item: any = null;
    let variation: any = null;
    let price = 0;
    let description = '';
    let isHidden = false;
    let isPreorder = false;
    let imageIds: string[] = [];
    let images: { id: string; url: string }[] = [];
    let image = '/store.webp';
    let stockQuantity = 0;
    let stockStatus = 'out_of_stock';

    // If we have local product data, try to use it first
    if (localProduct) {
      try {
        // Use cached data from local database
        price = localProduct.price || 0;
        description = localProduct.description || '';
        isHidden = !localProduct.is_visible;
        isPreorder = Boolean(localProduct.is_preorder);
        imageIds = localProduct.image_ids ? JSON.parse(localProduct.image_ids) : [];
        
        // Try to construct images from cached data
        if (imageIds.length > 0) {
          images = imageIds.map((imageId: string) => ({
            id: imageId,
            url: `https://square-catalog-production.s3.amazonaws.com/files/${imageId}`
          }));
          if (images.length > 0) {
            image = images[0].url;
          }
        }
        
        stockQuantity = localProduct.stock_quantity || 0;
        stockStatus = getStockStatus(stockQuantity);
        
        console.log('✅ Using cached product data to reduce Square API calls');
      } catch (error) {
        console.error('Error using cached data:', error);
      }
    }

    // Only fetch from Square if we don't have cached data or if it's stale
    // Use local data if available and recent (within 5 minutes)
    const shouldFetchFromSquare = !localProduct || !localProduct.last_synced_at || 
        (new Date().getTime() - new Date(localProduct.last_synced_at).getTime()) > 300000; // 5 minutes
    
    if (shouldFetchFromSquare) {
      try {
        console.log('🔄 Fetching fresh data from Square API');
        const catalog = await squareClient.catalog();
        const response = await catalog.searchItems({});
        if (!response.items) {
          return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
        }
        
        const foundProduct = response.items.find((item: Square.CatalogObject) => {
          if (item.type !== 'ITEM' || !item.itemData?.variations?.length) {
            return false;
          }
          const variation = item.itemData.variations[0];
          return variation.id === id;
        });
        
        if (foundProduct) {
          product = foundProduct;
        }
        
        if (!product) {
          // If we have local data, we can still return it even if Square doesn't have it
          if (localProduct) {
            console.log('⚠️ Product not found in Square but exists in local database');
          } else {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
          }
        } else {
          // We found the product in Square, process it
          console.log('✅ Found product in Square, processing fresh data');
          // Type cast to ensure TypeScript knows this is an ITEM
          item = product as Square.CatalogObject & { type: 'ITEM'; itemData: Square.CatalogItem };
          variation = item.itemData.variations![0] as Square.CatalogObject & { type: 'ITEM_VARIATION'; itemVariationData: Square.CatalogItemVariation };
          price = Number(variation.itemVariationData.priceMoney!.amount) / 100;
          
          // Parse visibility and preorder status from description
          description = item.itemData.description || '';
          isHidden = description.includes('[HIDDEN FROM STORE]');
          isPreorder = description.includes('[PREORDER]');
          
          // Fetch images from Square
          imageIds = item.itemData.imageIds || [];
          if (imageIds.length > 0) {
            images = await Promise.all(imageIds.map(async (imageId: string) => {
              try {
                const imageResponse = await catalog.object.get({ objectId: imageId });
                if (imageResponse.object && imageResponse.object.type === 'IMAGE' && imageResponse.object.imageData) {
                  return { id: imageId, url: imageResponse.object.imageData.url || `/store.webp` };
                } else {
                  return { id: imageId, url: `https://square-catalog-production.s3.amazonaws.com/files/${imageId}` };
                }
              } catch (error) {
                console.error('Error fetching image from Square:', error);
                return { id: imageId, url: `https://square-catalog-production.s3.amazonaws.com/files/${imageId}` };
              }
            }));
            if (images.length > 0) {
              image = images[0].url;
            }
          }
          
          // Fetch inventory count
          try {
            const locationId = process.env.SQUARE_LOCATION_ID;
            if (locationId) {
              const inventory = await squareClient.inventory();
              const inventoryResponse = await inventory.batchGetCounts({
                locationIds: [locationId],
                catalogObjectIds: [variation.id],
              });
              
              if (inventoryResponse && inventoryResponse.data && inventoryResponse.data.length > 0) {
                stockQuantity = Number(inventoryResponse.data[0].quantity) || 0;
              }
            }
          } catch (error) {
            console.error('Error fetching inventory for variation:', variation.id, error);
          }
          
          stockStatus = getStockStatus(stockQuantity);
        }
      } catch (error) {
        console.error('Error fetching from Square API:', error);
        console.error('Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace',
          localProduct: !!localProduct
        });
        // If Square API fails, continue with cached data
        if (!localProduct) {
          return NextResponse.json({ error: 'Failed to fetch product data' }, { status: 500 });
        }
      }
    }
    
    // Use local product data if available, otherwise use Square data
    let localProductData: any = {};
    let savedVariations: any[] = [];
    if (localProduct) {
      localProductData = {
        isVisible: Boolean(localProduct.is_visible),
        genre: localProduct.genre || '',
        mood: localProduct.mood || '',
        productType: localProduct.product_type || 'record',
        merchCategory: localProduct.merch_category || '',
        size: localProduct.size || '',
        color: localProduct.color || '',
        imageOrder: localProduct.image_order ? JSON.parse(localProduct.image_order) : []
      };
      try {
        if ((localProduct as any).variations) {
          savedVariations = typeof (localProduct as any).variations === 'string' 
            ? JSON.parse((localProduct as any).variations) 
            : (localProduct as any).variations;
        }
      } catch {}
    } else {
      // Fallback to database lookup by square_id
      try {
        const DB_PATH = process.env.DB_PATH || 'data/porchrecords.db';
        const db = new Database(DB_PATH);
        const product = db.prepare('SELECT * FROM products WHERE square_id = ?').get(variation.id);
        db.close();
        
          if (product) {
          localProductData = {
            isVisible: Boolean(product && typeof product === 'object' && 'is_visible' in product ? product.is_visible : true),
            genre: (product && typeof product === 'object' && 'genre' in product ? product.genre : '') || '',
            mood: '',
            productType: (product && typeof product === 'object' && 'product_type' in product ? product.product_type : 'record') || 'record',
            merchCategory: (product && typeof product === 'object' && 'merch_category' in product ? product.merch_category : '') || '',
            size: (product && typeof product === 'object' && 'size' in product ? product.size : '') || '',
            color: (product && typeof product === 'object' && 'color' in product ? product.color : '') || '',
            imageOrder: []
          };
            try {
              if ((product as any).variations) {
                savedVariations = typeof (product as any).variations === 'string' 
                  ? JSON.parse((product as any).variations) 
                  : (product as any).variations;
              }
            } catch {}
        }
      } catch (error) {
        console.error('Error loading local product data from database:', error);
      }
    }

    // Apply saved image order if available
    if (localProductData.imageOrder && localProductData.imageOrder.length > 0) {
      const orderedImages: { id: string; url: string }[] = [];
      const unorderedImages = [...images];
      
      // First, add images in the saved order
      for (const imageId of localProductData.imageOrder) {
        const foundImage = unorderedImages.find(img => img.id === imageId);
        if (foundImage) {
          orderedImages.push(foundImage);
          // Remove from unordered array to avoid duplicates
          const index = unorderedImages.findIndex(img => img.id === imageId);
          if (index > -1) {
            unorderedImages.splice(index, 1);
          }
        }
      }
      
      // Then add any remaining images that weren't in the saved order
      orderedImages.push(...unorderedImages);
      
      images = orderedImages;
    }

    // Map the product to the expected format for the edit page
    console.log('🎯 Final localProductData:', localProductData);
    const mappedProduct = {
      id: id,
      title: localProduct?.title || item?.itemData?.name || 'No title',
      artist: localProduct?.artist || 'Unknown Artist',
      price: localProduct?.price || price,
      description: localProduct?.description || description.replace(/\[HIDDEN FROM STORE\]|\[PREORDER\]/g, '').trim(),
      genre: localProductData.genre || 'Uncategorized',
      mood: localProductData.mood || '',
      image: image,
      images: images,
      imageIds: imageIds,
      isVisible: localProductData.isVisible !== undefined ? localProductData.isVisible : !isHidden,
      isPreorder: isPreorder,
      stockQuantity: stockQuantity,
      stockStatus: stockStatus,
      productType: localProductData.productType || 'record',
      merchCategory: localProductData.merchCategory || '',
      size: localProductData.size || '',
      color: localProductData.color || '',
      variations: savedVariations,
    };
    
    return NextResponse.json({ product: mappedProduct });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

import { updateAdminFields } from '@/lib/product-database-utils';

// PATCH - Update a product in local database (protected with admin auth)
async function patchHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const productData = await request.json();
    
    console.log('🔄 PATCH: Updating product with ID:', id);
    console.log('🔄 PATCH: Product data:', productData);
    
    // First, find the product to get the correct square_id
    const DB_PATH = process.env.DB_PATH || 'data/porchrecords.db';
    const db = new Database(DB_PATH);
    let localProduct: any = null;
    
    try {
      console.log('🔍 PATCH: Looking for product in database with ID:', id);
      console.log('🔍 PATCH: Trying lookup with:', [id, id, `square_${id}`, `square_${id}`]);
      // Try multiple ways to find the product (same logic as GET)
      localProduct = db.prepare(`
        SELECT * FROM products 
        WHERE id = ? OR square_id = ? OR id = ? OR square_id = ?
      `).get(id, id, `square_${id}`, `square_${id}`);
      console.log('🔍 PATCH: Database lookup result:', localProduct ? 'Found' : 'Not found');
      if (localProduct) {
        console.log('🔍 PATCH: Found product:', {
          id: localProduct.id,
          square_id: localProduct.square_id,
          genre: localProduct.genre,
          mood: localProduct.mood
        });
      } else {
        console.log('🔍 PATCH: No product found in database');
      }
    } catch (error) {
      console.error('🔍 PATCH: Database lookup error:', error);
    } finally {
      db.close();
    }

    if (!localProduct) {
      return NextResponse.json({ error: 'Product not found in local database' }, { status: 404 });
    }

    // Extract admin-managed fields from request
    const adminFields = {
      genre: productData.genre,
      mood: productData.mood,
      productType: productData.productType,
      merchCategory: productData.merchCategory,
      isVisible: productData.isVisible,
      size: productData.size,
      color: productData.color
    };
    
    // Update admin fields in database using the correct square_id
    const success = updateAdminFields(localProduct.square_id, adminFields);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to update product in database' }, { status: 500 });
    }
    
    console.log('✅ PATCH: Successfully updated admin fields for product:', id);
    
    // Invalidate cache so changes appear immediately
    invalidateProductsCache('admin product edit');
    
    return NextResponse.json({
      success: true,
      message: 'Product updated successfully'
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error updating product:', error);
    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}


// Export PATCH with admin authentication
export const PATCH = withAdminAuth(patchHandler);

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// DELETE - Remove a product from Square
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const catalog = await squareClient.catalog();
    await catalog.object.delete({ objectId: id });
    
    // Invalidate the products cache so changes appear immediately in the store
    invalidateProductsCache('product deletion');
    
    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    console.error('Error deleting product from Square:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
} 
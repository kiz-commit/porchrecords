import { NextRequest, NextResponse } from 'next/server';
import squareClient from '@/lib/square';
import { Square } from 'square';
import Database from 'better-sqlite3';
import { invalidateProductsCache } from '@/lib/cache-utils';

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
    const db = new Database('data/porchrecords.db');
    let localProduct: any = null;
    
    try {
      localProduct = db.prepare(`
        SELECT * FROM products 
        WHERE id = ? OR square_id = ?
      `).get(id, id);
    } finally {
      db.close();
    }
    
    // Fetch the product from Square as fallback
    const response = await squareClient.catalog.searchItems({});
    if (!response.items) {
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
    
    const product = response.items.find((item: Square.CatalogObject) => {
      if (item.type !== 'ITEM' || !item.itemData?.variations?.length) {
        return false;
      }
      const variation = item.itemData.variations[0];
      return variation.id === id;
    });
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    // Type cast to ensure TypeScript knows this is an ITEM
    const item = product as Square.CatalogObject & { type: 'ITEM'; itemData: Square.CatalogItem };
    const variation = item.itemData.variations![0] as Square.CatalogObject & { type: 'ITEM_VARIATION'; itemVariationData: Square.CatalogItemVariation };
    const price = Number(variation.itemVariationData.priceMoney!.amount) / 100;
    
    // Parse visibility and preorder status from description
    const description = item.itemData.description || '';
    const isHidden = description.includes('[HIDDEN FROM STORE]');
    const isPreorder = description.includes('[PREORDER]');
    
    // Fetch images from Square
    const imageIds = item.itemData.imageIds || [];
    let images: { id: string; url: string }[] = [];
    let image = '/store.webp';

    if (imageIds.length > 0) {
      images = await Promise.all(imageIds.map(async (imageId: string) => {
        try {
          const imageResponse = await squareClient.catalog.object.get({ objectId: imageId });
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
    let stockQuantity = 0;
    try {
      const locationId = process.env.SQUARE_LOCATION_ID;
      if (locationId) {
        const inventoryResponse = await squareClient.inventory.batchGetCounts({
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
    
    const stockStatus = getStockStatus(stockQuantity);
    
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
        const db = new Database('data/porchrecords.db');
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
    const mappedProduct = {
      id: variation.id,
      title: localProduct?.title || item.itemData!.name || 'No title',
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

// PATCH - Update a product in Square
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const productData = await request.json();
    
    // First, find the item that contains this variation
    const searchResponse = await squareClient.catalog.searchItems({});
    if (!searchResponse.items) {
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
    
    const product = searchResponse.items.find((item: Square.CatalogObject) => {
      if (item.type !== 'ITEM' || !item.itemData?.variations?.length) {
        return false;
      }
      const variation = item.itemData.variations[0];
      return variation.id === id;
    });
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    // Type cast to ensure TypeScript knows this is an ITEM
    const item = product as Square.CatalogObject & { type: 'ITEM'; itemData: Square.CatalogItem };
    
    // Build enhanced description with visibility and preorder status
    let enhancedDescription = productData.description || '';
    if (productData.isVisible === false) {
      enhancedDescription += '\n[HIDDEN FROM STORE]';
    }
    if (productData.isPreorder) {
      enhancedDescription += '\n[PREORDER]';
    }
    
    // Update fields
    const updatedObject = {
      ...item,
      itemData: {
        ...item.itemData,
        name: productData.title || item.itemData.name,
        description: enhancedDescription,
        // Add more fields as needed
      },
    };
    
    // SKIP Square update - we only want to update local data
    console.log('⚠️ Skipping Square update for production safety - only updating local data');
    
    // Save admin edits to local database (visibility, type, merch fields, text fields)
    if (
      productData.isVisible !== undefined ||
      productData.productType !== undefined ||
      productData.merchCategory !== undefined ||
      productData.size !== undefined ||
      productData.color !== undefined ||
      productData.genre !== undefined ||
      productData.description !== undefined ||
      productData.title !== undefined ||
      productData.price !== undefined
    ) {
      try {
        const db = new Database('data/porchrecords.db');
        const now = new Date().toISOString();

        const existing: any = db.prepare(`
          SELECT * FROM products WHERE square_id = ? OR id = ?
        `).get(id, `square_${id}`);

        if (existing && existing.id) {
          db.prepare(`
            UPDATE products 
            SET 
              is_visible = COALESCE(?, is_visible),
              title = COALESCE(?, title),
              price = COALESCE(?, price),
              description = COALESCE(?, description),
              genre = COALESCE(?, genre),
              product_type = COALESCE(?, product_type),
              merch_category = COALESCE(?, merch_category),
              size = COALESCE(?, size),
              color = COALESCE(?, color),
              updated_at = ?
            WHERE id = ? OR square_id = ?
          `).run(
            productData.isVisible === undefined ? null : (productData.isVisible ? 1 : 0),
            productData.title || null,
            productData.price ?? null,
            productData.description || null,
            productData.genre || null,
            productData.productType || null,
            productData.merchCategory || null,
            productData.size || null,
            productData.color || null,
            now,
            existing.id,
            id
          );
        } else {
          // Insert minimal row if not present; do NOT overwrite type later
          db.prepare(`
            INSERT INTO products (
              id, title, price, description, genre, square_id, is_visible, is_from_square, product_type, merch_category, size, color, updated_at, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)
          `).run(
            `square_${id}`,
            (productData.title || item.itemData.name),
            productData.price ?? null,
            productData.description || null,
            productData.genre || null,
            id,
            (productData.isVisible ? 1 : 0),
            productData.productType || 'record',
            productData.merchCategory || null,
            productData.size || null,
            productData.color || null,
            now,
            now
          );
        }

        db.close();
        console.log(`✅ Saved admin edits for product ${id}`);
      } catch (error) {
        console.error('Error saving product to database:', error);
      }
    }
    
    // Return success response - no Square object to serialize
    const response = {
      success: true,
      id: id,
      isVisible: productData.isVisible !== undefined ? productData.isVisible : true,
      message: 'Product visibility updated in local database only'
    };
    
    // Invalidate the products cache so changes appear immediately in the store
    invalidateProductsCache('product visibility update');
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating product in Square:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE - Remove a product from Square
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await squareClient.catalog.object.delete({ objectId: id });
    
    // Invalidate the products cache so changes appear immediately in the store
    invalidateProductsCache('product deletion');
    
    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    console.error('Error deleting product from Square:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
} 
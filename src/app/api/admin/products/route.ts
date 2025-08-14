import { NextRequest, NextResponse } from 'next/server';
import squareClient from '@/lib/square';
import { StoreProduct } from '@/lib/types';
import { Square } from 'square';
import { withAdminAuth } from '@/lib/route-protection';
import { invalidateProductsCache } from '@/lib/cache-utils';

function safeString(val: unknown): string {
  return typeof val === 'string' ? val : '';
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
    const inventoryResponse = await squareClient.inventory.batchGetCounts({
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

// GET - Fetch all products (protected with admin auth)
async function getHandler(request: NextRequest) {
  try {
    // Only fetch Square products
    let squareProducts: StoreProduct[] = [];
    try {
      // Fetch ALL items with pagination and location filtering
      const locationId = process.env.SQUARE_LOCATION_ID;
      let allItems: Square.CatalogObject[] = [];
      let cursor: string | undefined = undefined;
      do {
        const searchRequest: any = locationId
          ? { enabledLocationIds: [locationId], cursor }
          : { cursor };
        const resp = await squareClient.catalog.searchItems(searchRequest);
        if (resp.items) {
          allItems.push(...resp.items);
        }
        cursor = (resp as any).cursor;
      } while (cursor);
      
      if (allItems.length > 0) {
        const productsWithImages = await Promise.all(allItems.map(async (item: Square.CatalogObject): Promise<StoreProduct | null> => {
          if (item.type !== 'ITEM' || !item.itemData?.variations?.length) {
            return null;
          }
          
          const variation = item.itemData.variations[0];
          if (variation.type !== 'ITEM_VARIATION' || !variation.id) {
            return null;
          }
          
          // Special handling for voucher products - they don't have fixed prices
          const isVoucher = item.itemData.name?.toLowerCase().includes('voucher') || 
                           item.itemData.description?.toLowerCase().includes('voucher');
          
          // Check if variation has price (required for most products, but not vouchers)
          if (!variation.itemVariationData?.priceMoney && !isVoucher) {
            return null;
          }

          // TIER 1: Include items that are present at the location even if inventory tracking is disabled there
          const locationId = process.env.SQUARE_LOCATION_ID;
          const variationData = variation.itemVariationData || {} as any;
          const locationOverrides = (variationData.locationOverrides || []) as Array<{ locationId?: string; trackInventory?: boolean }>;
          const hasInventoryTrackingDisabledAtLocation = !!locationId && (
            variationData.trackInventory === false ||
            locationOverrides.some(o => o && o.locationId === locationId && o.trackInventory === false)
          );

          // Only require an inventory record when tracking is enabled at the location
          if (!hasInventoryTrackingDisabledAtLocation) {
            if (!await hasLocationInventory(variation.id)) {
              console.log(`   ⚠️  No inventory record at configured location for ${item.itemData.name} - including in admin listing as out-of-stock`);
              // Do not exclude from admin listing; continue to include
            }
          }

          const price = isVoucher ? 0 : Number(variation.itemVariationData?.priceMoney?.amount || 0) / 100;
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

          return {
            id: item.id,
            title: safeString(item.itemData.name),
            artist: item.itemData.description || 'Unknown Artist',
            price: price,
            image: image, // for backward compatibility
            images: images, // new field: all images
            imageIds: item.itemData.imageIds || [],
            genre: safeString(item.itemData.categoryId),
            description: item.itemData.description || '',
            inStock: true,
            isPreorder: false,
            isVisible: true,
            preorderReleaseDate: '',
            preorderQuantity: 0,
            preorderMaxQuantity: 0,
            productType: isVoucher ? 'voucher' : 'record',
            merchCategory: '',
            size: '',
            color: '',
            mood: '',
            stockQuantity: 999,
            stockStatus: 'in_stock',
            isVariablePricing: false
          };
        }));
        squareProducts = productsWithImages.filter((p: StoreProduct | null): p is StoreProduct => p !== null);
      }
    } catch (error) {
      console.error('Error fetching from Square:', error);
    }

    return NextResponse.json({ products: squareProducts });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// Export GET with admin authentication
export const GET = withAdminAuth(getHandler);

// POST - Create a new product (protected with sensitive admin auth)
async function postHandler(request: NextRequest) {
  try {
    const productData = await request.json();
    // Validate required fields
    if (!productData.title || !productData.artist || !productData.price) {
      return NextResponse.json(
        { error: 'Title, artist, and price are required' },
        { status: 400 }
      );
    }

    // Set default visibility if not provided
    if (productData.isVisible === undefined) {
      productData.isVisible = true;
    }

    // Create product in Square
    const locationId = process.env.SQUARE_LOCATION_ID;
    if (!locationId) {
      return NextResponse.json(
        { error: 'SQUARE_LOCATION_ID not configured' },
        { status: 500 }
      );
    }

    // Prepare Square item object
    const itemId = `#${Date.now()}`;
    const variationId = `#${itemId}_variation`;
    
    // Keep description as-is; visibility and preorder are tracked in DB tables now
    const enhancedDescription = productData.description || '';

    const batchUpsertBody: Square.BatchUpsertCatalogObjectsRequest = {
      batches: [
        {
          objects: [
            {
              type: 'ITEM',
              id: itemId,
              presentAtAllLocations: true,
              itemData: {
                name: productData.title,
                description: enhancedDescription,
                variations: [
                  {
                    type: 'ITEM_VARIATION',
                    id: variationId,
                    presentAtAllLocations: true,
                    itemVariationData: {
                      itemId: itemId,
                      name: productData.title,
                      pricingType: 'FIXED_PRICING',
                      priceMoney: {
                        amount: BigInt(Math.round(productData.price * 100)),
                        currency: 'AUD',
                      },
                      trackInventory: true,
                      inventoryAlertType: 'LOW_QUANTITY',
                      inventoryAlertThreshold: BigInt(5),
                    },
                  },
                ],
              },
            },
          ],
        },
      ],
      idempotencyKey: `create-product-${Date.now()}`,
    };

    let squareResponse;
    try {
      squareResponse = await squareClient.catalog.batchUpsert(batchUpsertBody);
    } catch (error) {
      console.error('Error creating product in Square:', error);
      return NextResponse.json(
        { error: 'Failed to create product in Square' },
        { status: 500 }
      );
    }

    // Invalidate the products cache so new product appears immediately in the store
    invalidateProductsCache('product creation');

    // Return the created Square product (basic info)
    const createdItem = squareResponse.objects?.find((obj: Square.CatalogObject) => obj.type === 'ITEM');
    return NextResponse.json({
      success: true,
      product: createdItem,
      message: 'Product created in Square successfully',
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  }
}

// Export POST with sensitive admin authentication (product creation is sensitive)
export const POST = withAdminAuth(postHandler, true); 
import { NextRequest, NextResponse } from 'next/server';
import squareClient from '@/lib/square';
import { invalidateProductsCache } from '@/lib/cache-utils';
import fs from 'fs';
import path from 'path';

const PRODUCTS_FILE = path.join(process.cwd(), 'src', 'data', 'products.json');
const SYNC_STATUS_FILE = path.join(process.cwd(), 'src', 'data', 'sync-status.json');

const readProducts = () => {
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      const data = fs.readFileSync(PRODUCTS_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error reading products file:', error);
    return [];
  }
};

const writeProducts = (products: any[]) => {
  try {
    const dir = path.dirname(PRODUCTS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2));
  } catch (error) {
    console.error('Error writing products file:', error);
    throw error;
  }
};

const updateSyncStatus = (lastSync: string, pendingChanges: number = 0) => {
  try {
    const dir = path.dirname(SYNC_STATUS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SYNC_STATUS_FILE, JSON.stringify({
      lastSync,
      pendingChanges,
    }, null, 2));
  } catch (error) {
    console.error('Error updating sync status:', error);
  }
};

export async function POST(request: NextRequest) {
  try {
    const { direction } = await request.json();
    const log: string[] = [];
    const now = new Date().toISOString();

    log.push(`[${new Date().toLocaleString()}] Starting ${direction} sync...`);

    if (direction === 'pull' || direction === 'both') {
      log.push('Pulling products from Square...');
      
      try {
        const response = await squareClient.catalog.searchItems({});
        // Safely stringify BigInt values for logging
        function replacer(key: string, value: any) {
          return typeof value === 'bigint' ? value.toString() : value;
        }
        console.log('Square API response:', JSON.stringify(response, replacer, 2));
        const existingProducts = readProducts();
        let newProducts = 0;
        let updatedProducts = 0;

        if (response.items) {
          const squareProducts = response.items.map((item: any) => {
            if (item.type !== 'ITEM' || !item.itemData?.variations?.length) {
              return null;
            }
            const variation = item.itemData.variations[0];
            if (variation.type !== 'ITEM_VARIATION' || !variation.id) {
              return null;
            }
            if (!variation.itemVariationData?.priceMoney) {
              return null;
            }

            const price = Number(variation.itemVariationData.priceMoney.amount) / 100;
            const image = item.itemData?.imageIds?.[0] 
              ? `https://square-catalog-production.s3.amazonaws.com/files/${item.itemData.imageIds[0]}` 
              : "/hero-image.jpg";

            return {
              id: variation.id,
              title: item.itemData.name || 'No title',
              price: price,
              description: item.itemData.description ?? '',
              image: image,
              inStock: true,
              artist: 'Unknown Artist',
              genre: 'Uncategorized',
              curationTags: [],
              isPreorder: false,
              isVisible: false, // New products are hidden by default
              squareId: item.id,
              isFromSquare: true,
              updatedAt: now,
            };
          }).filter(Boolean);

          // Merge with existing products
          const existingSquareIds = new Set(existingProducts.filter((p: any) => p.isFromSquare).map((p: any) => p.squareId));
          
          squareProducts.forEach((squareProduct: any) => {
            const existingIndex = existingProducts.findIndex((p: any) => p.squareId === squareProduct.squareId);
            
            if (existingIndex === -1) {
              existingProducts.push(squareProduct);
              newProducts++;
              log.push(`Added: ${squareProduct.title}`);
            } else {
              existingProducts[existingIndex] = { ...existingProducts[existingIndex], ...squareProduct };
              updatedProducts++;
              log.push(`Updated: ${squareProduct.title}`);
            }
          });

          writeProducts(existingProducts);
          
          // Save visibility settings for new products to local data file
          if (newProducts > 0) {
            try {
              const fs = require('fs');
              const path = require('path');
              const merchCategoriesPath = path.join(process.cwd(), 'src', 'data', 'merchCategories.json');
              
              let merchCategories: any = {};
              if (fs.existsSync(merchCategoriesPath)) {
                const data = fs.readFileSync(merchCategoriesPath, 'utf8');
                merchCategories = JSON.parse(data);
              }
              
              // Add visibility setting for new products
              squareProducts.forEach((product: any) => {
                if (!merchCategories[product.id]) {
                  merchCategories[product.id] = {
                    isVisible: false, // New products are hidden by default
                    productType: 'record',
                    merchCategory: '',
                    size: '',
                    color: '',
                    genre: '',
                    mood: '',
                  };
                }
              });
              
              fs.writeFileSync(merchCategoriesPath, JSON.stringify(merchCategories, null, 2));
              log.push(`Updated local data for ${newProducts} new products`);
            } catch (error) {
              console.error('Error saving local product data:', error);
              log.push(`Warning: Failed to save local data for new products`);
            }
          }
          
          log.push(`Pull complete: ${newProducts} new, ${updatedProducts} updated`);
        }
      } catch (error) {
        log.push(`Error pulling from Square: ${error}`);
        console.error('Error pulling from Square:', error);
      }
    }

    if (direction === 'push' || direction === 'both') {
      log.push('Pushing local products to Square...');
      
      try {
        const existingProducts = readProducts();
        const localProducts = existingProducts.filter((p: any) => !p.isFromSquare && !p.squareId);
        let pushedProducts = 0;

        for (const product of localProducts) {
          try {
            const locationId = process.env.SQUARE_LOCATION_ID;
            if (!locationId) {
              throw new Error('SQUARE_LOCATION_ID not configured');
            }

            // Create item in Square
            const squareResponse = await squareClient.catalog.batchUpsert({
              batches: [
                {
                  objects: [
                    {
                      type: 'ITEM',
                      id: `#${product.id}`,
                      itemData: {
                        name: product.title,
                        description: product.description,
                        categoryId: null,
                        variations: [
                          {
                            type: 'ITEM_VARIATION',
                            id: `#${product.id}_variation`,
                            itemVariationData: {
                              itemId: `#${product.id}`,
                              name: product.title,
                              pricingType: 'FIXED_PRICING',
                              priceMoney: {
                                amount: BigInt(Math.round(product.price * 100)),
                                currency: 'AUD'
                              },
                              trackInventory: true,
                              inventoryAlertType: 'LOW_QUANTITY',
                              inventoryAlertThreshold: BigInt(5),
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              ],
              idempotencyKey: `push-product-${product.id}-${Date.now()}`,
            });

            // Update the product with Square ID
            product.squareId = squareResponse.objects?.[0]?.id;
            product.isFromSquare = true;
            product.updatedAt = now;
            
            pushedProducts++;
            log.push(`Pushed: ${product.title}`);
          } catch (error) {
            log.push(`Failed to push ${product.title}: ${error}`);
          }
        }

        if (pushedProducts > 0) {
          writeProducts(existingProducts);
        }
        
        log.push(`Push complete: ${pushedProducts} products pushed to Square`);
      } catch (error) {
        log.push(`Error pushing to Square: ${error}`);
        console.error('Error pushing to Square:', error);
      }
    }

    log.push(`[${new Date().toLocaleString()}] Sync completed`);
    updateSyncStatus(now);

    // Invalidate the products cache after successful sync so changes appear immediately in the store
    invalidateProductsCache(`${direction} sync operation`);

    return NextResponse.json({
      success: true,
      log,
      message: `${direction} sync completed successfully`
    });
  } catch (error) {
    console.error('Error during sync:', error);
    return NextResponse.json(
      { error: 'Failed to perform sync operation' },
      { status: 500 }
    );
  }
} 
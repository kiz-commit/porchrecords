import { NextRequest, NextResponse } from 'next/server';
import squareClient from '@/lib/square';
import { getPreorderByProductId, getAvailablePreorderSlots } from '@/lib/preorder-utils';
import productsData from '@/data/products.json';

export async function POST(request: NextRequest) {
  try {
    const { cartItems } = await request.json();

    console.log('Validating inventory for cart items:', cartItems.length);

    // Validate required environment variables
    const locationId = process.env.SQUARE_LOCATION_ID;
    if (!locationId) {
      throw new Error('SQUARE_LOCATION_ID environment variable is required');
    }

    // Validate input
    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Cart items are required' },
        { status: 400 }
      );
    }

    const validationResults: any[] = [];
    const unavailableItems: any[] = [];
    let totalAvailable = 0;

    // Try to fetch live Square inventory for all products in cart (best-effort)
    const catalogObjectIds = Array.from(new Set(
      cartItems
        .map((i: any) => String(i?.product?.id || '').replace(/^square_/i, ''))
        .filter(Boolean)
    ));
    const idToAvailable: Record<string, number> = {};
    if (catalogObjectIds.length > 0) {
      try {
        const inv: any = await squareClient.inventory.batchGetCounts({
          locationIds: [locationId],
          catalogObjectIds
        } as any);
        const counts: any[] = inv?.data || inv?.counts || [];
        for (const c of counts) {
          const id = String(c.catalog_object_id || c.catalogObjectId || '');
          const state = String(c.state || '').toUpperCase();
          const qty = Number(c.quantity || 0);
          if (id && state === 'IN_STOCK' && Number.isFinite(qty)) {
            idToAvailable[id] = (idToAvailable[id] || 0) + qty;
          }
        }
      } catch (e) {
        console.warn('Live inventory fetch failed; will use cache fallback:', e);
      }
    }

    // Check inventory for each item
    for (const item of cartItems) {
      try {
        if (!item.product || !item.product.id) {
          validationResults.push({
            itemId: item.id,
            productId: item.product?.id || 'unknown',
            productName: item.product?.title || 'Unknown Product',
            requestedQuantity: item.quantity,
            availableQuantity: 0,
            isAvailable: false,
            error: 'Invalid product data'
          });
          unavailableItems.push({
            ...item,
            reason: 'Invalid product data'
          });
          continue;
        }

        const productId = item.product.id;
        const requestedQuantity = parseInt(item.quantity);
        
        // Check if this is a preorder product
        const preorderInfo = await getPreorderByProductId(productId);
        const isPreorder = preorderInfo?.isPreorder || false;
        
        let availableQuantity = 0;
        let isAvailable = true;
        let error = null;
        let maxQuantity = 0;

        if (isPreorder && preorderInfo) {
          // Handle preorder inventory
          maxQuantity = preorderInfo.preorderMaxQuantity || 0;
          availableQuantity = await getAvailablePreorderSlots(productId);
          
          if (requestedQuantity > availableQuantity) {
            isAvailable = false;
            if (availableQuantity === 0) {
              error = 'Preorder is full';
            } else {
              error = `Only ${availableQuantity} preorder slots available`;
            }
          }
        } else {
          // Handle regular product inventory
          // First, find the product in our local data
          let product = productsData.find(p => p.id === productId);
          
          // If not found in local data, try to fetch from cache API
          if (!product) {
            try {
              const cacheResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/products/cache`);
              if (cacheResponse.ok) {
                const cacheData = await cacheResponse.json();
                const cachedProduct = cacheData.products.find((p: any) => p.id === productId);
                if (cachedProduct) {
                  product = cachedProduct;
                }
              }
            } catch (cacheError) {
              console.error('Failed to fetch from cache API:', cacheError);
            }
          }
          
          // Check if this is a voucher product (either from cache or from cart item properties)
          const isVoucherProduct = product?.productType === 'voucher' || 
                                  item.product?.productType === 'voucher' ||
                                  item.product?.title?.toLowerCase().includes('gift voucher') ||
                                  item.product?.title?.toLowerCase().includes('voucher');
          
          if (product) {
            // Handle voucher products specially
            if (isVoucherProduct) {
              // Vouchers are always available and don't need inventory tracking
              availableQuantity = 999;
              maxQuantity = 999;
              isAvailable = true;
            } else {
              // Prefer live Square inventory counts when available
              const normalizedId = String(productId).replace(/^square_/i, '');
              const liveAvailable = idToAvailable[normalizedId];
              if (Number.isFinite(liveAvailable)) {
                availableQuantity = Math.max(0, Math.floor(liveAvailable));
                maxQuantity = availableQuantity;
                if (requestedQuantity > availableQuantity) {
                  isAvailable = false;
                  error = availableQuantity === 0 ? 'Out of stock' : `Only ${availableQuantity} available in stock`;
                }
              } else if (product.inStock) {
                // Fallback heuristic if live inventory not fetched
                availableQuantity = 10;
                maxQuantity = availableQuantity;
                if (requestedQuantity > availableQuantity) {
                  isAvailable = false;
                  error = `Only ${availableQuantity} available in stock`;
                }
              } else {
                availableQuantity = 0;
                maxQuantity = 0;
                isAvailable = false;
                error = 'Out of stock';
              }
            }
          } else if (isVoucherProduct) {
            // Handle voucher products that aren't found in cache but are clearly vouchers
            availableQuantity = 999;
            maxQuantity = 999;
            isAvailable = true;
          } else {
            // Product not found in local data; try live inventory last
            const normalizedId = String(productId).replace(/^square_/i, '');
            const liveAvailable = idToAvailable[normalizedId];
            if (Number.isFinite(liveAvailable)) {
              availableQuantity = Math.max(0, Math.floor(liveAvailable));
              maxQuantity = availableQuantity;
              isAvailable = requestedQuantity <= availableQuantity;
              if (!isAvailable) {
                error = availableQuantity === 0 ? 'Out of stock' : `Only ${availableQuantity} available in stock`;
              }
            } else {
              availableQuantity = 0;
              maxQuantity = 0;
              isAvailable = false;
              error = 'Product not found';
            }
          }
        }

        validationResults.push({
          itemId: item.id,
          productId: productId,
          productName: item.product.title,
          requestedQuantity: requestedQuantity,
          availableQuantity: availableQuantity,
          maxQuantity: maxQuantity,
          isAvailable: isAvailable,
          isPreorder: isPreorder,
          error: error
        });

        if (isAvailable) {
          totalAvailable += requestedQuantity;
        } else {
          unavailableItems.push({
            ...item,
            reason: error || 'Not available',
            availableQuantity: availableQuantity,
            maxQuantity: maxQuantity,
            isPreorder: isPreorder
          });
        }

      } catch (itemError) {
        console.error('Error checking inventory for item:', item.id, itemError);
        validationResults.push({
          itemId: item.id,
          productId: item.product?.id || 'unknown',
          productName: item.product?.title || 'Unknown Product',
          requestedQuantity: item.quantity,
          availableQuantity: 0,
          isAvailable: false,
          error: 'Failed to check inventory'
        });
        unavailableItems.push({
          ...item,
          reason: 'Failed to check inventory'
        });
      }
    }

    // Determine overall validation result
    const allAvailable = unavailableItems.length === 0;
    const someUnavailable = unavailableItems.length > 0 && unavailableItems.length < cartItems.length;
    const noneAvailable = unavailableItems.length === cartItems.length;

    const response = {
      success: allAvailable,
      allItemsAvailable: allAvailable,
      someItemsUnavailable: someUnavailable,
      noItemsAvailable: noneAvailable,
      totalItems: cartItems.length,
      availableItems: cartItems.length - unavailableItems.length,
      unavailableItems: unavailableItems.length,
      validationResults: validationResults,
      unavailableItemsDetails: unavailableItems,
      // Summary for frontend
      summary: {
        canProceed: allAvailable,
        message: allAvailable 
          ? 'All items are available' 
          : someUnavailable 
            ? `${unavailableItems.length} item(s) unavailable` 
            : 'No items are available',
        totalAvailable: totalAvailable
      }
    };

    console.log('Inventory validation completed:', {
      totalItems: cartItems.length,
      availableItems: response.availableItems,
      unavailableItems: response.unavailableItems,
      canProceed: response.summary.canProceed,
      validationResults: validationResults.map(r => ({
        product: r.productName,
        requested: r.requestedQuantity,
        available: r.availableQuantity,
        isAvailable: r.isAvailable,
        isPreorder: r.isPreorder
      }))
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('Inventory validation error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to validate inventory. Please try again.',
        summary: {
          canProceed: false,
          message: 'Unable to check inventory',
          totalAvailable: 0
        }
      },
      { status: 500 }
    );
  }
} 
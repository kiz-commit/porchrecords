import { NextRequest, NextResponse } from 'next/server';
import squareClient from '@/lib/square';
import { invalidateProductsCache } from '@/lib/cache-utils';
import { withAdminAuth } from '@/lib/route-protection';

// PATCH - Update inventory for a specific product
async function patchHandler(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { stockQuantity } = await request.json();

    if (typeof stockQuantity !== 'number' || stockQuantity < 0) {
      return NextResponse.json(
        { error: 'Stock quantity must be a non-negative number' },
        { status: 400 }
      );
    }

    // Get current inventory count
    const locationId = process.env.SQUARE_LOCATION_ID;
    if (!locationId) {
      return NextResponse.json(
        { error: 'SQUARE_LOCATION_ID not configured' },
        { status: 500 }
      );
    }

    try {
      // Get current inventory count
      const inventory = await squareClient.inventory();
      const currentInventory = await inventory.batchGetCounts({
        locationIds: [locationId],
        catalogObjectIds: [id],
      });

      let currentQuantity = 0;
      if (currentInventory && currentInventory.data && currentInventory.data.length > 0) {
        currentQuantity = Number(currentInventory.data[0].quantity) || 0;
      }

      // Calculate the adjustment needed
      const adjustment = stockQuantity - currentQuantity;
      const now = new Date().toISOString();

      if (adjustment > 0) {
        // Increase stock
        await inventory.batchCreateChanges({
          changes: [
            {
              type: 'ADJUSTMENT',
              adjustment: {
                catalogObjectId: id,
                locationId: locationId,
                quantity: adjustment.toString(),
                fromState: 'NONE',
                toState: 'IN_STOCK',
                occurredAt: now,
              },
            },
          ],
          idempotencyKey: `inventory-adjustment-${id}-${Date.now()}`,
        });
      } else if (adjustment < 0) {
        // Decrease stock
        await inventory.batchCreateChanges({
          changes: [
            {
              type: 'ADJUSTMENT',
              adjustment: {
                catalogObjectId: id,
                locationId: locationId,
                quantity: Math.abs(adjustment).toString(),
                fromState: 'IN_STOCK',
                toState: 'SOLD', // or 'WASTE', depending on your use case
                occurredAt: now,
              },
            },
          ],
          idempotencyKey: `inventory-adjustment-${id}-${Date.now()}`,
        });
      }
      // If adjustment === 0, do nothing

      console.log(`Updated inventory for product ${id} to ${stockQuantity}`);

      // Invalidate the products cache so inventory changes appear immediately in the store
      invalidateProductsCache('inventory update');

      return NextResponse.json({
        success: true,
        message: 'Inventory updated successfully in Square',
        productId: id,
        stockQuantity: stockQuantity,
        previousQuantity: currentQuantity,
        adjustment: adjustment,
      });
    } catch (error) {
      console.error('Error updating inventory in Square:', error);
      return NextResponse.json(
        { error: 'Failed to update inventory in Square' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating inventory:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 }
    );
  }
}

// Export with admin authentication (sensitive operation - inventory updates)
export const PATCH = withAdminAuth(patchHandler, true); 
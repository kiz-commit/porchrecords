import { NextRequest, NextResponse } from 'next/server';
import { getPreorderByProductId, updatePreorderQuantity } from '@/lib/preorder-utils';
import { getDatabase } from '@/lib/database';

// Consolidated POST handler (idempotent). Remove duplicate definitions below.
export async function POST(request: NextRequest) {
  try {
    const { productId, quantityChange, orderId } = await request.json();

    if (!productId || typeof productId !== 'string') {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    const change = Number.parseInt(String(quantityChange ?? 1));
    if (!Number.isFinite(change) || change <= 0) {
      return NextResponse.json({ error: 'quantityChange must be a positive integer' }, { status: 400 });
    }

    // Support multiple possible IDs (raw variation id or prefixed)
    const candidateIds = [productId, productId.replace(/^square_/i, '')];
    let preorder = null as any;
    let matchedId = null as string | null;
    for (const candidate of candidateIds) {
      const found = await getPreorderByProductId(candidate);
      if (found) {
        preorder = found;
        matchedId = candidate;
        break;
      }
    }

    if (!preorder) {
      return NextResponse.json({ error: 'Not a preorder item' }, { status: 404 });
    }

    // Ensure idempotency per orderId+product
    if (orderId) {
      const db = await getDatabase();
      await db.exec(`
        CREATE TABLE IF NOT EXISTS preorder_updates_log (
          order_id TEXT NOT NULL,
          product_id TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (order_id, product_id)
        )
      `);
      const existing = await db.get(
        'SELECT order_id FROM preorder_updates_log WHERE order_id = ? AND product_id = ?',
        [orderId, matchedId]
      );
      if (existing) {
        return NextResponse.json({
          success: true,
          productId: matchedId,
          orderId,
          alreadyApplied: true,
          preorder
        });
      }
    }

    // Apply the quantity change
    const ok = await updatePreorderQuantity(matchedId as string, change);
    if (!ok) {
      return NextResponse.json({ error: 'Preorder capacity exceeded or invalid update' }, { status: 400 });
    }

    // Return the new preorder state
    const updated = await getPreorderByProductId(matchedId as string);

    // Log application to prevent double-counting
    if (orderId) {
      const db = await getDatabase();
      await db.run(
        'INSERT OR IGNORE INTO preorder_updates_log (order_id, product_id, quantity) VALUES (?, ?, ?)',
        [orderId, matchedId, change]
      );
    }

    return NextResponse.json({
      success: true,
      orderId: orderId || null,
      productId: matchedId,
      preorder: updated,
    });
  } catch (error) {
    console.error('Failed to update preorder quantity:', error);
    return NextResponse.json({ error: 'Failed to update preorder quantity' }, { status: 500 });
  }
}

/**
 * GET endpoint to check current preorder quantity status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const preorder = await getPreorderByProductId(productId);
    if (!preorder) {
      return NextResponse.json(
        { error: 'Preorder not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      preorder,
      availableSlots: preorder.preorderMaxQuantity - preorder.preorderQuantity,
      capacityUsed: (preorder.preorderQuantity / preorder.preorderMaxQuantity) * 100,
    });
  } catch (error) {
    console.error('Failed to get preorder quantity status:', error);
    return NextResponse.json(
      { error: 'Failed to get preorder quantity status' },
      { status: 500 }
    );
  }
}
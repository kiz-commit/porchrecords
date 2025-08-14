import { getDatabase } from './database';
import squareClient from './square';

export interface PreorderData {
  productId: string;
  isPreorder: boolean;
  preorderReleaseDate: string;
  preorderQuantity: number;
  preorderMaxQuantity: number;
  preorderStatus?: 'upcoming' | 'active' | 'released' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
}

export interface PreorderProduct extends PreorderData {
  productName: string;
  title?: string;
  artist?: string;
  price?: number;
  stockQuantity?: number;
  daysUntilRelease?: number;
}

// Preorder status enum
export const PreorderStatus = {
  UPCOMING: 'upcoming' as const,
  ACTIVE: 'active' as const,
  RELEASED: 'released' as const,
  CANCELLED: 'cancelled' as const,
} as const;

export type PreorderStatusType = typeof PreorderStatus[keyof typeof PreorderStatus];

/**
 * Calculate preorder status based on release date and current settings
 */
export function calculatePreorderStatus(
  preorderReleaseDate: string,
  isPreorder: boolean,
  forcedStatus?: PreorderStatusType
): PreorderStatusType {
  if (forcedStatus) return forcedStatus;
  if (!isPreorder) return PreorderStatus.RELEASED;
  
  const releaseDate = new Date(preorderReleaseDate);
  const now = new Date();
  
  // Strip time components for date comparison
  releaseDate.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  
  if (releaseDate <= now) {
    return PreorderStatus.RELEASED;
  } else {
    return PreorderStatus.ACTIVE;
  }
}

/**
 * Calculate days until release
 */
export function calculateDaysUntilRelease(preorderReleaseDate: string): number {
  const releaseDate = new Date(preorderReleaseDate);
  const now = new Date();
  
  // Strip time components for accurate day calculation
  releaseDate.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  
  const diffTime = releaseDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

/**
 * Get all preorders from database
 */
export async function getAllPreorders(): Promise<PreorderData[]> {
  const db = await getDatabase();
  
  const preorders = await db.all(`
    SELECT 
      product_id as productId,
      is_preorder as isPreorder,
      preorder_release_date as preorderReleaseDate,
      preorder_quantity as preorderQuantity,
      preorder_max_quantity as preorderMaxQuantity
    FROM preorders 
    WHERE is_preorder = 1
    ORDER BY preorder_release_date ASC
  `);
  
  return preorders.map(preorder => ({
    ...preorder,
    preorderStatus: calculatePreorderStatus(
      preorder.preorderReleaseDate,
      preorder.isPreorder
    ),
  }));
}

/**
 * Get preorder by product ID
 */
export async function getPreorderByProductId(productId: string): Promise<PreorderData | null> {
  const db = await getDatabase();
  
  const preorder = await db.get(`
    SELECT 
      product_id as productId,
      is_preorder as isPreorder,
      preorder_release_date as preorderReleaseDate,
      preorder_quantity as preorderQuantity,
      preorder_max_quantity as preorderMaxQuantity
    FROM preorders 
    WHERE product_id = ?
  `, [productId]);
  
  if (!preorder) return null;
  
  return {
    ...preorder,
    preorderStatus: calculatePreorderStatus(
      preorder.preorderReleaseDate,
      preorder.isPreorder
    ),
  };
}

/**
 * Create or update preorder
 */
export async function createOrUpdatePreorder(data: Partial<PreorderData> & { productId: string }): Promise<void> {
  const db = await getDatabase();
  
  const now = new Date().toISOString();
  
  // Check if preorder already exists
  const existing = await getPreorderByProductId(data.productId);
  
  if (existing) {
    // Update existing preorder
    await db.run(`
      UPDATE preorders 
      SET 
        is_preorder = ?,
        preorder_release_date = ?,
        preorder_quantity = ?,
        preorder_max_quantity = ?
      WHERE product_id = ?
    `, [
      data.isPreorder ?? existing.isPreorder,
      data.preorderReleaseDate ?? existing.preorderReleaseDate,
      data.preorderQuantity ?? existing.preorderQuantity,
      data.preorderMaxQuantity ?? existing.preorderMaxQuantity,
      data.productId
    ]);
  } else {
    // Create new preorder
    await db.run(`
      INSERT INTO preorders (
        product_id,
        is_preorder,
        preorder_release_date,
        preorder_quantity,
        preorder_max_quantity
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      data.productId,
      data.isPreorder ?? true,
      data.preorderReleaseDate || '',
      data.preorderQuantity ?? 0,
      data.preorderMaxQuantity ?? 50
    ]);
  }
}

/**
 * Delete preorder
 */
export async function deletePreorder(productId: string): Promise<void> {
  const db = await getDatabase();
  
  await db.run(`
    DELETE FROM preorders 
    WHERE product_id = ?
  `, [productId]);
}

/**
 * Update preorder quantity (when customers place orders)
 */
export async function updatePreorderQuantity(productId: string, quantityChange: number): Promise<boolean> {
  const db = await getDatabase();
  
  const preorder = await getPreorderByProductId(productId);
  if (!preorder) return false;
  
  const newQuantity = preorder.preorderQuantity + quantityChange;
  
  // Check if within limits
  if (newQuantity < 0 || newQuantity > preorder.preorderMaxQuantity) {
    return false;
  }
  
  await db.run(`
    UPDATE preorders 
    SET preorder_quantity = ?
    WHERE product_id = ?
  `, [newQuantity, productId]);
  
  return true;
}

/**
 * Get available preorder slots
 */
export async function getAvailablePreorderSlots(productId: string): Promise<number> {
  const preorder = await getPreorderByProductId(productId);
  if (!preorder) return 0;
  
  return Math.max(0, preorder.preorderMaxQuantity - preorder.preorderQuantity);
}

/**
 * Check if product has available preorder slots
 */
export async function hasAvailablePreorderSlots(productId: string, requestedQuantity: number = 1): Promise<boolean> {
  const availableSlots = await getAvailablePreorderSlots(productId);
  return availableSlots >= requestedQuantity;
}

/**
 * Get preorders by status
 */
export async function getPreordersByStatus(status: PreorderStatusType): Promise<PreorderData[]> {
  const allPreorders = await getAllPreorders();
  return allPreorders.filter(preorder => preorder.preorderStatus === status);
}

/**
 * Get preorders releasing soon (within X days)
 */
export async function getPreordersReleasingSoon(daysAhead: number = 7): Promise<PreorderData[]> {
  const allPreorders = await getAllPreorders();
  
  return allPreorders.filter(preorder => {
    const daysUntilRelease = calculateDaysUntilRelease(preorder.preorderReleaseDate);
    return daysUntilRelease > 0 && daysUntilRelease <= daysAhead;
  });
}

/**
 * Release preorders that have reached their release date
 */
export async function releaseMaturedPreorders(): Promise<string[]> {
  const db = await getDatabase();
  const releasedProductIds: string[] = [];
  
  const maturedPreorders = await db.all(`
    SELECT product_id as productId
    FROM preorders 
    WHERE is_preorder = 1 
    AND DATE(preorder_release_date) <= DATE('now')
  `);
  
  for (const preorder of maturedPreorders) {
    // Update preorder status in database
    await db.run(`
      UPDATE preorders 
      SET is_preorder = 0
      WHERE product_id = ?
    `, [preorder.productId]);
    
    releasedProductIds.push(preorder.productId);
  }
  
  return releasedProductIds;
}

/**
 * Get preorder statistics with revenue tracking
 */
export async function getPreorderStats(): Promise<{
  totalPreorders: number;
  activePreorders: number;
  upcomingReleases: number;
  totalPreorderedItems: number;
  totalCapacity: number;
  capacityUtilization: number;
  estimatedRevenue: number;
  revenueByStatus: Record<string, number>;
}> {
  const allPreorders = await getAllPreorders();
  const activePreorders = allPreorders.filter(p => p.preorderStatus === 'active');
  const upcomingReleases = await getPreordersReleasingSoon(30);
  
  const totalPreorderedItems = allPreorders.reduce((sum, p) => sum + p.preorderQuantity, 0);
  const totalCapacity = allPreorders.reduce((sum, p) => sum + p.preorderMaxQuantity, 0);
  const capacityUtilization = totalCapacity > 0 ? (totalPreorderedItems / totalCapacity) * 100 : 0;
  
  // Calculate estimated revenue (basic calculation - in real system you'd get actual prices from orders)
  let estimatedRevenue = 0;
  const revenueByStatus: Record<string, number> = {
    active: 0,
    upcoming: 0,
    released: 0,
    cancelled: 0,
  };
  
  // Note: This is a simplified calculation. In a real system, you would:
  // 1. Join with actual order data to get real revenue
  // 2. Account for different pricing tiers
  // 3. Include shipping costs, taxes, etc.
  // 4. Handle currency conversions
  
  for (const preorder of allPreorders) {
    // Estimate based on average product price (placeholder)
    const estimatedPrice = 25; // This would come from actual product/order data
    const preorderRevenue = preorder.preorderQuantity * estimatedPrice;
    
    estimatedRevenue += preorderRevenue;
    revenueByStatus[preorder.preorderStatus || 'active'] += preorderRevenue;
  }
  
  return {
    totalPreorders: allPreorders.length,
    activePreorders: activePreorders.length,
    upcomingReleases: upcomingReleases.length,
    totalPreorderedItems,
    totalCapacity,
    capacityUtilization,
    estimatedRevenue,
    revenueByStatus,
  };
}

/**
 * Get detailed preorder revenue analysis
 */
export async function getPreorderRevenueAnalysis(): Promise<{
  totalEstimatedRevenue: number;
  revenueByProduct: Array<{
    productId: string;
    preorderQuantity: number;
    estimatedRevenue: number;
    status: string;
  }>;
  revenueByStatus: Record<string, number>;
  averageOrderValue: number;
  topPerformingPreorders: Array<{
    productId: string;
    preorderQuantity: number;
    estimatedRevenue: number;
    capacityUtilization: number;
  }>;
}> {
  const allPreorders = await getAllPreorders();
  
  let totalEstimatedRevenue = 0;
  const revenueByProduct: Array<{
    productId: string;
    preorderQuantity: number;
    estimatedRevenue: number;
    status: string;
  }> = [];
  
  const revenueByStatus: Record<string, number> = {
    active: 0,
    upcoming: 0,
    released: 0,
    cancelled: 0,
  };
  
  for (const preorder of allPreorders) {
    // Estimate based on average product price (placeholder)
    const estimatedPrice = 25; // This would come from actual product/order data
    const preorderRevenue = preorder.preorderQuantity * estimatedPrice;
    
    totalEstimatedRevenue += preorderRevenue;
    revenueByStatus[preorder.preorderStatus || 'active'] += preorderRevenue;
    
    revenueByProduct.push({
      productId: preorder.productId,
      preorderQuantity: preorder.preorderQuantity,
      estimatedRevenue: preorderRevenue,
      status: preorder.preorderStatus || 'active',
    });
  }
  
  const averageOrderValue = allPreorders.length > 0 
    ? totalEstimatedRevenue / allPreorders.reduce((sum, p) => sum + p.preorderQuantity, 0)
    : 0;
  
  const topPerformingPreorders = revenueByProduct
    .sort((a, b) => b.estimatedRevenue - a.estimatedRevenue)
    .slice(0, 5)
    .map(item => {
      const preorder = allPreorders.find(p => p.productId === item.productId);
      return {
        ...item,
        capacityUtilization: preorder 
          ? (preorder.preorderQuantity / preorder.preorderMaxQuantity) * 100
          : 0,
      };
    });
  
  return {
    totalEstimatedRevenue,
    revenueByProduct,
    revenueByStatus,
    averageOrderValue,
    topPerformingPreorders,
  };
}

/**
 * Validate preorder data
 */
export function validatePreorderData(data: Partial<PreorderData>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data.productId) {
    errors.push('Product ID is required');
  }
  
  if (data.preorderReleaseDate) {
    const releaseDate = new Date(data.preorderReleaseDate);
    if (isNaN(releaseDate.getTime())) {
      errors.push('Invalid release date format');
    } else if (releaseDate < new Date()) {
      errors.push('Release date must be in the future');
    }
  }
  
  if (data.preorderMaxQuantity !== undefined) {
    if (data.preorderMaxQuantity < 1) {
      errors.push('Maximum quantity must be at least 1');
    }
    if (data.preorderMaxQuantity > 10000) {
      errors.push('Maximum quantity cannot exceed 10,000');
    }
  }
  
  if (data.preorderQuantity !== undefined && data.preorderMaxQuantity !== undefined) {
    if (data.preorderQuantity > data.preorderMaxQuantity) {
      errors.push('Current quantity cannot exceed maximum quantity');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Migrate preorder data from JSON to database
 */
export async function migratePreordersFromJson(): Promise<{ migrated: number; errors: string[] }> {
  const db = await getDatabase();
  let migrated = 0;
  const errors: string[] = [];
  
  try {
    // Try to read the JSON file
    const fs = await import('fs');
    const path = await import('path');
    
    const preordersPath = path.join(process.cwd(), 'src', 'data', 'preorders.json');
    
    if (!fs.existsSync(preordersPath)) {
      return { migrated: 0, errors: ['No preorders.json file found'] };
    }
    
    const data = fs.readFileSync(preordersPath, 'utf8');
    const preordersJson = JSON.parse(data);
    
    for (const [productId, preorderData] of Object.entries(preordersJson)) {
      try {
        await createOrUpdatePreorder({
          productId,
          isPreorder: (preorderData as any).isPreorder ?? true,
          preorderReleaseDate: (preorderData as any).preorderReleaseDate || '',
          preorderQuantity: (preorderData as any).preorderQuantity ?? 0,
          preorderMaxQuantity: (preorderData as any).preorderMaxQuantity ?? 50,
        });
        migrated++;
      } catch (error) {
        errors.push(`Failed to migrate preorder ${productId}: ${error}`);
      }
    }
    
    return { migrated, errors };
  } catch (error) {
    return { migrated: 0, errors: [`Migration failed: ${error}`] };
  }
}
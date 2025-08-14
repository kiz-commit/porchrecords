import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DISCOUNTS_FILE = path.join(process.cwd(), 'src', 'data', 'discounts.json');

// Helper function to read discounts from file
function readDiscounts(): any[] {
  try {
    if (fs.existsSync(DISCOUNTS_FILE)) {
      const data = fs.readFileSync(DISCOUNTS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading discounts file:', error);
  }
  return [];
}

// POST - Get automatic discounts for products
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { products, orderAmount } = body;

    if (!products || !Array.isArray(products)) {
      return NextResponse.json(
        { error: 'Invalid products array' },
        { status: 400 }
      );
    }

    const discounts = readDiscounts();
    const now = new Date();
    
    // Filter for active automatic discounts
    const automaticDiscounts = discounts.filter(discount => {
      // Must be automatic and active
      if (discount.discountType !== 'AUTOMATIC' || discount.status !== 'ACTIVE') {
        return false;
      }

      // Check if within date range
      if (discount.startDate) {
        const startDateTime = new Date(discount.startDate);
        if (discount.startTime) {
          const [hours, minutes] = discount.startTime.split(':');
          startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        }
        if (startDateTime > now) {
          return false;
        }
      }
      if (discount.endDate) {
        const endDateTime = new Date(discount.endDate);
        if (discount.endTime) {
          const [hours, minutes] = discount.endTime.split(':');
          endDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        }
        if (endDateTime < now) {
          return false;
        }
      }

      // Check usage limits
      if (discount.maxUsage && discount.usageCount >= discount.maxUsage) {
        return false;
      }

      return true;
    });

    // Apply discounts based on targeting
    const applicableDiscounts = automaticDiscounts.map(discount => {
      let applicableProducts = products;
      let totalDiscountAmount = 0;

      // Filter products based on target type
      if (discount.targetType === 'CATEGORIES' && discount.targetCategories.length > 0) {
        applicableProducts = products.filter(product => {
          // Check if product matches any of the target categories
          return discount.targetCategories.some((targetCategory: string) => {
            // Check productType (record, merch, accessory)
            if (product.productType === targetCategory) return true;
            // Check merchCategory (T-Shirts, Hoodies, Vinyl Accessories, etc.)
            if (product.merchCategory === targetCategory) return true;
            return false;
          });
        });
      } else if (discount.targetType === 'SPECIFIC_PRODUCTS' && discount.targetProducts.length > 0) {
        applicableProducts = products.filter(product => 
          discount.targetProducts.includes(product.id)
        );
      }

      // Calculate discount amount for applicable products
      if (applicableProducts.length > 0) {
        const applicableTotal = applicableProducts.reduce((sum, product) => 
          sum + (product.price * product.quantity), 0
        );

        if (discount.type === 'PERCENTAGE' && discount.percentage) {
          totalDiscountAmount = (applicableTotal * Number(discount.percentage)) / 100;
        } else if (discount.type === 'FIXED_AMOUNT' && discount.amount) {
          totalDiscountAmount = Number(discount.amount);
        }

        // Ensure discount doesn't exceed applicable total
        totalDiscountAmount = Math.min(totalDiscountAmount, applicableTotal);
      }

      return {
        id: discount.id,
        name: discount.name,
        type: discount.type,
        percentage: discount.percentage,
        amount: discount.amount,
        discountAmount: totalDiscountAmount,
        applicableProducts: applicableProducts.map(p => p.id),
        targetType: discount.targetType,
        targetCategories: discount.targetCategories
      };
    }).filter(discount => discount.discountAmount > 0);

    return NextResponse.json({
      success: true,
      automaticDiscounts: applicableDiscounts,
      totalDiscountAmount: applicableDiscounts.reduce((sum, d) => sum + d.discountAmount, 0)
    });
  } catch (error) {
    console.error('Error getting automatic discounts:', error);
    return NextResponse.json(
      { error: 'Failed to get automatic discounts' },
      { status: 500 }
    );
  }
} 
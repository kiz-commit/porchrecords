import { NextRequest, NextResponse } from 'next/server';
import squareClient from '@/lib/square';
import { Square } from 'square';
import fs from 'fs';
import path from 'path';
import { withAdminAuth } from '@/lib/route-protection';

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

// Helper function to write discounts to file
function writeDiscounts(discounts: any[]): void {
  try {
    fs.writeFileSync(DISCOUNTS_FILE, JSON.stringify(discounts, null, 2));
  } catch (error) {
    console.error('Error writing discounts file:', error);
  }
}

// GET - Fetch all discounts
async function getHandler() {
  try {
    const discounts = readDiscounts();
    
    // Also fetch Square catalog discounts for comparison
    let squareDiscounts: Square.CatalogObject[] = [];
    try {
      const response = await squareClient.catalog.search({
        objectTypes: ['DISCOUNT']
      });
      squareDiscounts = response.objects || [];
    } catch (error) {
      console.error('Error fetching Square discounts:', error);
    }

    return NextResponse.json({
      discounts,
      squareDiscounts: squareDiscounts.map(discount => ({
        id: discount.id,
        name: (discount as any).discountData?.name,
        type: (discount as any).discountData?.discountType,
        percentage: (discount as any).discountData?.percentage,
        amount: (discount as any).discountData?.amountMoney?.amount
      }))
    });
  } catch (error) {
    console.error('Error fetching discounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch discounts' },
      { status: 500 }
    );
  }
}

// POST - Create a new discount
async function postHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, type, percentage, amount, startDate, startTime, endDate, endTime, maxUsage } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: name and type' },
        { status: 400 }
      );
    }

    // Create discount in Square Catalog
    let squareDiscountId: string | null = null;
    try {
      const discountData: any = {
        name: name,
        discountType: type === 'PERCENTAGE' ? 'FIXED_PERCENTAGE' : 'FIXED_AMOUNT'
      };

      if (type === 'PERCENTAGE' && percentage) {
        discountData.percentage = percentage.toString();
      } else if (type === 'FIXED_AMOUNT' && amount) {
        discountData.amountMoney = {
          amount: BigInt(Math.round(Number(amount) * 100)), // Convert to cents
          currency: 'AUD'
        };
      }

      const squareResponse = await squareClient.catalog.batchUpsert({
        batches: [
          {
            objects: [
              {
                type: 'DISCOUNT',
                id: `#discount-${Date.now()}`,
                discountData: discountData
              }
            ]
          }
        ],
        idempotencyKey: `create-discount-${Date.now()}`
      });

      const createdDiscount = squareResponse.objects?.find(obj => obj.type === 'DISCOUNT');
      if (createdDiscount) {
        squareDiscountId = createdDiscount.id;
      }
    } catch (error) {
      console.error('Error creating Square discount:', error);
      // Continue with local discount creation even if Square fails
    }

    // Generate a unique discount code
    const generateDiscountCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code: string;
      const existingDiscounts = readDiscounts();
      
      do {
        code = '';
        for (let i = 0; i < 8; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
      } while (existingDiscounts.some(d => d.code === code));
      
      return code;
    };

      // Create local discount record
  const newDiscount = {
    id: `discount-${Date.now()}`,
    name,
    code: generateDiscountCode(),
    type,
    percentage: type === 'PERCENTAGE' ? percentage : undefined,
    amount: type === 'FIXED_AMOUNT' ? Number(amount) : undefined,
    startDate: startDate || null,
    startTime: startTime || null,
    endDate: endDate || null,
    endTime: endTime || null,
    status: 'ACTIVE',
    discountType: body.discountType || 'MANUAL_CODE',
    targetType: body.targetType || 'ALL_PRODUCTS',
    targetCategories: body.targetCategories || [],
    targetProducts: body.targetProducts || [],
    applicableProducts: [],
    usageCount: 0,
    maxUsage: maxUsage ? Number(maxUsage) : null,
    squareDiscountId,
    createdAt: new Date().toISOString()
  };

    const discounts = readDiscounts();
    discounts.push(newDiscount);
    writeDiscounts(discounts);

    return NextResponse.json({
      success: true,
      discount: newDiscount,
      message: 'Discount created successfully'
    });
  } catch (error) {
    console.error('Error creating discount:', error);
    return NextResponse.json(
      { error: 'Failed to create discount' },
      { status: 500 }
    );
  }
}

// PUT - Update a discount
async function putHandler(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing discount ID' },
        { status: 400 }
      );
    }

    const discounts = readDiscounts();
    const discountIndex = discounts.findIndex(d => d.id === id);
    
    if (discountIndex === -1) {
      return NextResponse.json(
        { error: 'Discount not found' },
        { status: 404 }
      );
    }

    // Update Square discount if it exists
    if (discounts[discountIndex].squareDiscountId) {
      try {
        const discountData: any = {
          name: updateData.name || discounts[discountIndex].name,
          discountType: updateData.type === 'PERCENTAGE' ? 'FIXED_PERCENTAGE' : 'FIXED_AMOUNT'
        };

        if (updateData.type === 'PERCENTAGE' && updateData.percentage) {
          discountData.percentage = updateData.percentage.toString();
        } else if (updateData.type === 'FIXED_AMOUNT' && updateData.amount) {
          discountData.amountMoney = {
            amount: BigInt(Math.round(Number(updateData.amount) * 100)),
            currency: 'AUD'
          };
        }

        await squareClient.catalog.batchUpsert({
          batches: [
            {
              objects: [
                {
                  type: 'DISCOUNT',
                  id: discounts[discountIndex].squareDiscountId,
                  discountData: discountData
                }
              ]
            }
          ],
          idempotencyKey: `update-discount-${id}-${Date.now()}`
        });
      } catch (error) {
        console.error('Error updating Square discount:', error);
      }
    }

    // Update local discount
    discounts[discountIndex] = {
      ...discounts[discountIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    writeDiscounts(discounts);

    return NextResponse.json({
      success: true,
      discount: discounts[discountIndex],
      message: 'Discount updated successfully'
    });
  } catch (error) {
    console.error('Error updating discount:', error);
    return NextResponse.json(
      { error: 'Failed to update discount' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a discount
async function deleteHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing discount ID' },
        { status: 400 }
      );
    }

    const discounts = readDiscounts();
    const discountIndex = discounts.findIndex(d => d.id === id);
    
    if (discountIndex === -1) {
      return NextResponse.json(
        { error: 'Discount not found' },
        { status: 404 }
      );
    }

    // Delete from Square if it exists
    if (discounts[discountIndex].squareDiscountId) {
      try {
        await squareClient.catalog.object.delete({
          objectId: discounts[discountIndex].squareDiscountId
        });
      } catch (error) {
        console.error('Error deleting Square discount:', error);
      }
    }

    // Remove from local storage
    discounts.splice(discountIndex, 1);
    writeDiscounts(discounts);

    return NextResponse.json({
      success: true,
      message: 'Discount deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting discount:', error);
    return NextResponse.json(
      { error: 'Failed to delete discount' },
      { status: 500 }
    );
  }
}

// Export with admin authentication
export const GET = withAdminAuth(getHandler);
export const POST = withAdminAuth(postHandler, true);
export const PUT = withAdminAuth(putHandler, true);
export const DELETE = withAdminAuth(deleteHandler, true); 
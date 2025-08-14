import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DISCOUNTS_FILE = path.join(process.cwd(), 'src', 'data', 'discounts.json');
const VOUCHERS_FILE = path.join(process.cwd(), 'src', 'data', 'vouchers.json');

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

// Helper function to read vouchers from file
function readVouchers(): any[] {
  try {
    if (fs.existsSync(VOUCHERS_FILE)) {
      const data = fs.readFileSync(VOUCHERS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading vouchers file:', error);
  }
  return [];
}

// Helper function to write vouchers to file
function writeVouchers(vouchers: any[]): void {
  try {
    fs.writeFileSync(VOUCHERS_FILE, JSON.stringify(vouchers, null, 2));
  } catch (error) {
    console.error('Error writing vouchers file:', error);
  }
}

// Helper function to handle voucher redemption
function handleVoucherRedemption(voucher: any, orderAmount: number, vouchers: any[]) {
  // Check if voucher is active
  if (voucher.status !== 'ACTIVE') {
    return NextResponse.json(
      { error: `Voucher is ${voucher.status.toLowerCase()}` },
      { status: 400 }
    );
  }

  // Check if voucher has expired
  const now = new Date();
  const expiryDate = new Date(voucher.expiresAt);
  if (expiryDate < now) {
    // Mark voucher as expired
    const voucherIndex = vouchers.findIndex(v => v.id === voucher.id);
    if (voucherIndex !== -1) {
      vouchers[voucherIndex].status = 'EXPIRED';
      vouchers[voucherIndex].isExpired = true;
      writeVouchers(vouchers);
    }
    return NextResponse.json(
      { error: 'Voucher has expired' },
      { status: 400 }
    );
  }

  // Check if voucher has balance
  if (voucher.balance <= 0) {
    return NextResponse.json(
      { error: 'Voucher has no remaining balance' },
      { status: 400 }
    );
  }

  // Calculate voucher discount amount (can't exceed voucher balance or order amount)
  const discountAmount = Math.min(voucher.balance, orderAmount);

  return NextResponse.json({
    success: true,
    discount: {
      id: voucher.id,
      name: `Gift Voucher - $${voucher.originalAmount}`,
      type: 'VOUCHER',
      code: voucher.code,
      discountAmount: discountAmount,
      voucherBalance: voucher.balance,
      isVoucher: true
    },
    message: `Gift voucher applied! $${discountAmount.toFixed(2)} discount`
  });
}

// POST - Apply discount code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, orderAmount } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Missing discount code' },
        { status: 400 }
      );
    }

    if (!orderAmount || orderAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid order amount' },
        { status: 400 }
      );
    }

    const discounts = readDiscounts();
    const vouchers = readVouchers();
    const now = new Date();
    
    // First, try to find as a regular discount code
    const discount = discounts.find(d => d.code === code.toUpperCase());
    
    // If not found as discount, try to find as a gift voucher
    const voucher = vouchers.find(v => v.code === code.toUpperCase());

    if (!discount && !voucher) {
      return NextResponse.json(
        { error: 'Invalid discount or voucher code' },
        { status: 404 }
      );
    }

    // Handle voucher redemption
    if (voucher) {
      return handleVoucherRedemption(voucher, orderAmount, vouchers);
    }

    // Check if discount is active
    if (discount.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: `Discount is ${discount.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // Check if discount has started
    if (discount.startDate) {
      const startDateTime = new Date(discount.startDate);
      if (discount.startTime) {
        const [hours, minutes] = discount.startTime.split(':');
        startDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }
      if (startDateTime > now) {
        return NextResponse.json(
          { error: 'Discount has not started yet' },
          { status: 400 }
        );
      }
    }

    // Check if discount has expired
    if (discount.endDate) {
      const endDateTime = new Date(discount.endDate);
      if (discount.endTime) {
        const [hours, minutes] = discount.endTime.split(':');
        endDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }
      if (endDateTime < now) {
        discount.status = 'EXPIRED';
        writeDiscounts(discounts);
        return NextResponse.json(
          { error: 'Discount has expired' },
          { status: 400 }
        );
      }
    }

    // Check if discount has reached max usage
    if (discount.maxUsage && discount.usageCount >= discount.maxUsage) {
      return NextResponse.json(
        { error: 'Discount usage limit reached' },
        { status: 400 }
      );
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (discount.type === 'PERCENTAGE' && discount.percentage) {
      discountAmount = (orderAmount * Number(discount.percentage)) / 100;
    } else if (discount.type === 'FIXED_AMOUNT' && discount.amount) {
      discountAmount = Number(discount.amount);
    }

    // Ensure discount doesn't exceed order amount
    discountAmount = Math.min(discountAmount, orderAmount);

    if (discountAmount <= 0) {
      return NextResponse.json(
        { error: 'Discount cannot be applied to this order' },
        { status: 400 }
      );
    }

    // Update usage count
    const discountIndex = discounts.findIndex(d => d.id === discount.id);
    if (discountIndex !== -1) {
      discounts[discountIndex].usageCount = (discounts[discountIndex].usageCount || 0) + 1;
      writeDiscounts(discounts);
    }

    return NextResponse.json({
      success: true,
      discount: {
        id: discount.id,
        name: discount.name,
        type: discount.type,
        percentage: discount.percentage,
        amount: discount.amount,
        discountAmount: discountAmount
      },
      message: 'Discount applied successfully'
    });
  } catch (error) {
    console.error('Error applying discount:', error);
    return NextResponse.json(
      { error: 'Failed to apply discount' },
      { status: 500 }
    );
  }
} 
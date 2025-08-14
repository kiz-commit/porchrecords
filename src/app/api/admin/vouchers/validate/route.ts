import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const VOUCHERS_FILE = path.join(process.cwd(), 'src', 'data', 'vouchers.json');

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

// POST - Validate and apply voucher
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, orderId, orderAmount, customerEmail } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Missing voucher code' },
        { status: 400 }
      );
    }

    const vouchers = readVouchers();
    const voucher = vouchers.find(v => v.code === code.toUpperCase());

    if (!voucher) {
      return NextResponse.json(
        { error: 'Invalid voucher code' },
        { status: 404 }
      );
    }

    // Check if voucher is active
    if (voucher.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: `Voucher is ${voucher.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    // Check if voucher has expired
    if (voucher.expiresAt && new Date(voucher.expiresAt) < new Date()) {
      voucher.status = 'EXPIRED';
      writeVouchers(vouchers);
      return NextResponse.json(
        { error: 'Voucher has expired' },
        { status: 400 }
      );
    }

    // Check if voucher has sufficient balance
    if (voucher.balance <= 0) {
      return NextResponse.json(
        { error: 'Voucher has no remaining balance' },
        { status: 400 }
      );
    }

    // Calculate discount amount (cannot exceed voucher balance or order amount)
    const discountAmount = Math.min(voucher.balance, orderAmount || voucher.balance);
    
    // Update voucher balance and usage history
    const voucherIndex = vouchers.findIndex(v => v.id === voucher.id);
    if (voucherIndex !== -1) {
      vouchers[voucherIndex].balance -= discountAmount;
      vouchers[voucherIndex].usageHistory.push({
        orderId: orderId || `order-${Date.now()}`,
        amount: discountAmount,
        date: new Date().toISOString()
      });

      // Update status if balance is now 0
      if (vouchers[voucherIndex].balance <= 0) {
        vouchers[voucherIndex].status = 'USED';
      }

      writeVouchers(vouchers);
    }

    return NextResponse.json({
      success: true,
      voucher: {
        id: voucher.id,
        code: voucher.code,
        originalAmount: voucher.amount,
        remainingBalance: voucher.balance - discountAmount,
        discountAmount: discountAmount
      },
      message: 'Voucher applied successfully'
    });
  } catch (error) {
    console.error('Error validating voucher:', error);
    return NextResponse.json(
      { error: 'Failed to validate voucher' },
      { status: 500 }
    );
  }
} 
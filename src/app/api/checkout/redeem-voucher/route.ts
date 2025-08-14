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

// POST - Process voucher redemption after successful payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { voucherCode, amount, orderId, isInStore = false, adminUser = null } = body;

    if (!voucherCode || !amount || !orderId) {
      return NextResponse.json(
        { error: 'Missing required fields: voucherCode, amount, orderId' },
        { status: 400 }
      );
    }

    const vouchers = readVouchers();
    const voucherIndex = vouchers.findIndex(v => v.code === voucherCode.toUpperCase());

    if (voucherIndex === -1) {
      return NextResponse.json(
        { error: 'Voucher not found' },
        { status: 404 }
      );
    }

    const voucher = vouchers[voucherIndex];

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
      vouchers[voucherIndex].status = 'EXPIRED';
      vouchers[voucherIndex].isExpired = true;
      writeVouchers(vouchers);
      return NextResponse.json(
        { error: 'Voucher has expired' },
        { status: 400 }
      );
    }

    // Check if voucher has sufficient balance
    if (voucher.balance < amount) {
      return NextResponse.json(
        { error: `Insufficient voucher balance. Available: $${voucher.balance}` },
        { status: 400 }
      );
    }

    // Process the redemption
    const newBalance = voucher.balance - amount;
    
    // Add usage record
    const usageRecord = {
      orderId: orderId,
      amount: amount,
      date: new Date().toISOString(),
      type: isInStore ? 'IN_STORE' : 'ONLINE',
      processedBy: adminUser || 'SYSTEM'
    };

    vouchers[voucherIndex].balance = newBalance;
    vouchers[voucherIndex].usageHistory = vouchers[voucherIndex].usageHistory || [];
    vouchers[voucherIndex].usageHistory.push(usageRecord);

    // Update status if fully used
    if (newBalance <= 0) {
      vouchers[voucherIndex].status = 'USED';
    }

    // Save updated vouchers
    writeVouchers(vouchers);

    console.log(`Voucher ${voucherCode} redeemed: $${amount} (${isInStore ? 'IN-STORE' : 'ONLINE'}) - Balance: $${newBalance}`);

    return NextResponse.json({
      success: true,
      voucher: {
        code: voucher.code,
        originalAmount: voucher.originalAmount,
        amountUsed: amount,
        remainingBalance: newBalance,
        status: vouchers[voucherIndex].status,
        usageType: isInStore ? 'IN_STORE' : 'ONLINE'
      },
      message: `Voucher redeemed successfully. Remaining balance: $${newBalance.toFixed(2)}`
    });

  } catch (error) {
    console.error('Error processing voucher redemption:', error);
    return NextResponse.json(
      { error: 'Failed to process voucher redemption' },
      { status: 500 }
    );
  }
}
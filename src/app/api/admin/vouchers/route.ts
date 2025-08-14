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

// Helper function to generate unique voucher code
function generateVoucherCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code: string;
  const vouchers = readVouchers();
  
  do {
    code = '';
    for (let i = 0; i < 12; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } while (vouchers.some(v => v.code === code));
  
  return code;
}

// GET - Fetch all vouchers
export async function GET() {
  try {
    const vouchers = readVouchers();
    
    // Update status based on expiry dates
    const updatedVouchers = vouchers.map(voucher => {
      if (voucher.status === 'ACTIVE' && voucher.expiresAt) {
        const expiryDate = new Date(voucher.expiresAt);
        if (expiryDate < new Date()) {
          voucher.status = 'EXPIRED';
        }
      }
      return voucher;
    });
    
    // Save updated statuses
    if (JSON.stringify(updatedVouchers) !== JSON.stringify(vouchers)) {
      writeVouchers(updatedVouchers);
    }

    return NextResponse.json({
      vouchers: updatedVouchers
    });
  } catch (error) {
    console.error('Error fetching vouchers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vouchers' },
      { status: 500 }
    );
  }
}

// POST - Create a new voucher
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, customerEmail, customerName, expiresAt } = body;

    if (!amount) {
      return NextResponse.json(
        { error: 'Missing required field: amount' },
        { status: 400 }
      );
    }

    const voucherAmount = Number(amount);
    if (isNaN(voucherAmount) || voucherAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid voucher amount' },
        { status: 400 }
      );
    }

    // Create new voucher
    const newVoucher = {
      id: `voucher-${Date.now()}`,
      code: generateVoucherCode(),
      amount: voucherAmount,
      balance: voucherAmount, // Initially, balance equals amount
      status: 'ACTIVE',
      customerEmail: customerEmail || null,
      customerName: customerName || null,
      purchasedAt: new Date().toISOString(),
      expiresAt: expiresAt || null,
      usageHistory: [],
      createdAt: new Date().toISOString()
    };

    const vouchers = readVouchers();
    vouchers.push(newVoucher);
    writeVouchers(vouchers);

    return NextResponse.json({
      success: true,
      voucher: newVoucher,
      message: 'Voucher created successfully'
    });
  } catch (error) {
    console.error('Error creating voucher:', error);
    return NextResponse.json(
      { error: 'Failed to create voucher' },
      { status: 500 }
    );
  }
}

// PUT - Update a voucher
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing voucher ID' },
        { status: 400 }
      );
    }

    const vouchers = readVouchers();
    const voucherIndex = vouchers.findIndex(v => v.id === id);
    
    if (voucherIndex === -1) {
      return NextResponse.json(
        { error: 'Voucher not found' },
        { status: 404 }
      );
    }

    // Update voucher
    vouchers[voucherIndex] = {
      ...vouchers[voucherIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    writeVouchers(vouchers);

    return NextResponse.json({
      success: true,
      voucher: vouchers[voucherIndex],
      message: 'Voucher updated successfully'
    });
  } catch (error) {
    console.error('Error updating voucher:', error);
    return NextResponse.json(
      { error: 'Failed to update voucher' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a voucher
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing voucher ID' },
        { status: 400 }
      );
    }

    const vouchers = readVouchers();
    const voucherIndex = vouchers.findIndex(v => v.id === id);
    
    if (voucherIndex === -1) {
      return NextResponse.json(
        { error: 'Voucher not found' },
        { status: 404 }
      );
    }

    // Remove voucher
    vouchers.splice(voucherIndex, 1);
    writeVouchers(vouchers);

    return NextResponse.json({
      success: true,
      message: 'Voucher deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting voucher:', error);
    return NextResponse.json(
      { error: 'Failed to delete voucher' },
      { status: 500 }
    );
  }
} 
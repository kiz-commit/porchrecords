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

// Helper function to generate voucher code
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

// POST - Create voucher after successful payment
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, customerEmail, voucherAmount, customerName } = body;

    if (!orderId || !customerEmail || !voucherAmount) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, customerEmail, voucherAmount' },
        { status: 400 }
      );
    }

    // Generate voucher
    const voucherCode = generateVoucherCode();
    const voucher = {
      id: `voucher-${Date.now()}`,
      code: voucherCode,
      amount: voucherAmount,
      originalAmount: voucherAmount,
      balance: voucherAmount,
      status: 'ACTIVE',
      customerEmail: customerEmail,
      customerName: customerName || '',
      orderId: orderId,
      usageHistory: [],
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year expiry
      isExpired: false
    };

    // Save voucher to file
    const vouchers = readVouchers();
    vouchers.push(voucher);
    writeVouchers(vouchers);

    // TODO: Send email to customer with voucher code
    console.log(`Voucher created: ${voucherCode} for $${voucherAmount} - Email: ${customerEmail}`);

    return NextResponse.json({
      success: true,
      voucher: {
        code: voucherCode,
        amount: voucherAmount,
        expiresAt: voucher.expiresAt
      }
    });
  } catch (error) {
    console.error('Error creating voucher:', error);
    return NextResponse.json(
      { error: 'Failed to create voucher' },
      { status: 500 }
    );
  }
} 
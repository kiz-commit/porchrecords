import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getSession(request);
    if (!session || !session.authenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const totpSecret = process.env.TOTP_SECRET;
    const enabled = !!totpSecret;

    if (enabled) {
      // Generate QR code URL for display
      const speakeasy = require('speakeasy');
      const secret = speakeasy.generateSecret({
        name: 'Porch Records Admin',
        issuer: 'Porch Records',
        secret: totpSecret
      });

      return NextResponse.json({
        enabled: true,
        secret: totpSecret,
        qrCodeUrl: secret.otpauth_url
      });
    } else {
      return NextResponse.json({
        enabled: false
      });
    }

  } catch (error) {
    console.error('2FA status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
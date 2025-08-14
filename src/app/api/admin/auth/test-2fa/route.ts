import { NextRequest, NextResponse } from 'next/server';
import { getSession, verifyTOTP } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getSession(request);
    if (!session || !session.authenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: '2FA code is required' },
        { status: 400 }
      );
    }

    // Verify TOTP code
    if (!verifyTOTP(code)) {
      return NextResponse.json(
        { error: 'Invalid 2FA code' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '2FA test successful!'
    });

  } catch (error) {
    console.error('Test 2FA error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

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

    return NextResponse.json({
      enabled: false,
      message: '2FA has been disabled. To re-enable, set a new TOTP_SECRET in your .env.local file.',
      instructions: [
        '1. Remove or comment out the TOTP_SECRET line in your .env.local file',
        '2. Restart your development server',
        '3. 2FA will be disabled for future logins'
      ]
    });

  } catch (error) {
    console.error('Disable 2FA error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
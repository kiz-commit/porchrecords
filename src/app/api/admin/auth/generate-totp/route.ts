import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { generateTOTPSecret, generateAndStoreBackupCodes } from '@/lib/admin-security';

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

    // Generate new TOTP secret and store securely in database
    const { secret, qrCodeUrl } = await generateTOTPSecret(session.username);
    
    // Generate backup codes
    const backupCodes = await generateAndStoreBackupCodes(session.username);

    return NextResponse.json({
      enabled: true,
      secret,
      qrCodeUrl,
      backupCodes,
      message: 'New TOTP secret generated and stored securely. Use your authenticator app to scan the QR code.',
      warning: 'Save your backup codes in a secure location. They can only be used once each.'
    });

  } catch (error) {
    console.error('Generate TOTP error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
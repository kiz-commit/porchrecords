import { NextRequest, NextResponse } from 'next/server';
import { getSession, setSessionCookie } from '@/lib/auth';
import { verifyTOTPCode, verifyBackupCode, checkRateLimit, getClientIP, getUserAgent, logSecurityEvent } from '@/lib/admin-security';

export async function POST(request: NextRequest) {
  try {
    const { code, isBackupCode } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: '2FA code is required' },
        { status: 400 }
      );
    }

    // Rate limiting for 2FA attempts
    const ip = getClientIP(request);
    if (!checkRateLimit(ip, 10, 15)) {
      return NextResponse.json(
        { error: 'Too many 2FA attempts. Please try again later.' },
        { status: 429 }
      );
    }

    // Get current session
    const session = await getSession(request);
    
    if (!session || !session.authenticated) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify 2FA code (either TOTP or backup code)
    let verified = false;
    
    if (isBackupCode) {
      verified = await verifyBackupCode(session.username, code);
    } else {
      verified = await verifyTOTPCode(session.username, code);
    }

    if (!verified) {
      await logSecurityEvent({
        username: session.username,
        action: 'FAILED_2FA',
        details: `Failed ${isBackupCode ? 'backup code' : 'TOTP'} verification`,
        ip_address: ip,
        user_agent: getUserAgent(request),
        success: false,
      });
      
      return NextResponse.json(
        { error: 'Invalid 2FA code' },
        { status: 401 }
      );
    }

    // Update session to mark 2FA as verified
    const updatedSession = {
      ...session,
      twoFactorVerified: true,
    };

    // Set updated session cookie
    await setSessionCookie(updatedSession, request);

    await logSecurityEvent({
      username: session.username,
      action: 'SUCCESSFUL_2FA',
      details: `${isBackupCode ? 'Backup code' : 'TOTP'} verification successful`,
      ip_address: ip,
      user_agent: getUserAgent(request),
      success: true,
    });

    return NextResponse.json({
      success: true,
      message: '2FA verification successful'
    });

  } catch (error) {
    console.error('2FA error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
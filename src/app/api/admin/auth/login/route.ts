import { NextRequest, NextResponse } from 'next/server';
import { verifyCredentials, setSessionCookie } from '@/lib/auth';
import { getAdminSecurity } from '@/lib/admin-security';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Verify credentials with enhanced security
    const credentialCheck = await verifyCredentials(username, password, request);
    
    if (!credentialCheck.success) {
      if (credentialCheck.rateLimited) {
        return NextResponse.json(
          { error: 'Too many login attempts. Please try again later.' },
          { status: 429 }
        );
      }
      
      if (credentialCheck.locked) {
        return NextResponse.json(
          { error: 'Account is temporarily locked due to failed login attempts.' },
          { status: 423 }
        );
      }
      
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Check if 2FA is configured for this admin
    const adminSecurity = await getAdminSecurity(username);
    const requires2FA = adminSecurity?.totp_secret ? true : false;

    // Create session
    const session = {
      username,
      authenticated: true,
      requires2FA,
      twoFactorVerified: false,
    };

    // Set secure session cookies
    await setSessionCookie(session, request);

    return NextResponse.json({
      success: true,
      requires2FA,
      message: requires2FA 
        ? 'Please complete 2FA verification' 
        : 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
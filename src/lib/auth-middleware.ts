import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from './database';
import { getClientIP, getUserAgent, logSecurityEvent, checkRateLimit } from './admin-security';

// Simple session validation for middleware (without full database lookup)
async function validateSessionToken(sessionToken: string, jwtToken: string): Promise<{ valid: boolean; username?: string; requires2FA?: boolean; twoFactorVerified?: boolean }> {
  if (!sessionToken || !jwtToken) {
    return { valid: false };
  }

  try {
    // Simple JWT decode for middleware (verification will happen in API routes)
    const base64Url = jwtToken.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    const payload = JSON.parse(jsonPayload);
    
    // Check if JWT has expired
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return { valid: false };
    }

    // Quick database check for session token validity
    const database = await getDatabase();
    const sessionRecord = await database.get(
      'SELECT username, session_expires_at FROM admin_security WHERE session_token = ?',
      [sessionToken]
    );

    if (!sessionRecord) {
      return { valid: false };
    }

    // Check if session has expired
    const expiresAt = new Date(sessionRecord.session_expires_at);
    if (new Date() > expiresAt) {
      return { valid: false };
    }

    // Verify username matches
    if (sessionRecord.username !== payload.username) {
      return { valid: false };
    }

    return {
      valid: true,
      username: payload.username,
      requires2FA: payload.requires2FA,
      twoFactorVerified: payload.twoFactorVerified
    };

  } catch (error) {
    console.error('Session validation error in middleware:', error);
    return { valid: false };
  }
}

// Enhanced admin authentication middleware
export async function requireAdminAuth(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  const ip = getClientIP(request);
  const userAgent = getUserAgent(request);

  // Rate limiting for admin routes
  if (!checkRateLimit(ip, 100, 15)) { // 100 requests per 15 minutes for general admin access
    await logSecurityEvent({
      username: 'unknown',
      action: 'ADMIN_RATE_LIMITED',
      details: `Admin route access rate limited: ${pathname}`,
      ip_address: ip,
      user_agent: userAgent,
      success: false,
    });

    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  // Get session tokens
  const sessionToken = request.cookies.get('session-token')?.value;
  const jwtToken = request.cookies.get('auth-token')?.value;

  // Validate session
  const sessionValidation = await validateSessionToken(sessionToken || '', jwtToken || '');

  if (!sessionValidation.valid) {
    await logSecurityEvent({
      username: 'unknown',
      action: 'UNAUTHORIZED_ADMIN_ACCESS',
      details: `Unauthorized access attempt to admin route: ${pathname}`,
      ip_address: ip,
      user_agent: userAgent,
      success: false,
    });

    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Check if 2FA is required but not verified
  if (sessionValidation.requires2FA && !sessionValidation.twoFactorVerified) {
    await logSecurityEvent({
      username: sessionValidation.username!,
      action: 'INCOMPLETE_2FA',
      details: `Admin attempted to access route without completing 2FA: ${pathname}`,
      ip_address: ip,
      user_agent: userAgent,
      success: false,
    });

    return NextResponse.json(
      { error: '2FA verification required' },
      { status: 403 }
    );
  }

  // Log successful admin access for audit trail
  await logSecurityEvent({
    username: sessionValidation.username!,
    action: 'ADMIN_ACCESS',
    details: `Admin accessed route: ${pathname}`,
    ip_address: ip,
    user_agent: userAgent,
    success: true,
  });

  return null; // Continue with request
}

// Middleware for sensitive admin operations (higher security)
export async function requireSensitiveAdminAuth(request: NextRequest): Promise<NextResponse | null> {
  const ip = getClientIP(request);
  
  // More restrictive rate limiting for sensitive operations
  if (!checkRateLimit(`sensitive-${ip}`, 20, 15)) { // 20 requests per 15 minutes for sensitive operations
    return NextResponse.json(
      { error: 'Too many sensitive operations. Please try again later.' },
      { status: 429 }
    );
  }

  // First check regular admin auth
  const authCheck = await requireAdminAuth(request);
  if (authCheck) {
    return authCheck;
  }

  // Additional checks for sensitive operations
  const sessionToken = request.cookies.get('session-token')?.value;
  const jwtToken = request.cookies.get('auth-token')?.value;
  const sessionValidation = await validateSessionToken(sessionToken || '', jwtToken || '');

  if (!sessionValidation.valid) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // For sensitive operations, require 2FA only if it's configured
  if (sessionValidation.requires2FA && !sessionValidation.twoFactorVerified) {
    await logSecurityEvent({
      username: sessionValidation.username!,
      action: 'SENSITIVE_OP_BLOCKED',
      details: `Sensitive operation blocked - 2FA required: ${request.nextUrl.pathname}`,
      ip_address: ip,
      user_agent: getUserAgent(request),
      success: false,
    });

    return NextResponse.json(
      { error: 'Two-factor authentication required for this operation' },
      { status: 403 }
    );
  }

  // Log sensitive operation access
  await logSecurityEvent({
    username: sessionValidation.username!,
    action: 'SENSITIVE_ADMIN_ACCESS',
    details: `Admin performed sensitive operation: ${request.nextUrl.pathname}`,
    ip_address: ip,
    user_agent: getUserAgent(request),
    success: true,
  });

  return null; // Continue with request
}

// List of admin routes that require sensitive authentication
const SENSITIVE_ADMIN_ROUTES = [
  '/api/admin/auth/',
  '/api/admin/sync/',
  '/api/admin/media/upload',
  '/api/admin/site-config',
  '/api/admin/products/create',
  '/api/admin/products/*/edit',
  '/api/admin/discounts',
  '/api/admin/vouchers',
];

// Check if a route requires sensitive authentication
export function isSensitiveRoute(pathname: string): boolean {
  return SENSITIVE_ADMIN_ROUTES.some(route => {
    if (route.includes('*')) {
      const pattern = route.replace('*', '[^/]+');
      const regex = new RegExp(`^${pattern}`);
      return regex.test(pathname);
    }
    return pathname.startsWith(route);
  });
}

// Main middleware function for admin routes
export async function adminAuthMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;

  // Check if this is a sensitive route
  if (isSensitiveRoute(pathname)) {
    return await requireSensitiveAdminAuth(request);
  } else {
    return await requireAdminAuth(request);
  }
}
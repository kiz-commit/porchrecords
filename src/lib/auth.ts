import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { 
  getAdminSecurity, 
  recordFailedAttempt, 
  recordSuccessfulLogin, 
  isAdminLockedOut,
  validateSession,
  invalidateAllSessions,
  logSecurityEvent,
  getClientIP,
  getUserAgent,
  checkRateLimit,
  getRateLimitConfig
} from './admin-security';

// Lazy load speakeasy only when needed
let speakeasy: any = null;
function getSpeakeasy() {
  if (!speakeasy) {
    speakeasy = require('speakeasy');
  }
  return speakeasy;
}

// Environment variables for credentials
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const TOTP_SECRET = process.env.TOTP_SECRET;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';

export interface AuthSession {
  username: string;
  authenticated: boolean;
  requires2FA: boolean;
  twoFactorVerified: boolean;
}

export interface JWTPayload {
  username: string;
  authenticated: boolean;
  requires2FA: boolean;
  twoFactorVerified: boolean;
  iat: number;
  exp: number;
}

// Verify username and password with enhanced security
export async function verifyCredentials(username: string, password: string, request: NextRequest): Promise<{ success: boolean; locked?: boolean; rateLimited?: boolean }> {
  const ip = getClientIP(request);
  const userAgent = getUserAgent(request);
  
  // Check rate limiting
  const loginConfig = getRateLimitConfig('login');
  if (!checkRateLimit(ip, loginConfig.maxRequests, loginConfig.windowMinutes)) {
    await logSecurityEvent({
      username,
      action: 'RATE_LIMITED',
      details: 'Too many login attempts',
      ip_address: ip,
      user_agent: userAgent,
      success: false,
    });
    return { success: false, rateLimited: true };
  }
  
  // Check if account is locked
  if (await isAdminLockedOut(username)) {
    await logSecurityEvent({
      username,
      action: 'LOGIN_BLOCKED',
      details: 'Account is locked due to failed attempts',
      ip_address: ip,
      user_agent: userAgent,
      success: false,
    });
    return { success: false, locked: true };
  }
  
  // Verify credentials
  const credentialsValid = username === ADMIN_USERNAME && password === ADMIN_PASSWORD;
  
  if (!credentialsValid) {
    await recordFailedAttempt(username, ip);
    return { success: false };
  }
  
  return { success: true };
}

// Verify TOTP code
export function verifyTOTP(token: string): boolean {
  if (!TOTP_SECRET) {
    // If no TOTP secret is configured, skip 2FA
    return true;
  }
  
  const speakeasyLib = getSpeakeasy();
  return speakeasyLib.totp.verify({
    secret: TOTP_SECRET,
    encoding: 'base32',
    token: token,
    window: 2 // Allow 2 time steps in case of clock skew
  });
}

// Generate secure session token
export function generateSecureToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

// Generate JWT token for client-side validation
export function generateToken(session: AuthSession): string {
  return jwt.sign(session, JWT_SECRET, { expiresIn: '8h' });
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

// Get session from request with enhanced security validation
export async function getSession(request: NextRequest): Promise<AuthSession | null> {
  const sessionToken = request.cookies.get('session-token')?.value;
  const jwtToken = request.cookies.get('auth-token')?.value;
  
  if (!sessionToken || !jwtToken) return null;
  
  // Validate session against database
  const ip = getClientIP(request);
  const sessionValidation = await validateSession(sessionToken, ip);
  
  if (!sessionValidation.valid) {
    return null;
  }
  
  // Also verify JWT for additional security
  const payload = verifyToken(jwtToken);
  if (!payload || payload.username !== sessionValidation.username) {
    return null;
  }
  
  return {
    username: payload.username,
    authenticated: payload.authenticated,
    requires2FA: payload.requires2FA,
    twoFactorVerified: payload.twoFactorVerified
  };
}

// Set secure session cookies
export async function setSessionCookie(session: AuthSession, request: NextRequest): Promise<string> {
  const sessionToken = generateSecureToken();
  const jwtToken = generateToken(session);
  const cookieStore = await cookies();
  
  // Store session token in database
  const ip = getClientIP(request);
  await recordSuccessfulLogin(session.username, ip, sessionToken);
  
  // Set secure cookies
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: 8 * 60 * 60 // 8 hours
  };
  
  cookieStore.set('session-token', sessionToken, cookieOptions);
  cookieStore.set('auth-token', jwtToken, cookieOptions);
  
  return sessionToken;
}

// Clear session cookies and invalidate in database
export async function clearSessionCookie(request?: NextRequest): Promise<void> {
  const cookieStore = await cookies();
  
  // If we have a request, get the session info to invalidate in database
  if (request) {
    const sessionToken = request.cookies.get('session-token')?.value;
    if (sessionToken) {
      const sessionValidation = await validateSession(sessionToken, getClientIP(request));
      if (sessionValidation.valid && sessionValidation.username) {
        await invalidateAllSessions(sessionValidation.username);
        await logSecurityEvent({
          username: sessionValidation.username,
          action: 'LOGOUT',
          details: 'Admin logged out',
          ip_address: getClientIP(request),
          user_agent: getUserAgent(request),
          success: true,
        });
      }
    }
  }
  
  cookieStore.delete('session-token');
  cookieStore.delete('auth-token');
}

// Check if user is fully authenticated (including 2FA if required)
export function isFullyAuthenticated(session: AuthSession | null): boolean {
  if (!session) return false;
  if (!session.authenticated) return false;
  
  // If 2FA is required but not verified, not fully authenticated
  if (session.requires2FA && !session.twoFactorVerified) return false;
  
  return true;
}

// Generate TOTP secret for setup
export function generateTOTPSecret(): { secret: string; qrCodeUrl: string } {
  const speakeasyLib = getSpeakeasy();
  const secret = speakeasyLib.generateSecret({
    name: 'Porch Records Admin',
    issuer: 'Porch Records'
  });
  
  return {
    secret: secret.base32!,
    qrCodeUrl: secret.otpauth_url!
  };
} 
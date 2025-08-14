import { NextRequest, NextResponse } from 'next/server';
import { adminAuthMiddleware, requireSensitiveAdminAuth } from './auth-middleware';
import { getSession } from './auth';

// Type for API route handlers
type APIRouteHandler = (request: NextRequest, context?: any) => Promise<NextResponse> | NextResponse;

// Wrapper to protect admin API routes with authentication
export function withAdminAuth(handler: APIRouteHandler, requireSensitive: boolean = false): APIRouteHandler {
  return async (request: NextRequest, context?: any) => {
    try {
      // Apply appropriate middleware check
      const authResponse = requireSensitive 
        ? await requireSensitiveAdminAuth(request)
        : await adminAuthMiddleware(request);

      // If middleware returned a response, that means auth failed
      if (authResponse) {
        return authResponse;
      }

      // Authentication passed, proceed with the original handler
      return await handler(request, context);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

// Helper to get authenticated admin session in API routes
export async function getAuthenticatedAdmin(request: NextRequest): Promise<{
  username: string;
  session: any;
} | null> {
  try {
    const session = await getSession(request);
    
    if (!session?.authenticated) {
      return null;
    }

    // If 2FA is required, ensure it's verified
    if (session.requires2FA && !session.twoFactorVerified) {
      return null;
    }

    return {
      username: session.username,
      session
    };
  } catch (error) {
    console.error('Error getting authenticated admin:', error);
    return null;
  }
}

// Helper to check if current admin session requires and has completed 2FA
export async function isAdmin2FAVerified(request: NextRequest): Promise<boolean> {
  try {
    const session = await getSession(request);
    
    if (!session?.authenticated) {
      return false;
    }

    // If 2FA is not required, consider it verified
    if (!session.requires2FA) {
      return true;
    }

    // If 2FA is required, check if it's verified
    return session.twoFactorVerified || false;
  } catch (error) {
    console.error('Error checking 2FA status:', error);
    return false;
  }
}

// Decorator for methods that require full admin authentication
export function requireFullAuth() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (request: NextRequest, ...args: any[]) {
      const admin = await getAuthenticatedAdmin(request);
      if (!admin) {
        return NextResponse.json(
          { error: 'Full authentication required' },
          { status: 401 }
        );
      }

      return originalMethod.call(this, request, ...args);
    };

    return descriptor;
  };
}

// Decorator for methods that require 2FA
export function require2FA() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (request: NextRequest, ...args: any[]) {
      const admin = await getAuthenticatedAdmin(request);
      if (!admin) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      const is2FAVerified = await isAdmin2FAVerified(request);
      if (!is2FAVerified) {
        return NextResponse.json(
          { error: 'Two-factor authentication required' },
          { status: 403 }
        );
      }

      return originalMethod.call(this, request, ...args);
    };

    return descriptor;
  };
}

// Rate limiting decorator for API endpoints
export function rateLimit(maxRequests: number = 60, windowMinutes: number = 15) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const rateLimitStore = new Map<string, { count: number; lastReset: number }>();

    descriptor.value = async function (request: NextRequest, ...args: any[]) {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                 request.headers.get('x-real-ip') || 
                 'unknown';
      
      const now = Date.now();
      const windowMs = windowMinutes * 60 * 1000;
      const key = `${ip}-${propertyKey}`;
      
      const current = rateLimitStore.get(key);
      
      if (!current) {
        rateLimitStore.set(key, { count: 1, lastReset: now });
      } else if (now - current.lastReset > windowMs) {
        rateLimitStore.set(key, { count: 1, lastReset: now });
      } else if (current.count >= maxRequests) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      } else {
        current.count++;
      }

      return originalMethod.call(this, request, ...args);
    };

    return descriptor;
  };
}
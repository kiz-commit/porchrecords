import { NextRequest, NextResponse } from 'next/server';

// Simple session check without speakeasy dependency
function getSessionFromRequest(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;
  
  try {
    // Simple JWT decode without verification (for middleware only)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

function isFullyAuthenticated(session: any) {
  if (!session) return false;
  if (!session.authenticated) return false;
  
  // If 2FA is required but not verified, not fully authenticated
  if (session.requires2FA && !session.twoFactorVerified) return false;
  
  return true;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Only apply middleware to admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }
  
  // Allow access to login and 2FA pages
  if (pathname === '/admin/login' || pathname === '/admin/2fa') {
    return NextResponse.next();
  }
  
  // Check authentication for all other admin routes
  const session = getSessionFromRequest(request);
  
  if (!isFullyAuthenticated(session)) {
    // If not authenticated at all, redirect to login
    if (!session || !session.authenticated) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    // If authenticated but 2FA required and not verified, redirect to 2FA
    if (session.requires2FA && !session.twoFactorVerified) {
      return NextResponse.redirect(new URL('/admin/2fa', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 
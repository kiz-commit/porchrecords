import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/route-protection';
import { clearRateLimits, getClientIP } from '@/lib/admin-security';

async function postHandler(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    clearRateLimits(ip);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Rate limits cleared for your IP address',
      ip: ip
    });
  } catch (error) {
    console.error('Error clearing rate limits:', error);
    return NextResponse.json(
      { error: 'Failed to clear rate limits' },
      { status: 500 }
    );
  }
}

export const POST = withAdminAuth(postHandler);

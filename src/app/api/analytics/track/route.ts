import { NextRequest, NextResponse } from 'next/server';
import { trackEvent, upsertUserSession, initializeAnalyticsTables } from '@/lib/analytics-db';
import { getSessionIdFromRequest, ServerAnalytics } from '@/lib/analytics-collector';

// Initialize analytics tables on first use
let tablesInitialized = false;

async function ensureTablesInitialized() {
  if (!tablesInitialized) {
    try {
      await initializeAnalyticsTables();
      tablesInitialized = true;
    } catch (error) {
      console.error('Error initializing analytics tables:', error);
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureTablesInitialized();

    const body = await req.json();
    const {
      type,
      productId,
      productTitle,
      productPrice,
      squareId,
      pageSlug,
      pageTitle,
      searchQuery,
      userId,
      sessionId,
      userAgent,
      referrer,
      metadata,
      timestamp
    } = body;

    // Validate required fields
    if (!type || !sessionId || !timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields: type, sessionId, timestamp' },
        { status: 400 }
      );
    }

    // Get client IP address
    const ipAddress = 
      req.headers.get('x-forwarded-for')?.split(',')[0] || 
      req.headers.get('x-real-ip') ||
      'unknown';

    // Prepare event data
    const eventData = {
      type,
      productId,
      productTitle,
      productPrice,
      squareId,
      pageSlug,
      pageTitle,
      searchQuery,
      userId,
      sessionId,
      ipAddress,
      userAgent: userAgent || req.headers.get('user-agent'),
      referrer,
      metadata,
      timestamp
    };

    // Track the event
    const eventId = await trackEvent(eventData);

    // Handle special session events
    if (type === 'page_view' || type === 'session_start') {
      try {
        // Update or create session
        const sessionData = {
          sessionId,
          userId,
          ipAddress,
          userAgent: userAgent || req.headers.get('user-agent'),
          referrer,
          landingPage: pageSlug,
          startTime: timestamp,
          lastActivity: timestamp,
          pageViews: type === 'page_view' ? 1 : 0,
          isActive: true
        };

        await upsertUserSession(sessionData);
      } catch (error) {
        console.error('Error updating session:', error);
        // Don't fail the request if session update fails
      }
    }

    // Handle session end events
    if (type === 'session_end') {
      try {
        const metadataObj = metadata ? JSON.parse(metadata) : {};
        const duration = metadataObj.duration || 0;
        const pageViews = metadataObj.pageViews || 0;

        // Update session with final data
        await upsertUserSession({
          sessionId,
          userId,
          ipAddress,
          userAgent: userAgent || req.headers.get('user-agent'),
          referrer,
          startTime: timestamp,
          lastActivity: timestamp,
          pageViews,
          totalDuration: duration,
          isActive: false
        });
      } catch (error) {
        console.error('Error ending session:', error);
      }
    }

    // Log successful tracking (in development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`Analytics: Tracked ${type} event for session ${sessionId}`);
    }

    return NextResponse.json({ 
      success: true, 
      eventId,
      message: 'Event tracked successfully'
    });

  } catch (error) {
    console.error('Error tracking analytics event:', error);

    // Track the error itself (meta!)
    try {
      const sessionId = getSessionIdFromRequest(req);
      await ServerAnalytics.trackError(
        error as Error,
        'analytics-track-api',
        sessionId,
        req
      );
    } catch (trackingError) {
      console.error('Error tracking error event:', trackingError);
    }

    return NextResponse.json(
      { 
        error: 'Failed to track event',
        message: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// Handle preflight requests
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// Also support GET for simple tracking pixels/beacons
export async function GET(req: NextRequest) {
  try {
    await ensureTablesInitialized();

    const url = new URL(req.url);
    const type = url.searchParams.get('type') || 'page_view';
    const sessionId = url.searchParams.get('sessionId') || getSessionIdFromRequest(req);
    const pageSlug = url.searchParams.get('page');
    const pageTitle = url.searchParams.get('title');
    const productId = url.searchParams.get('productId');
    const timestamp = new Date().toISOString();

    // Get client IP address
    const ipAddress = 
      req.headers.get('x-forwarded-for')?.split(',')[0] || 
      req.headers.get('x-real-ip') ||
      'unknown';

    const eventData = {
      type: type as any,
      productId: productId || undefined,
      pageSlug: pageSlug || undefined,
      pageTitle: pageTitle || undefined,
      sessionId,
      ipAddress,
      userAgent: req.headers.get('user-agent') || undefined,
      referrer: req.headers.get('referer') || undefined,
      timestamp
    };

    await trackEvent(eventData);

    // Return a 1x1 transparent GIF for tracking pixels
    const gif = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );

    return new NextResponse(gif, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Error tracking analytics beacon:', error);
    
    // Return empty response even on error to not break pages
    return new NextResponse(null, { status: 200 });
  }
}
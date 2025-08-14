import { trackEvent, upsertUserSession, getSession, updateSessionActivity } from './analytics-db';

// Client-side analytics collector
export class AnalyticsCollector {
  private sessionId: string;
  private userId?: string;
  private sessionStartTime: string;
  private lastActivityTime: string;
  private pageViews: number = 0;
  private isInitialized: boolean = false;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = new Date().toISOString();
    this.lastActivityTime = this.sessionStartTime;
    
    if (typeof window !== 'undefined') {
      this.initializeSession();
    }
  }

  private generateSessionId(): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    return `session_${timestamp}_${randomString}`;
  }

  private async initializeSession(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const sessionData = {
        sessionId: this.sessionId,
        userId: this.userId,
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent,
        referrer: document.referrer || undefined,
        landingPage: window.location.pathname,
        startTime: this.sessionStartTime,
        lastActivity: this.lastActivityTime,
        pageViews: 0,
        isActive: true
      };

      await upsertUserSession(sessionData);
      this.isInitialized = true;
    } catch (error) {
      console.error('Error initializing analytics session:', error);
    }
  }

  private async getClientIP(): Promise<string | undefined> {
    try {
      // Note: In production, you might want to use a more reliable IP detection service
      const response = await fetch('/api/test-env');
      const data = await response.json();
      return data.ip;
    } catch {
      return undefined;
    }
  }

  // Set user ID when user logs in
  public setUserId(userId: string): void {
    this.userId = userId;
    if (this.isInitialized) {
      this.updateSession();
    }
  }

  // Track page view
  public async trackPageView(pageSlug: string, pageTitle?: string): Promise<void> {
    this.pageViews++;
    this.lastActivityTime = new Date().toISOString();

    try {
      await this.trackEvent({
        type: 'page_view',
        pageSlug,
        pageTitle,
        sessionId: this.sessionId,
        timestamp: this.lastActivityTime
      });

      await this.updateSession();
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  }

  // Track product view
  public async trackProductView(
    productId: string, 
    productTitle: string, 
    productPrice?: number,
    squareId?: string
  ): Promise<void> {
    this.lastActivityTime = new Date().toISOString();

    try {
      await this.trackEvent({
        type: 'product_view',
        productId,
        productTitle,
        productPrice,
        squareId,
        sessionId: this.sessionId,
        timestamp: this.lastActivityTime
      });

      await this.updateSession();
    } catch (error) {
      console.error('Error tracking product view:', error);
    }
  }

  // Track add to cart
  public async trackAddToCart(
    productId: string, 
    productTitle: string, 
    productPrice?: number,
    quantity: number = 1,
    squareId?: string
  ): Promise<void> {
    this.lastActivityTime = new Date().toISOString();

    try {
      await this.trackEvent({
        type: 'add_to_cart',
        productId,
        productTitle,
        productPrice,
        squareId,
        sessionId: this.sessionId,
        timestamp: this.lastActivityTime,
        metadata: JSON.stringify({ quantity })
      });

      await this.updateSession();
    } catch (error) {
      console.error('Error tracking add to cart:', error);
    }
  }

  // Track purchase
  public async trackPurchase(
    productId: string, 
    productTitle: string, 
    productPrice: number,
    quantity: number = 1,
    squareId?: string,
    orderId?: string
  ): Promise<void> {
    this.lastActivityTime = new Date().toISOString();

    try {
      await this.trackEvent({
        type: 'purchase',
        productId,
        productTitle,
        productPrice,
        squareId,
        sessionId: this.sessionId,
        timestamp: this.lastActivityTime,
        metadata: JSON.stringify({ quantity, orderId, totalValue: productPrice * quantity })
      });

      await this.updateSession();
    } catch (error) {
      console.error('Error tracking purchase:', error);
    }
  }

  // Track search
  public async trackSearch(searchQuery: string, resultsCount?: number): Promise<void> {
    this.lastActivityTime = new Date().toISOString();

    try {
      await this.trackEvent({
        type: 'search',
        searchQuery,
        sessionId: this.sessionId,
        timestamp: this.lastActivityTime,
        metadata: JSON.stringify({ resultsCount })
      });

      await this.updateSession();
    } catch (error) {
      console.error('Error tracking search:', error);
    }
  }

  // Track email signup
  public async trackEmailSignup(email?: string): Promise<void> {
    this.lastActivityTime = new Date().toISOString();

    try {
      await this.trackEvent({
        type: 'email_signup',
        sessionId: this.sessionId,
        timestamp: this.lastActivityTime,
        metadata: email ? JSON.stringify({ hasEmail: true }) : undefined
      });

      await this.updateSession();
    } catch (error) {
      console.error('Error tracking email signup:', error);
    }
  }

  // Track generic click events
  public async trackClick(
    elementType: string, 
    elementId?: string, 
    pageSlug?: string,
    metadata?: any
  ): Promise<void> {
    this.lastActivityTime = new Date().toISOString();

    try {
      await this.trackEvent({
        type: 'click',
        pageSlug,
        sessionId: this.sessionId,
        timestamp: this.lastActivityTime,
        metadata: JSON.stringify({ elementType, elementId, ...metadata })
      });

      await this.updateSession();
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  }

  // Private method to send events to API
  private async trackEvent(event: any): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...event,
          userAgent: navigator.userAgent,
          referrer: document.referrer || undefined,
        }),
      });
    } catch (error) {
      // Silently fail for analytics - don't disrupt user experience
      console.warn('Analytics tracking failed:', error);
    }
  }

  // Update session activity
  private async updateSession(): Promise<void> {
    try {
      await updateSessionActivity(this.sessionId, this.pageViews);
    } catch (error) {
      console.error('Error updating session:', error);
    }
  }

  // End session (call on page unload)
  public async endSession(): Promise<void> {
    if (typeof window === 'undefined' || !this.isInitialized) return;

    try {
      const sessionDuration = Date.now() - new Date(this.sessionStartTime).getTime();
      
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'session_end',
          sessionId: this.sessionId,
          timestamp: new Date().toISOString(),
          metadata: JSON.stringify({ 
            duration: sessionDuration, 
            pageViews: this.pageViews 
          })
        }),
      });
    } catch (error) {
      console.warn('Error ending session:', error);
    }
  }
}

// Server-side analytics utilities
export class ServerAnalytics {
  public static async trackServerEvent(
    type: string,
    sessionId: string,
    data: any = {},
    req?: any
  ): Promise<void> {
    try {
      const timestamp = new Date().toISOString();
      const ipAddress = req?.ip || req?.connection?.remoteAddress;
      const userAgent = req?.headers?.['user-agent'];

      await trackEvent({
        type: type as any,
        sessionId,
        timestamp,
        ipAddress,
        userAgent,
        ...data
      });
    } catch (error) {
      console.error('Error tracking server event:', error);
    }
  }

  public static async trackAPICall(
    endpoint: string,
    method: string,
    statusCode: number,
    sessionId?: string,
    req?: any
  ): Promise<void> {
    try {
      await this.trackServerEvent('api_call', sessionId || 'unknown', {
        metadata: JSON.stringify({
          endpoint,
          method,
          statusCode,
          timestamp: new Date().toISOString()
        })
      }, req);
    } catch (error) {
      console.error('Error tracking API call:', error);
    }
  }

  public static async trackError(
    error: Error,
    context: string,
    sessionId?: string,
    req?: any
  ): Promise<void> {
    try {
      await this.trackServerEvent('error', sessionId || 'unknown', {
        metadata: JSON.stringify({
          error: error.message,
          stack: error.stack,
          context,
          timestamp: new Date().toISOString()
        })
      }, req);
    } catch (error) {
      console.error('Error tracking error event:', error);
    }
  }
}

// Global analytics instance for client-side use
export const analytics = typeof window !== 'undefined' ? new AnalyticsCollector() : null;

// React hook for analytics
export function useAnalytics() {
  return {
    trackPageView: analytics?.trackPageView.bind(analytics),
    trackProductView: analytics?.trackProductView.bind(analytics),
    trackAddToCart: analytics?.trackAddToCart.bind(analytics),
    trackPurchase: analytics?.trackPurchase.bind(analytics),
    trackSearch: analytics?.trackSearch.bind(analytics),
    trackEmailSignup: analytics?.trackEmailSignup.bind(analytics),
    trackClick: analytics?.trackClick.bind(analytics),
    setUserId: analytics?.setUserId.bind(analytics),
  };
}

// Utility to extract session ID from request
export function getSessionIdFromRequest(req: any): string {
  // Try to get session ID from headers, cookies, or generate a new one
  const sessionId = 
    req.headers['x-session-id'] || 
    req.cookies?.sessionId ||
    `server_session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  
  return sessionId;
}
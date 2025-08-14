import { useEffect, useCallback } from 'react';

interface ProductView {
  productId: string;
  squareId?: string;
  title: string;
  timestamp: string;
  userId?: string;
  sessionId: string;
}

interface AnalyticsData {
  productViews: ProductView[];
  lastUpdated: string;
}

const ANALYTICS_STORAGE_KEY = 'porch_records_analytics';
const SESSION_ID_KEY = 'porch_records_session_id';

const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
  }
  return sessionId;
};

const getAnalyticsData = (): AnalyticsData => {
  if (typeof window === 'undefined') {
    return { productViews: [], lastUpdated: new Date().toISOString() };
  }

  const stored = localStorage.getItem(ANALYTICS_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error parsing analytics data:', error);
    }
  }

  return { productViews: [], lastUpdated: new Date().toISOString() };
};

const saveAnalyticsData = (data: AnalyticsData) => {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving analytics data:', error);
  }
};

const syncAnalyticsToServer = async (analyticsData: AnalyticsData) => {
  try {
    const response = await fetch('/api/analytics/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(analyticsData),
    });

    if (response.ok) {
      // Clear local data after successful sync
      localStorage.removeItem(ANALYTICS_STORAGE_KEY);
      return true;
    }
  } catch (error) {
    console.error('Error syncing analytics to server:', error);
  }
  return false;
};

export const useAnalytics = () => {
  const trackProductView = useCallback((productId: string, title: string, price?: number, squareId?: string) => {
    const sessionId = getSessionId();
    const analyticsData = getAnalyticsData();

    const newView: ProductView = {
      productId,
      squareId,
      title,
      timestamp: new Date().toISOString(),
      sessionId,
    };

    // Check if this is a duplicate view in the same session
    const isDuplicate = analyticsData.productViews.some(
      view => view.productId === productId && view.sessionId === sessionId
    );

    if (!isDuplicate) {
      analyticsData.productViews.push(newView);
      analyticsData.lastUpdated = new Date().toISOString();
      saveAnalyticsData(analyticsData);

      // Sync to server if user is logged in
      // TODO: Check if user is authenticated
      // if (isAuthenticated) {
      //   syncAnalyticsToServer(analyticsData);
      // }
    }
  }, []);

  const getProductViews = useCallback((productId: string, days: number = 7): number => {
    const analyticsData = getAnalyticsData();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return analyticsData.productViews.filter(
      view => view.productId === productId && new Date(view.timestamp) > cutoffDate
    ).length;
  }, []);

  const getTopViewedProducts = useCallback((days: number = 7, limit: number = 10) => {
    const analyticsData = getAnalyticsData();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentViews = analyticsData.productViews.filter(
      view => new Date(view.timestamp) > cutoffDate
    );

    const viewCounts: { [key: string]: { count: number; title: string; squareId?: string } } = {};

    recentViews.forEach(view => {
      if (!viewCounts[view.productId]) {
        viewCounts[view.productId] = {
          count: 0,
          title: view.title,
          squareId: view.squareId,
        };
      }
      viewCounts[view.productId].count++;
    });

    return Object.entries(viewCounts)
      .map(([productId, data]) => ({
        productId,
        title: data.title,
        views: data.count,
        squareId: data.squareId,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
  }, []);

  // Sync analytics data on component mount
  useEffect(() => {
    const analyticsData = getAnalyticsData();
    if (analyticsData.productViews.length > 0) {
      // Sync every 5 minutes
      const syncInterval = setInterval(() => {
        syncAnalyticsToServer(analyticsData);
      }, 5 * 60 * 1000);

      return () => clearInterval(syncInterval);
    }
  }, []);

  const trackPageView = useCallback((pageSlug: string, pageTitle: string) => {
    // Simple page view tracking via API call
    if (typeof window !== 'undefined') {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'page_view',
          pageSlug,
          pageTitle,
          sessionId: getSessionId(),
          timestamp: new Date().toISOString(),
        }),
      }).catch(error => {
        console.error('Error tracking page view:', error);
      });
    }
  }, []);

  const trackSearch = useCallback((searchQuery: string, resultCount?: number) => {
    // Simple search tracking via API call
    if (typeof window !== 'undefined') {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'search',
          searchQuery,
          metadata: resultCount ? JSON.stringify({ resultCount }) : undefined,
          sessionId: getSessionId(),
          timestamp: new Date().toISOString(),
        }),
      }).catch(error => {
        console.error('Error tracking search:', error);
      });
    }
  }, []);

  const trackPurchase = useCallback((orderId: string, orderTotal: number, orderData?: any) => {
    // Simple purchase tracking via API call
    if (typeof window !== 'undefined') {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'purchase',
          orderId,
          orderTotal,
          metadata: orderData ? JSON.stringify(orderData) : undefined,
          sessionId: getSessionId(),
          timestamp: new Date().toISOString(),
        }),
      }).catch(error => {
        console.error('Error tracking purchase:', error);
      });
    }
  }, []);

  return {
    trackProductView,
    trackPageView,
    trackSearch,
    trackPurchase,
    getProductViews,
    getTopViewedProducts,
    syncAnalyticsToServer,
  };
}; 
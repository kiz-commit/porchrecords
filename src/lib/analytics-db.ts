import { getDatabase } from './database';

// Analytics event types
export interface AnalyticsEvent {
  id?: string;
  type: 'page_view' | 'product_view' | 'add_to_cart' | 'purchase' | 'search' | 'email_signup' | 'click' | 'download';
  productId?: string;
  productTitle?: string;
  productPrice?: number;
  squareId?: string;
  pageSlug?: string;
  pageTitle?: string;
  searchQuery?: string;
  userId?: string;
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  metadata?: string; // JSON string for additional data
  timestamp: string;
}

export interface UserSession {
  id?: string;
  sessionId: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  referrer?: string;
  landingPage?: string;
  country?: string;
  city?: string;
  startTime: string;
  lastActivity: string;
  pageViews: number;
  totalDuration?: number;
  isActive: boolean;
}

export interface ConversionFunnel {
  sessionId: string;
  viewedProducts: string[];
  addedToCart: string[];
  purchasedProducts: string[];
  totalValue: number;
  conversionTime?: number;
}

// Initialize analytics tables
export async function initializeAnalyticsTables(): Promise<void> {
  const database = await getDatabase();

  // Create analytics_events table
  await database.exec(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
      type TEXT NOT NULL,
      product_id TEXT,
      product_title TEXT,
      product_price REAL,
      square_id TEXT,
      page_slug TEXT,
      page_title TEXT,
      search_query TEXT,
      user_id TEXT,
      session_id TEXT NOT NULL,
      ip_address TEXT,
      user_agent TEXT,
      referrer TEXT,
      metadata TEXT,
      timestamp TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create user_sessions table
  await database.exec(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id TEXT PRIMARY KEY DEFAULT (hex(randomblob(16))),
      session_id TEXT UNIQUE NOT NULL,
      user_id TEXT,
      ip_address TEXT,
      user_agent TEXT,
      referrer TEXT,
      landing_page TEXT,
      country TEXT,
      city TEXT,
      start_time TEXT NOT NULL,
      last_activity TEXT NOT NULL,
      page_views INTEGER DEFAULT 0,
      total_duration INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create analytics indexes for better performance
  await database.exec(`
    CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(type);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_product_id ON analytics_events(product_id);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
    CREATE INDEX IF NOT EXISTS idx_analytics_events_type_timestamp ON analytics_events(type, timestamp);
    CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
    CREATE INDEX IF NOT EXISTS idx_user_sessions_start_time ON user_sessions(start_time);
    CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);
  `);
}

// Track analytics event
export async function trackEvent(event: Omit<AnalyticsEvent, 'id'>): Promise<string> {
  const database = await getDatabase();
  
  const result = await database.run(`
    INSERT INTO analytics_events (
      type, product_id, product_title, product_price, square_id,
      page_slug, page_title, search_query, user_id, session_id,
      ip_address, user_agent, referrer, metadata, timestamp
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    event.type,
    event.productId || null,
    event.productTitle || null,
    event.productPrice || null,
    event.squareId || null,
    event.pageSlug || null,
    event.pageTitle || null,
    event.searchQuery || null,
    event.userId || null,
    event.sessionId,
    event.ipAddress || null,
    event.userAgent || null,
    event.referrer || null,
    event.metadata || null,
    event.timestamp
  ]);

  return result.lastID?.toString() || '';
}

// Create or update user session
export async function upsertUserSession(session: Omit<UserSession, 'id'>): Promise<void> {
  const database = await getDatabase();
  
  await database.run(`
    INSERT OR REPLACE INTO user_sessions (
      session_id, user_id, ip_address, user_agent, referrer,
      landing_page, country, city, start_time, last_activity,
      page_views, total_duration, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    session.sessionId,
    session.userId || null,
    session.ipAddress || null,
    session.userAgent || null,
    session.referrer || null,
    session.landingPage || null,
    session.country || null,
    session.city || null,
    session.startTime,
    session.lastActivity,
    session.pageViews,
    session.totalDuration || 0,
    session.isActive ? 1 : 0
  ]);
}

// Get session by session ID
export async function getSession(sessionId: string): Promise<UserSession | null> {
  const database = await getDatabase();
  
  const session = await database.get(`
    SELECT * FROM user_sessions WHERE session_id = ?
  `, [sessionId]);
  
  if (!session) return null;
  
  return {
    id: session.id,
    sessionId: session.session_id,
    userId: session.user_id,
    ipAddress: session.ip_address,
    userAgent: session.user_agent,
    referrer: session.referrer,
    landingPage: session.landing_page,
    country: session.country,
    city: session.city,
    startTime: session.start_time,
    lastActivity: session.last_activity,
    pageViews: session.page_views,
    totalDuration: session.total_duration,
    isActive: session.is_active === 1
  };
}

// Update session activity
export async function updateSessionActivity(sessionId: string, pageViews?: number): Promise<void> {
  const database = await getDatabase();
  
  const now = new Date().toISOString();
  const updatePageViews = pageViews !== undefined;
  
  if (updatePageViews) {
    await database.run(`
      UPDATE user_sessions 
      SET last_activity = ?, page_views = ?
      WHERE session_id = ?
    `, [now, pageViews, sessionId]);
  } else {
    await database.run(`
      UPDATE user_sessions 
      SET last_activity = ?
      WHERE session_id = ?
    `, [now, sessionId]);
  }
}

// Get top viewed products
export async function getTopViewedProducts(timeRange: 'weekly' | 'monthly', limit: number = 10): Promise<any[]> {
  const database = await getDatabase();
  
  const daysBack = timeRange === 'weekly' ? 7 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);
  
  const products = await database.all(`
    SELECT 
      ae.product_id as id,
      ae.product_title as title,
      ae.square_id as squareId,
      COUNT(*) as views,
      MAX(ae.timestamp) as lastViewed,
      COALESCE(purchases.purchase_count, 0) as purchases
    FROM analytics_events ae
    LEFT JOIN (
      SELECT product_id, COUNT(*) as purchase_count
      FROM analytics_events 
      WHERE type = 'purchase' AND timestamp >= ?
      GROUP BY product_id
    ) purchases ON ae.product_id = purchases.product_id
    WHERE ae.type = 'product_view' 
      AND ae.timestamp >= ?
      AND ae.product_id IS NOT NULL
    GROUP BY ae.product_id, ae.product_title, ae.square_id
    ORDER BY views DESC
    LIMIT ?
  `, [startDate.toISOString(), startDate.toISOString(), limit]);
  
  return products;
}

// Get viewed but not purchased products
export async function getViewedNotPurchasedProducts(limit: number = 10): Promise<any[]> {
  const database = await getDatabase();
  
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  
  const products = await database.all(`
    SELECT 
      views.product_id as id,
      views.product_title as title,
      views.square_id as squareId,
      views.view_count as views,
      views.last_viewed as lastViewed,
      0 as purchases
    FROM (
      SELECT 
        product_id,
        product_title,
        square_id,
        COUNT(*) as view_count,
        MAX(timestamp) as last_viewed
      FROM analytics_events 
      WHERE type = 'product_view' 
        AND timestamp >= ?
        AND product_id IS NOT NULL
      GROUP BY product_id, product_title, square_id
      HAVING view_count >= 3
    ) views
    LEFT JOIN (
      SELECT DISTINCT product_id
      FROM analytics_events 
      WHERE type = 'purchase' AND timestamp >= ?
    ) purchases ON views.product_id = purchases.product_id
    WHERE purchases.product_id IS NULL
    ORDER BY views.view_count DESC
    LIMIT ?
  `, [twoWeeksAgo.toISOString(), twoWeeksAgo.toISOString(), limit]);
  
  return products;
}

// Get bundle suggestions based on co-viewing patterns
export async function getBundleSuggestions(timeRange: 'weekly' | 'monthly', limit: number = 5): Promise<any[]> {
  const database = await getDatabase();
  
  const daysBack = timeRange === 'weekly' ? 7 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);
  
  // Get products viewed together in the same session
  const coViews = await database.all(`
    SELECT 
      p1.product_title as product1,
      p2.product_title as product2,
      COUNT(*) as frequency
    FROM analytics_events p1
    JOIN analytics_events p2 ON p1.session_id = p2.session_id 
      AND p1.product_id < p2.product_id
    WHERE p1.type = 'product_view' 
      AND p2.type = 'product_view'
      AND p1.timestamp >= ?
      AND p2.timestamp >= ?
      AND p1.product_id IS NOT NULL
      AND p2.product_id IS NOT NULL
    GROUP BY p1.product_id, p2.product_id, p1.product_title, p2.product_title
    HAVING frequency >= 3
    ORDER BY frequency DESC
    LIMIT ?
  `, [startDate.toISOString(), startDate.toISOString(), limit]);
  
  return coViews.map(row => ({
    products: [row.product1, row.product2],
    confidence: Math.min(0.95, row.frequency / 10),
    reason: `Viewed together ${row.frequency} times`
  }));
}

// Get re-engagement items (products that need attention)
export async function getReengagementItems(limit: number = 10): Promise<any[]> {
  const database = await getDatabase();
  
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  const items = await database.all(`
    SELECT 
      product_id as id,
      product_title as title,
      square_id as squareId,
      COUNT(*) as views,
      ROUND((julianday('now') - julianday(MAX(timestamp)))) as daysSinceLastView
    FROM analytics_events 
    WHERE type = 'product_view' 
      AND timestamp >= ?
      AND product_id IS NOT NULL
    GROUP BY product_id, product_title, square_id
    HAVING views >= 2 AND daysSinceLastView >= 1
    ORDER BY views DESC, daysSinceLastView ASC
    LIMIT ?
  `, [threeDaysAgo.toISOString(), limit]);
  
  return items.map(item => ({
    ...item,
    actions: {
      addDiscount: false,
      featureOnHomepage: false,
      createEmailPrompt: false
    }
  }));
}

// Get analytics summary stats
export async function getAnalyticsSummary(timeRange: 'weekly' | 'monthly'): Promise<{
  totalPageViews: number;
  totalProductViews: number;
  totalSessions: number;
  avgSessionDuration: number;
  topPages: any[];
  conversionRate: number;
  totalPurchases: number;
}> {
  const database = await getDatabase();
  
  const daysBack = timeRange === 'weekly' ? 7 : 30;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);
  
  // Get basic counts
  const [pageViews, productViews, sessions, purchases] = await Promise.all([
    database.get(`
      SELECT COUNT(*) as count 
      FROM analytics_events 
      WHERE type = 'page_view' AND timestamp >= ?
    `, [startDate.toISOString()]),
    
    database.get(`
      SELECT COUNT(*) as count 
      FROM analytics_events 
      WHERE type = 'product_view' AND timestamp >= ?
    `, [startDate.toISOString()]),
    
    database.get(`
      SELECT COUNT(*) as count 
      FROM user_sessions 
      WHERE start_time >= ?
    `, [startDate.toISOString()]),
    
    database.get(`
      SELECT COUNT(*) as count 
      FROM analytics_events 
      WHERE type = 'purchase' AND timestamp >= ?
    `, [startDate.toISOString()])
  ]);
  
  // Get average session duration
  const avgDuration = await database.get(`
    SELECT AVG(total_duration) as avg_duration
    FROM user_sessions 
    WHERE start_time >= ? AND total_duration > 0
  `, [startDate.toISOString()]);
  
  // Get top pages
  const topPages = await database.all(`
    SELECT 
      page_slug,
      page_title,
      COUNT(*) as views
    FROM analytics_events 
    WHERE type = 'page_view' 
      AND timestamp >= ?
      AND page_slug IS NOT NULL
    GROUP BY page_slug, page_title
    ORDER BY views DESC
    LIMIT 5
  `, [startDate.toISOString()]);
  
  // Calculate conversion rate
  const uniqueViewers = await database.get(`
    SELECT COUNT(DISTINCT session_id) as count
    FROM analytics_events 
    WHERE type = 'product_view' AND timestamp >= ?
  `, [startDate.toISOString()]);
  
  const uniquePurchasers = await database.get(`
    SELECT COUNT(DISTINCT session_id) as count
    FROM analytics_events 
    WHERE type = 'purchase' AND timestamp >= ?
  `, [startDate.toISOString()]);
  
  const conversionRate = uniqueViewers?.count > 0 
    ? (uniquePurchasers?.count || 0) / uniqueViewers.count * 100 
    : 0;
  
  return {
    totalPageViews: pageViews?.count || 0,
    totalProductViews: productViews?.count || 0,
    totalSessions: sessions?.count || 0,
    avgSessionDuration: avgDuration?.avg_duration || 0,
    topPages: topPages || [],
    conversionRate: Math.round(conversionRate * 100) / 100,
    totalPurchases: purchases?.count || 0
  };
}

// Clean up old analytics data (older than 1 year)
export async function cleanupOldAnalytics(): Promise<{ deletedEvents: number; deletedSessions: number }> {
  const database = await getDatabase();
  
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  
  const deletedEvents = await database.run(`
    DELETE FROM analytics_events WHERE timestamp < ?
  `, [oneYearAgo.toISOString()]);
  
  const deletedSessions = await database.run(`
    DELETE FROM user_sessions WHERE start_time < ?
  `, [oneYearAgo.toISOString()]);
  
  return {
    deletedEvents: deletedEvents.changes || 0,
    deletedSessions: deletedSessions.changes || 0
  };
}
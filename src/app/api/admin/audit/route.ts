import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '@/lib/route-protection';
import { getDatabase } from '@/lib/database';

// GET - Fetch audit logs with filtering and pagination
async function getHandler(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100 per page
    const action = searchParams.get('action');
    const username = searchParams.get('username');
    const success = searchParams.get('success');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const offset = (page - 1) * limit;
    
    // Build dynamic query based on filters
    let whereClause = '1=1';
    let queryParams: any[] = [];
    
    if (action) {
      whereClause += ' AND action = ?';
      queryParams.push(action);
    }
    
    if (username) {
      whereClause += ' AND username = ?';
      queryParams.push(username);
    }
    
    if (success !== null && success !== undefined && success !== '') {
      whereClause += ' AND success = ?';
      queryParams.push(success === 'true' ? 1 : 0);
    }
    
    if (startDate) {
      whereClause += ' AND timestamp >= ?';
      queryParams.push(startDate);
    }
    
    if (endDate) {
      whereClause += ' AND timestamp <= ?';
      queryParams.push(endDate);
    }
    
    const database = await getDatabase();
    
    // Get total count for pagination
    const countResult = await database.get(
      `SELECT COUNT(*) as total FROM admin_audit_log WHERE ${whereClause}`,
      queryParams
    );
    
    const total = countResult.total;
    const totalPages = Math.ceil(total / limit);
    
    // Get audit logs with pagination
    const logs = await database.all(
      `SELECT * FROM admin_audit_log 
       WHERE ${whereClause} 
       ORDER BY timestamp DESC 
       LIMIT ? OFFSET ?`,
      [...queryParams, limit, offset]
    );
    
    // Get summary statistics
    const stats = await database.all(`
      SELECT 
        action,
        COUNT(*) as count,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed
      FROM admin_audit_log 
      WHERE timestamp >= datetime('now', '-7 days')
      GROUP BY action
      ORDER BY count DESC
      LIMIT 10
    `);
    
    // Get recent security events
    const securityEvents = await database.all(`
      SELECT * FROM admin_audit_log 
      WHERE action IN ('FAILED_LOGIN', 'RATE_LIMITED', 'UNAUTHORIZED_ADMIN_ACCESS', 'IP_MISMATCH', 'SESSION_EXPIRED')
      AND timestamp >= datetime('now', '-24 hours')
      ORDER BY timestamp DESC
      LIMIT 20
    `);
    
    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      stats,
      securityEvents,
      filters: {
        action,
        username,
        success,
        startDate,
        endDate
      }
    });
    
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}

// Export with admin authentication (sensitive operation)
export const GET = withAdminAuth(getHandler, true);
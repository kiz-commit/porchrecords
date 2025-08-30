import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import { withAdminAuth } from '@/lib/route-protection';

async function handler(request: NextRequest) {
  try {
    const DB_PATH = process.env.DB_PATH || 'data/porchrecords.db';
    const db = new Database(DB_PATH);
    
    // Add the available_at_location column if it doesn't exist
    try {
      db.exec('ALTER TABLE products ADD COLUMN available_at_location BOOLEAN DEFAULT 1;');
      console.log('✅ Added available_at_location column');
    } catch (error: any) {
      if (error.message.includes('duplicate column name')) {
        console.log('✅ Column available_at_location already exists');
      } else {
        throw error;
      }
    }
    
    // Create index for better performance
    try {
      db.exec('CREATE INDEX idx_products_location_available ON products(available_at_location);');
      console.log('✅ Created index on available_at_location');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        console.log('✅ Index on available_at_location already exists');
      } else {
        throw error;
      }
    }
    
    // Count products before and after
    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get() as any;
    
    db.close();
    
    return NextResponse.json({
      success: true,
      message: 'Database migration completed successfully',
      totalProducts: totalProducts.count
    });
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const POST = withAdminAuth(handler);

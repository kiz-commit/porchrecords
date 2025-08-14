import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';

// GET - Load all homepage data in a single optimized request
export async function GET() {
  const db = new Database('data/porchrecords.db');
  
  try {
    console.log('🚀 Loading all homepage data in one request...');
    
    // 1. Get homepage sections
    const sections = db.prepare(`
      SELECT * FROM homepage_sections 
      WHERE is_active = 1 
      ORDER BY order_index ASC
    `).all();

    const parsedSections = sections.map((section: any) => ({
      id: section.id,
      section_type: section.section_type,
      section_data: JSON.parse(section.section_data),
      order_index: section.order_index,
      is_active: Boolean(section.is_active),
      created_at: section.created_at,
      updated_at: section.updated_at
    }));

    // 2. Get products for highlights/latest releases (if needed)
    let highlightProducts: any[] = [];
    let latestProducts: any[] = [];
    let shows: any[] = [];

    // Check if we need product data
    const needsProducts = parsedSections.some(s => 
      s.section_type === 'store-highlights' || s.section_type === 'latest_releases'
    );

    if (needsProducts) {
      // Get latest products (fast database query)
      const productQuery = `
        SELECT id, title, price, description, image, artist, genre, 
               product_type, stock_status, stock_quantity, created_at
        FROM products 
        WHERE is_visible = 1 AND is_from_square = 1
        ORDER BY created_at DESC 
        LIMIT 8
      `;
      
      const products = db.prepare(productQuery).all();
      
      // Transform for frontend
      const transformedProducts = products.map((product: any) => ({
        id: product.id,
        title: product.title,
        artist: product.artist || 'Unknown Artist',
        price: product.price || 0,
        image: product.image || '/store.webp',
        productType: product.product_type || 'record',
        stockStatus: product.stock_status || 'in_stock',
        viewCount: 0, // Could be enhanced with analytics
        returnRate: 0
      }));

      // Assign to both for now (could be made more specific)
      highlightProducts = transformedProducts.slice(0, 4);
      latestProducts = transformedProducts.slice(0, 4);
    }

    // 3. Get shows data (if needed)
    const needsShows = parsedSections.some(s => s.section_type === 'upcoming-shows');
    
    if (needsShows) {
      try {
        // Get shows from database or API (simplified for now)
        const showsQuery = `
          SELECT id, title, artist, date, time, venue, location, 
                 image, ticket_price, ticket_url, is_sold_out, genre
          FROM shows 
          WHERE date >= date('now') 
          ORDER BY date ASC 
          LIMIT 3
        `;
        
        const showsData = db.prepare(showsQuery).all();
        
        shows = showsData.map((show: any) => ({
          id: show.id,
          title: show.title,
          artist: show.artist,
          date: show.date,
          time: show.time,
          venue: show.venue,
          image: show.image || '/store.webp',
          ticketPrice: show.ticket_price,
          ticketUrl: show.ticket_url,
          isSoldOut: Boolean(show.is_sold_out),
          genre: show.genre
        }));
      } catch (error) {
        console.warn('Shows table might not exist, using empty array');
        shows = [];
      }
    }

    console.log(`✅ Loaded homepage data: ${parsedSections.length} sections, ${highlightProducts.length} products, ${shows.length} shows`);

    return NextResponse.json({
      success: true,
      sections: parsedSections,
      data: {
        highlightProducts,
        latestProducts,
        shows
      },
      loadTime: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' // 5 min cache
      }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error loading homepage data:', error);
    
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  } finally {
    db.close();
  }
}

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SHOWS_FILE = path.join(process.cwd(), 'src', 'data', 'shows.json');

const readShows = () => {
  try {
    if (fs.existsSync(SHOWS_FILE)) {
      const data = fs.readFileSync(SHOWS_FILE, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error reading shows file:', error);
    return [];
  }
};

// GET - Fetch upcoming shows
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '3');
    const includePast = searchParams.get('includePast') === 'true';

    const allShows = readShows();
    
    // Filter shows based on criteria
    let filteredShows = allShows.filter((show: any) => {
      // Only include published shows
      if (!show.isPublished) return false;
      
      // Filter by date if not including past shows
      if (!includePast) {
        const showDate = new Date(show.date);
        const now = new Date();
        return showDate > now;
      }
      
      return true;
    });

    // Sort by date (upcoming first)
    filteredShows.sort((a: any, b: any) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA.getTime() - dateB.getTime();
    });

    // Limit results
    const upcomingShows = filteredShows.slice(0, limit);

    // Transform the data to match the component's interface
    const transformedShows = upcomingShows.map((show: any) => {
      const showDate = new Date(show.date);
      const endDate = show.endDate ? new Date(show.endDate) : null;
      
      // Extract time from date
      const time = showDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      // Extract venue name from full address
      const venue = show.location.split(',')[0] || show.location;
      
      // Extract artist from title (common patterns)
      const artist = show.title.includes(' - ') ? show.title.split(' - ')[1] : 
                    show.title.includes(' x ') ? show.title.split(' x ')[1] : 
                    show.title;

      // Extract ticket URL from Humanitix embed if available
      let ticketUrl = null;
      if (show.humanitixEmbed) {
        const match = show.humanitixEmbed.match(/src='([^']+)'/);
        if (match) {
          ticketUrl = match[1];
        }
      }

      // Determine if sold out (this would need to be implemented based on your ticketing system)
      const isSoldOut = false; // Placeholder - would need integration with Humanitix API

      return {
        id: show.id,
        title: show.title,
        artist: artist,
        date: show.date,
        time: time,
        venue: venue,
        location: show.location, // Keep full location for address field
        image: show.image,
        ticketPrice: null, // Would need to extract from Humanitix embed or API
        ticketUrl: ticketUrl,
        isSoldOut: isSoldOut,
        genre: null, // Would need to be added to show data
        description: show.description,
        endDate: show.endDate,
        humanitixEmbed: show.humanitixEmbed
      };
    });

    return NextResponse.json({
      success: true,
      shows: transformedShows,
      count: transformedShows.length,
      total: allShows.length
    });

  } catch (error) {
    console.error('Error fetching upcoming shows:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch upcoming shows',
        shows: []
      },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { withAdminAuth } from '@/lib/route-protection';

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

const writeShows = (shows: any[]) => {
  try {
    const dir = path.dirname(SHOWS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SHOWS_FILE, JSON.stringify(shows, null, 2));
  } catch (error) {
    console.error('Error writing shows file:', error);
    throw error;
  }
};

// GET - Fetch all shows
async function getHandler() {
  try {
    const shows = readShows();
    
    return NextResponse.json({
      shows,
      total: shows.length,
    });
  } catch (error) {
    console.error('Error fetching shows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shows' },
      { status: 500 }
    );
  }
}

// POST - Create or update a show
async function postHandler(request: NextRequest) {
  try {
    const showData = await request.json();
    
    // Validate required fields
    if (!showData.title || !showData.description || !showData.date || !showData.location || !showData.humanitixEmbed) {
      return NextResponse.json(
        { error: 'Title, description, date, location, and humanitixEmbed are required' },
        { status: 400 }
      );
    }

    const existingShows = readShows();
    
    // Check if show already exists
    const existingShowIndex = existingShows.findIndex((show: any) => show.id === showData.id);
    
    if (existingShowIndex !== -1) {
      // Update existing show
      existingShows[existingShowIndex] = {
        ...existingShows[existingShowIndex],
        ...showData,
        lastModified: new Date().toISOString(),
      };
    } else {
      // Create new show
      const newShow = {
        id: showData.id || `show_${Date.now()}`,
        title: showData.title,
        description: showData.description,
        date: showData.date,
        endDate: showData.endDate || '',
        location: showData.location,
        image: showData.image || '/hero-image.jpg',
        humanitixEmbed: showData.humanitixEmbed,
        isPast: showData.isPast || false,
        isPublished: showData.isPublished !== false,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
      };
      existingShows.push(newShow);
    }

    writeShows(existingShows);

    return NextResponse.json({
      success: true,
      message: existingShowIndex !== -1 ? 'Show updated successfully' : 'Show created successfully'
    });
  } catch (error) {
    console.error('Error saving show:', error);
    return NextResponse.json(
      { error: 'Failed to save show' },
      { status: 500 }
    );
  }
}

// Export with admin authentication
export const GET = withAdminAuth(getHandler);
export const POST = withAdminAuth(postHandler, true); 
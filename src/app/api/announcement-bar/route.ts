import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ANNOUNCEMENT_BAR_FILE = path.join(process.cwd(), 'src', 'data', 'announcementBar.json');

// Helper function to read announcement bar settings from file
function readAnnouncementBarSettings(): any {
  try {
    if (fs.existsSync(ANNOUNCEMENT_BAR_FILE)) {
      const data = fs.readFileSync(ANNOUNCEMENT_BAR_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading announcement bar file:', error);
  }
  return {
    isEnabled: false,
    text: "",
    backgroundColor: "#1f2937",
    textColor: "#ffffff",
    speed: 20,
    updatedAt: null
  };
}

// GET - Fetch announcement bar settings for public use
export async function GET() {
  try {
    const settings = readAnnouncementBarSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching announcement bar settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch announcement bar settings' },
      { status: 500 }
    );
  }
} 